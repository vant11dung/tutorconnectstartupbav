const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

// Đọc cấu hình từ file config hoặc biến môi trường
const JWT_SECRET = process.env.JWT_SECRET || 'tutormate_secure_jwt_secret_key_2026';
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutormate';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// MONGOOSE SCHEMAS & MODELS
// ==========================================
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'tutor', 'admin'], default: 'student' },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  subjects: [{ type: String }],
  hourlyRate: { type: Number, default: 0 },
  location: { type: String, default: '' },
  verified: { type: Boolean, default: false }
}, { timestamps: true });

const tutorRequestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  subject: { type: String, required: true },
  grade: { type: String, required: true },
  budget: { type: Number, required: true },
  description: { type: String },
  status: { type: String, enum: ['open', 'matched', 'cancelled'], default: 'open' }
}, { timestamps: true });

const appointmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  hourlyRate: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' }
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String }
}, { timestamps: true });

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, default: 'wallet' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const TutorRequest = mongoose.model('TutorRequest', tutorRequestSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);
const Review = mongoose.model('Review', reviewSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Không tìm thấy Token xác thực' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

// ==========================================
// API ROUTES
// ==========================================

// --- AUTH ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email đã tồn tại' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: ['student', 'tutor'].includes(role) ? role : 'student' // Không cho đăng ký thẳng làm admin
    });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
});

// --- USER PROFILE (Sửa Mass Assignment) ---
app.put('/api/users/:id', authenticate, async (req, res) => {
  try {
    // Phân quyền: Chỉ chính chủ hoặc admin mới được cập nhật
    if (req.params.id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền sửa thông tin tài khoản này' });
    }

    // KHẮC PHỤC MASS ASSIGNMENT: Chỉ lọc danh sách các trường an toàn
    const allowedUpdates = {};
    const { name, avatar, bio, subjects, hourlyRate, location } = req.body;

    if (name !== undefined) allowedUpdates.name = name;
    if (avatar !== undefined) allowedUpdates.avatar = avatar;
    if (bio !== undefined) allowedUpdates.bio = bio;
    if (subjects !== undefined) allowedUpdates.subjects = subjects;
    if (hourlyRate !== undefined) allowedUpdates.hourlyRate = hourlyRate;
    if (location !== undefined) allowedUpdates.location = location;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật người dùng', error: err.message });
  }
});

// --- TUTOR REQUESTS (Sửa logic gia sư nhận lớp) ---
app.put('/api/tutor-requests/:id', authenticate, async (req, res) => {
  try {
    const request = await TutorRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });

    const { status, subject, grade, budget, description } = req.body;

    // TH1: Gia sư nhận lớp (Đổi status sang matched)
    if (req.userRole === 'tutor' && status === 'matched') {
      if (request.status !== 'open') {
        return res.status(400).json({ message: 'Yêu cầu này đã đóng hoặc đã có người nhận' });
      }
      request.status = 'matched';
      request.tutorId = req.userId;
    }
    // TH2: Học sinh sở hữu hoặc Admin sửa thông tin yêu cầu
    else if (request.studentId.toString() === req.userId || req.userRole === 'admin') {
      if (status) request.status = status;
      if (subject) request.subject = subject;
      if (grade) request.grade = grade;
      if (budget) request.budget = budget;
      if (description) request.description = description;
    } else {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật yêu cầu này' });
    }

    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật', error: err.message });
  }
});

// --- APPOINTMENTS (Sửa IDOR và phân quyền Admin) ---
app.get('/api/appointments/:id', authenticate, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id)
      .populate('studentId', 'name email avatar')
      .populate('tutorId', 'name email avatar');

    if (!appt) return res.status(404).json({ message: 'Không tìm thấy lịch học' });

    // KHẮC PHỤC IDOR: Kiểm tra chính chủ hoặc Admin
    const isStudent = appt.studentId._id.toString() === req.userId;
    const isTutor = appt.tutorId._id.toString() === req.userId;
    const isAdmin = req.userRole === 'admin';

    if (!isStudent && !isTutor && !isAdmin) {
      return res.status(403).json({ message: 'Bạn không có quyền xem chi tiết lịch học này' });
    }

    res.json(appt);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

app.put('/api/appointments/:id', authenticate, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Không tìm thấy lịch học' });

    // KHẮC PHỤC PERMISSION: Bổ sung cho phép Admin cập nhật
    const isStudent = appt.studentId.toString() === req.userId;
    const isTutor = appt.tutorId.toString() === req.userId;
    const isAdmin = req.userRole === 'admin';

    if (!isStudent && !isTutor && !isAdmin) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa lịch học này' });
    }

    const { status } = req.body;
    if (status) appt.status = status;
    await appt.save();

    res.json(appt);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật', error: err.message });
  }
});

// --- REVIEWS (Kiểm tra điều kiện đã hoàn tất buổi học) ---
app.post('/api/reviews', authenticate, async (req, res) => {
  try {
    const { tutorId, appointmentId, rating, comment } = req.body;

    // Kiểm tra xem học sinh đã từng hoàn thành (completed) buổi học này với gia sư chưa
    const validAppointment = await Appointment.findOne({
      _id: appointmentId,
      studentId: req.userId,
      tutorId: tutorId,
      status: 'completed'
    });

    if (!validAppointment) {
      return res.status(400).json({ message: 'Bạn chỉ có thể đánh giá gia sư sau khi hoàn thành buổi học' });
    }

    // Kiểm tra xem đã đánh giá buổi học này chưa
    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      return res.status(400).json({ message: 'Bạn đã gửi đánh giá cho buổi học này rồi' });
    }

    const review = new Review({
      studentId: req.userId,
      tutorId,
      appointmentId,
      rating,
      comment
    });

    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi gửi đánh giá', error: err.message });
  }
});

// --- TRANSACTIONS (Lấy giá trị amount thực tế từ Appointment) ---
app.post('/api/transactions', authenticate, async (req, res) => {
  try {
    const { appointmentId, paymentMethod } = req.body;

    const appt = await Appointment.findById(appointmentId);
    if (!appt) return res.status(404).json({ message: 'Không tìm thấy lịch học' });

    if (appt.studentId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền thanh toán cho lịch học này' });
    }

    // Tính toán số tiền trực tiếp từ cơ sở dữ liệu thay vì tin vào client
    const transaction = new Transaction({
      userId: req.userId,
      appointmentId,
      amount: appt.totalAmount, 
      paymentMethod: paymentMethod || 'wallet',
      status: 'completed'
    });

    await transaction.save();

    // Cập nhật trạng thái lịch học sau khi thanh toán thành công
    appt.status = 'confirmed';
    await appt.save();

    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi giao dịch thanh toán', error: err.message });
  }
});

// ==========================================
// KẾT NỐI MONGOOSE & KHỞI CHẠY SERVER
// ==========================================
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => console.log(`Server TutorMate running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));