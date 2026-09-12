const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tutormate', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// ===== MODELS =====

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: String,
  role: { type: String, enum: ['student', 'tutor', 'admin'], default: 'student' },
  avatar: String,
  bio: String,
  phone: String,
  address: String,
  subjects: [String],
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  hourlyRate: Number,
  experience: String,
  education: String,
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);

// Appointment Schema
const AppointmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: String,
  dateTime: Date,
  duration: Number, // in minutes
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  notes: String,
  classroomUrl: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Appointment = mongoose.model('Appointment', AppointmentSchema);

// Message Schema
const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', MessageSchema);

// Review Schema
const ReviewSchema = new mongoose.Schema({
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: String,
  appointmentId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
});

const Review = mongoose.model('Review', ReviewSchema);

// Transaction Schema
const TransactionSchema = new mongoose.Schema({
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  status: { type: String, enum: ['pending', 'completed', 'refunded'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

// Tutor Request Schema
const TutorRequestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: String,
  description: String,
  budget: Number,
  preferredTime: String,
  status: { type: String, enum: ['open', 'matched', 'completed'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
});

const TutorRequest = mongoose.model('TutorRequest', TutorRequestSchema);

// ===== AUTHENTICATION =====

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function generateToken(user) {
  return jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No token provided' });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(403).json({ error: 'Invalid token' });

  req.userId = decoded.userId;
  req.userRole = decoded.role;
  next();
}

// ===== ROUTES =====

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role: role || 'student',
    });

    await user.save();

    const token = generateToken(user);
    res.status(201).json({
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== USER ROUTES =====

// Get user profile
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.userId !== req.params.id && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search tutors
app.get('/api/users/search/tutors', async (req, res) => {
  try {
    const { subject, minRating } = req.query;
    let query = { role: 'tutor', verified: true };

    if (subject) {
      query.subjects = { $in: [subject] };
    }
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    const tutors = await User.find(query).select('-password');
    res.json(tutors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== APPOINTMENT ROUTES =====

// Create appointment
app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const { tutorId, subject, dateTime, duration, notes } = req.body;

    const appointment = new Appointment({
      studentId: req.userId,
      tutorId,
      subject,
      dateTime,
      duration,
      notes,
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointments
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    let query = {};
    if (req.userRole === 'student') {
      query.studentId = req.userId;
    } else if (req.userRole === 'tutor') {
      query.tutorId = req.userId;
    }

    const appointments = await Appointment.find(query)
      .populate('studentId', '-password')
      .populate('tutorId', '-password')
      .sort({ dateTime: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single appointment
app.get('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('studentId', '-password')
      .populate('tutorId', '-password');

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update appointment
app.put('/api/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    // Check authorization
    if (appointment.studentId.toString() !== req.userId && appointment.tutorId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== MESSAGE ROUTES =====

// Send message
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    const message = new Message({
      senderId: req.userId,
      receiverId,
      content,
    });

    await message.save();
    await message.populate('senderId', '-password').populate('receiverId', '-password');
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages conversation
app.get('/api/messages/:otherUserId', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.userId, receiverId: req.params.otherUserId },
        { senderId: req.params.otherUserId, receiverId: req.userId },
      ],
    })
      .populate('senderId', '-password')
      .populate('receiverId', '-password')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark message as read
app.put('/api/messages/:id/read', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== REVIEW ROUTES =====

// Create review
app.post('/api/reviews', authenticateToken, async (req, res) => {
  try {
    const { tutorId, rating, comment, appointmentId } = req.body;

    const review = new Review({
      tutorId,
      studentId: req.userId,
      rating,
      comment,
      appointmentId,
    });

    await review.save();

    // Update tutor rating
    const reviews = await Review.find({ tutorId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await User.findByIdAndUpdate(tutorId, { rating: avgRating, totalReviews: reviews.length });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reviews for tutor
app.get('/api/reviews/:tutorId', async (req, res) => {
  try {
    const reviews = await Review.find({ tutorId: req.params.tutorId })
      .populate('studentId', '-password')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== TUTOR REQUEST ROUTES =====

// Create tutor request
app.post('/api/tutor-requests', authenticateToken, async (req, res) => {
  try {
    const { subject, description, budget, preferredTime } = req.body;

    const request = new TutorRequest({
      studentId: req.userId,
      subject,
      description,
      budget,
      preferredTime,
    });

    await request.save();
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tutor requests (for student)
app.get('/api/tutor-requests', authenticateToken, async (req, res) => {
  try {
    let query = {};
    if (req.userRole === 'student') {
      query.studentId = req.userId;
    }

    const requests = await TutorRequest.find(query)
      .populate('studentId', '-password')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update tutor request status
app.put('/api/tutor-requests/:id', authenticateToken, async (req, res) => {
  try {
    const request = await TutorRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (request.studentId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await TutorRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== TRANSACTION ROUTES =====

// Create transaction
app.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { tutorId, appointmentId, amount } = req.body;

    const transaction = new Transaction({
      tutorId,
      studentId: req.userId,
      appointmentId,
      amount,
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transactions
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    let query = {};
    if (req.userRole === 'tutor') {
      query.tutorId = req.userId;
    } else if (req.userRole === 'student') {
      query.studentId = req.userId;
    }

    const transactions = await Transaction.find(query)
      .populate('tutorId', '-password')
      .populate('studentId', '-password')
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ADMIN ROUTES =====

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify tutor (admin only)
app.put('/api/admin/users/:id/verify', authenticateToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const user = await User.findByIdAndUpdate(req.params.id, { verified: true }, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats (admin only)
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const totalUsers = await User.countDocuments();
    const totalTutors = await User.countDocuments({ role: 'tutor' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalAppointments = await Appointment.countDocuments();
    const totalRevenue = await Transaction.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      totalUsers,
      totalTutors,
      totalStudents,
      totalAppointments,
      revenue: totalRevenue[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});
// Tạo demo accounts khi server start
async function createDemoAccounts() {
  try {
    const demoAccounts = [
      { 
        email: 'student@example.com', 
        password: 'password123', 
        name: 'An Lâm', 
        role: 'student' 
      },
      { 
        email: 'tutor@example.com', 
        password: 'password123', 
        name: 'Ngọc Mai', 
        role: 'tutor',
        subjects: ['Toán', 'Vật lý'],
        rating: 4.9,
        totalReviews: 126,
        verified: true
      },
      { 
        email: 'admin@example.com', 
        password: 'password123', 
        name: 'Nguyễn Hoàng', 
        role: 'admin' 
      }
    ];

    for (const account of demoAccounts) {
      const exists = await User.findOne({ email: account.email });
      if (!exists) {
        const hashedPassword = await bcrypt.hash(account.password, 10);
        await User.create({
          ...account,
          password: hashedPassword
        });
        console.log(`✅ Created demo account: ${account.email}`);
      }
    }
  } catch (error) {
    console.error('Error creating demo accounts:', error.message);
  }
}

// Gọi function này trước khi start server
db.once('open', async () => {
  console.log('Connected to MongoDB');
  await createDemoAccounts();
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// Start server
