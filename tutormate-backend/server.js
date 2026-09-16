const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

const JWT_SECRET =
  process.env.JWT_SECRET || 'tutormate_secure_jwt_secret_key_2026';

const PORT = Number(process.env.PORT || 5000);

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tutormate';

const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

// ============================================================
// SCHEMAS
// ============================================================

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ['student', 'tutor', 'admin'],
      default: 'student',
    },

    avatar: {
      type: String,
      default: '',
    },

    bio: {
      type: String,
      default: '',
    },

    subjects: [
      {
        type: String,
      },
    ],

    hourlyRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    location: {
      type: String,
      default: '',
    },

    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const tutorRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    // Frontend hiện tại không gửi grade riêng.
    grade: {
      type: String,
      default: '',
      trim: true,
    },

    budget: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      default: '',
    },

    preferredTime: {
      type: String,
      default: '',
    },

    status: {
      type: String,
      enum: ['open', 'matched', 'cancelled'],
      default: 'open',
    },
  },
  {
    timestamps: true,
  }
);

const appointmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    notes: {
      type: String,
      default: '',
    },

    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);
// Indexes phục vụ truy vấn lịch và kiểm tra conflict nhanh hơn.
appointmentSchema.index({
  tutorId: 1,
  startTime: 1,
  status: 1,
});

appointmentSchema.index({
  studentId: 1,
  startTime: 1,
});

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const reviewSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    comment: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      default: 'wallet',
    },

    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// MODELS
// ============================================================

const User = mongoose.model('User', userSchema);
const TutorRequest = mongoose.model('TutorRequest', tutorRequestSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);
const Message = mongoose.model('Message', messageSchema);
const Review = mongoose.model('Review', reviewSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// ============================================================
// HELPERS
// ============================================================

function publicUser(user) {
  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    subjects: user.subjects,
    hourlyRate: user.hourlyRate,
    location: user.location,
    verified: user.verified,
  };
}

function errorResponse(res, status, message, err = null) {
  return res.status(status).json({
    message,
    error: message,
    ...(err ? { details: err.message } : {}),
  });
}

function requireObjectId(value, fieldName) {
  if (!mongoose.isValidObjectId(value)) {
    const error = new Error(`${fieldName} không hợp lệ`);
    error.status = 400;
    throw error;
  }
}

// ============================================================
// AUTH MIDDLEWARE
// ============================================================

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(
      res,
      401,
      'Không tìm thấy Token xác thực'
    );
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.userId = String(decoded.id);
    req.userRole = decoded.role;

    next();
  } catch (error) {
    return errorResponse(
      res,
      401,
      'Token không hợp lệ hoặc đã hết hạn'
    );
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return errorResponse(
        res,
        403,
        'Bạn không có quyền thực hiện thao tác này'
      );
    }

    next();
  };
}

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'tutormate-api',
    time: new Date().toISOString(),
  });
});

// ============================================================
// AUTH
// ============================================================

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return errorResponse(
        res,
        400,
        'Vui lòng nhập name, email và password'
      );
    }

    if (String(password).length < 6) {
      return errorResponse(
        res,
        400,
        'Mật khẩu phải có ít nhất 6 ký tự'
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await User.exists({
      email: normalizedEmail,
    });

    if (existingUser) {
      return errorResponse(
        res,
        400,
        'Email đã tồn tại'
      );
    }

    // Không cho đăng ký trực tiếp admin.
    const safeRole =
      role === 'tutor' ? 'tutor' : 'student';

    const hashedPassword = await bcrypt.hash(
      String(password),
      10
    );

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: safeRole,
    });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );

    res.status(201).json({
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error('REGISTER ERROR:', err);

    errorResponse(
      res,
      500,
      'Lỗi đăng ký tài khoản',
      err
    );
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(
        res,
        400,
        'Vui lòng nhập email và mật khẩu'
      );
    }

    const normalizedEmail =
      String(email).trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select('+password');

    if (
      !user ||
      !(await bcrypt.compare(
        String(password),
        user.password
      ))
    ) {
      return errorResponse(
        res,
        400,
        'Email hoặc mật khẩu không đúng'
      );
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );

    res.json({
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);

    errorResponse(
      res,
      500,
      'Lỗi đăng nhập',
      err
    );
  }
});


// ==========================================
// CURRENT AUTHENTICATED USER
// ==========================================
app.get(
  '/api/auth/me',
  authenticate,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.userId
        ).select('-password');

      if (!user) {
        return errorResponse(
          res,
          404,
          'Tài khoản không còn tồn tại'
        );
      }

      res.json(
        publicUser(user)
      );
    } catch (err) {
      console.error(
        'AUTH ME ERROR:',
        err
      );

      errorResponse(
        res,
        500,
        'Lỗi lấy tài khoản hiện tại',
        err
      );
    }
  }
);

// ============================================================
// USERS
// ============================================================

// GET PROFILE
app.get('/api/users/:id', authenticate, async (req, res) => {
  try {
    requireObjectId(req.params.id, 'User ID');

    const isOwner =
      req.params.id === req.userId;

    const isAdmin =
      req.userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return errorResponse(
        res,
        403,
        'Không có quyền xem tài khoản này'
      );
    }

    const user = await User.findById(
      req.params.id
    ).select('-password');

    if (!user) {
      return errorResponse(
        res,
        404,
        'Không tìm thấy người dùng'
      );
    }

    res.json(publicUser(user));
  } catch (err) {
    errorResponse(
      res,
      err.status || 500,
      err.status
        ? err.message
        : 'Lỗi lấy thông tin người dùng',
      err.status ? null : err
    );
  }
});

// UPDATE PROFILE
app.put('/api/users/:id', authenticate, async (req, res) => {
  try {
    requireObjectId(req.params.id, 'User ID');

    const isOwner =
      req.params.id === req.userId;

    const isAdmin =
      req.userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return errorResponse(
        res,
        403,
        'Không có quyền sửa thông tin tài khoản này'
      );
    }

    const allowedFields = [
      'name',
      'avatar',
      'bio',
      'subjects',
      'hourlyRate',
      'location',
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined) {
      updates.name = String(updates.name).trim();
    }

    if (updates.hourlyRate !== undefined) {
      updates.hourlyRate = Number(
        updates.hourlyRate
      );
    }

    const user =
      await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: updates,
        },
        {
          new: true,
          runValidators: true,
        }
      ).select('-password');

    if (!user) {
      return errorResponse(
        res,
        404,
        'Không tìm thấy người dùng'
      );
    }

    res.json(publicUser(user));
  } catch (err) {
    errorResponse(
      res,
      500,
      'Lỗi cập nhật người dùng',
      err
    );
  }
});

// SEARCH TUTORS
app.get(
  '/api/users/search/tutors',
  authenticate,
  async (req, res) => {
    try {
      const {
        subject = '',
        minRating = 0,
      } = req.query;

      const query = {
        role: 'tutor',
      };

      if (String(subject).trim()) {
        query.subjects = {
          $regex: String(subject).trim(),
          $options: 'i',
        };
      }

      const tutors = await User.find(query)
        .select('-password')
        .lean();

      const tutorIds = tutors.map(
        (tutor) => tutor._id
      );

      let ratings = [];

      if (tutorIds.length > 0) {
        ratings = await Review.aggregate([
          {
            $match: {
              tutorId: {
                $in: tutorIds,
              },
            },
          },
          {
            $group: {
              _id: '$tutorId',
              rating: {
                $avg: '$rating',
              },
              totalReviews: {
                $sum: 1,
              },
            },
          },
        ]);
      }

      const ratingMap = new Map(
        ratings.map((row) => [
          String(row._id),
          row,
        ])
      );

      const minRatingNumber =
        Number(minRating || 0);

      const result = tutors
        .map((tutor) => {
          const ratingData =
            ratingMap.get(
              String(tutor._id)
            );

          return {
            ...tutor,

            rating: ratingData
              ? Number(
                  ratingData.rating.toFixed(2)
                )
              : 0,

            totalReviews:
              ratingData?.totalReviews || 0,
          };
        })
        .filter(
          (tutor) =>
            Number(tutor.rating || 0) >=
            minRatingNumber
        );

      res.json(result);
    } catch (err) {
      errorResponse(
        res,
        500,
        'Lỗi tìm kiếm gia sư',
        err
      );
    }
  }
);

// ============================================================
// APPOINTMENTS
// ============================================================

// CREATE APPOINTMENT
// CREATE APPOINTMENT
app.post(
  '/api/appointments',
  authenticate,
  async (req, res) => {
    try {
      if (
        req.userRole !== 'student' &&
        req.userRole !== 'admin'
      ) {
        return errorResponse(
          res,
          403,
          'Chỉ học sinh mới có thể đặt lịch'
        );
      }

      const {
        tutorId,
        subject,
        startTime: rawStartTime,
        endTime: rawEndTime,

        // Legacy support:
        // giữ tương thích tạm thời với client cũ.
        dateTime,
        duration,

        notes = '',
      } = req.body;

      requireObjectId(
        tutorId,
        'Tutor ID'
      );

      const normalizedSubject = String(
        subject || ''
      ).trim();

      if (!normalizedSubject) {
        return errorResponse(
          res,
          400,
          'Subject không được để trống'
        );
      }

      const startInput =
        rawStartTime || dateTime;

      if (!startInput) {
        return errorResponse(
          res,
          400,
          'Thiếu startTime'
        );
      }

      const start =
        new Date(startInput);

      if (Number.isNaN(start.getTime())) {
        return errorResponse(
          res,
          400,
          'startTime không hợp lệ'
        );
      }

      const end = rawEndTime
        ? new Date(rawEndTime)
        : (() => {
            const minutes =
              Number(duration || 60);

            if (
              !Number.isFinite(minutes) ||
              minutes <= 0 ||
              minutes > 480
            ) {
              return null;
            }

            return new Date(
              start.getTime() +
                minutes * 60 * 1000
            );
          })();

      if (
        !end ||
        Number.isNaN(end.getTime()) ||
        end <= start
      ) {
        return errorResponse(
          res,
          400,
          'endTime không hợp lệ hoặc phải sau startTime'
        );
      }

      const durationMinutes =
        (end.getTime() - start.getTime()) /
        (60 * 1000);

      if (
        durationMinutes <= 0 ||
        durationMinutes > 480
      ) {
        return errorResponse(
          res,
          400,
          'Thời lượng buổi học phải từ 1 đến 480 phút'
        );
      }

      const tutor =
        await User.findOne({
          _id: tutorId,
          role: 'tutor',
        });

      if (!tutor) {
        return errorResponse(
          res,
          404,
          'Không tìm thấy gia sư'
        );
      }

      if (
        req.userRole !== 'admin' &&
        String(tutor._id) === req.userId
      ) {
        return errorResponse(
          res,
          400,
          'Không thể tự đặt lịch cho chính mình'
        );
      }

      if (start <= new Date()) {
        return errorResponse(
          res,
          400,
          'Không thể đặt lịch trong quá khứ'
        );
      }

      // Không cho một gia sư nhận hai lịch bị chồng thời gian.
      const conflict =
        await Appointment.findOne({
          tutorId,
          status: {
            $in: [
              'pending',
              'confirmed',
            ],
          },
          startTime: {
            $lt: end,
          },
          endTime: {
            $gt: start,
          },
        }).select('_id');

      if (conflict) {
        return errorResponse(
          res,
          409,
          'Khung giờ này đã có lịch học khác'
        );
      }

      const hourlyRate =
        Number(
          tutor.hourlyRate || 0
        );

      if (
        !Number.isFinite(hourlyRate) ||
        hourlyRate < 0
      ) {
        return errorResponse(
          res,
          500,
          'Hourly rate của gia sư không hợp lệ'
        );
      }

      const totalAmount =
        Math.round(
          (hourlyRate * durationMinutes) /
          60
        );

      const cleanNotes =
        String(notes || '').trim();

      if (cleanNotes.length > 2000) {
        return errorResponse(
          res,
          400,
          'Notes không được vượt quá 2000 ký tự'
        );
      }

      const appointment =
        await Appointment.create({
          studentId: req.userId,
          tutorId,
          subject: normalizedSubject,
          startTime: start,
          endTime: end,
          notes: cleanNotes,
          hourlyRate,
          totalAmount,
          status: 'pending',
        });

      const populated =
        await Appointment.findById(
          appointment._id
        )
          .populate(
            'studentId',
            'name email avatar'
          )
          .populate(
            'tutorId',
            'name email avatar subjects hourlyRate verified'
          );

      res.status(201).json(
        populated
      );
    } catch (err) {
      if (err.status) {
        return errorResponse(
          res,
          err.status,
          err.message
        );
      }

      errorResponse(
        res,
        500,
        'Lỗi tạo lịch học',
        err
      );
    }
  }
);
// GET MY APPOINTMENTS
app.get(
  '/api/appointments',
  authenticate,
  async (req, res) => {
    try {
      const filter =
        req.userRole === 'admin'
          ? {}
          : {
              $or: [
                {
                  studentId: req.userId,
                },
                {
                  tutorId: req.userId,
                },
              ],
            };

      const appointments =
        await Appointment.find(filter)
          .sort({
            startTime: 1,
          })
          .populate(
            'studentId',
            'name email avatar'
          )
          .populate(
            'tutorId',
            'name email avatar subjects hourlyRate verified'
          );

      res.json(appointments);
    } catch (err) {
      errorResponse(
        res,
        500,
        'Lỗi lấy danh sách lịch học',
        err
      );
    }
  }
);

// GET APPOINTMENT DETAIL
app.get(
  '/api/appointments/:id',
  authenticate,
  async (req, res) => {
    try {
      requireObjectId(
        req.params.id,
        'Appointment ID'
      );

      const appointment =
        await Appointment.findById(
          req.params.id
        )
          .populate(
            'studentId',
            'name email avatar'
          )
          .populate(
            'tutorId',
            'name email avatar subjects hourlyRate verified'
          );

      if (!appointment) {
        return errorResponse(
          res,
          404,
          'Không tìm thấy lịch học'
        );
      }

      const isOwner =
        String(
          appointment.studentId._id
        ) === req.userId ||
        String(
          appointment.tutorId._id
        ) === req.userId;

      const isAdmin =
        req.userRole === 'admin';

      if (!isOwner && !isAdmin) {
        return errorResponse(
          res,
          403,
          'Bạn không có quyền xem lịch học này'
        );
      }

      res.json(appointment);
    } catch (err) {
      errorResponse(
        res,
        500,
        'Lỗi lấy chi tiết lịch học',
        err
      );
    }
  }
);

// UPDATE APPOINTMENT
// UPDATE APPOINTMENT
app.put(
  '/api/appointments/:id',
  authenticate,
  async (req, res) => {
    try {
      requireObjectId(
        req.params.id,
        'Appointment ID'
      );

      const appointment =
        await Appointment.findById(
          req.params.id
        );

      if (!appointment) {
        return errorResponse(
          res,
          404,
          'Không tìm thấy lịch học'
        );
      }

      const isAdmin =
        req.userRole === 'admin';

      const isStudent =
        String(
          appointment.studentId
        ) === req.userId;

      const isTutor =
        String(
          appointment.tutorId
        ) === req.userId;

      if (
        !isAdmin &&
        !isStudent &&
        !isTutor
      ) {
        return errorResponse(
          res,
          403,
          'Bạn không có quyền chỉnh sửa lịch học này'
        );
      }

      const requestedStatus =
        req.body.status;

      if (
        requestedStatus !== undefined
      ) {
        const validStatuses = [
          'pending',
          'confirmed',
          'completed',
          'cancelled',
        ];

        if (
          !validStatuses.includes(
            requestedStatus
          )
        ) {
          return errorResponse(
            res,
            400,
            'Trạng thái lịch học không hợp lệ'
          );
        }

        const currentStatus =
          appointment.status;

        if (
          !isAdmin &&
          currentStatus === 'cancelled'
        ) {
          return errorResponse(
            res,
            409,
            'Lịch học đã bị hủy và không thể khôi phục'
          );
        }

        if (
          !isAdmin &&
          currentStatus === 'completed'
        ) {
          return errorResponse(
            res,
            409,
            'Lịch học đã hoàn thành và không thể thay đổi'
          );
        }

        let canChange = false;

        if (isAdmin) {
          canChange = true;
        } else if (isStudent) {
          canChange =
            requestedStatus ===
              'cancelled' &&
            (
              currentStatus ===
                'pending' ||
              currentStatus ===
                'confirmed'
            );
        } else if (isTutor) {
          canChange =
            (
              currentStatus ===
                'pending' &&
              (
                requestedStatus ===
                  'confirmed' ||
                requestedStatus ===
                  'cancelled'
              )
            ) ||
            (
              currentStatus ===
                'confirmed' &&
              (
                requestedStatus ===
                  'cancelled' ||
                (
                  requestedStatus ===
                    'completed' &&
                  new Date() >=
                    new Date(
                      appointment.endTime
                    )
                )
              )
            );
        }

        if (!canChange) {
          return errorResponse(
            res,
            403,
            'Bạn không có quyền chuyển lịch học sang trạng thái này'
          );
        }

        appointment.status =
          requestedStatus;
      }

      if (
        req.body.notes !== undefined
      ) {
        const notes =
          String(
            req.body.notes || ''
          ).trim();

        if (notes.length > 2000) {
          return errorResponse(
            res,
            400,
            'Notes không được vượt quá 2000 ký tự'
          );
        }

        appointment.notes =
          notes;
      }

      const hasStartChange =
        req.body.startTime !== undefined;

      const hasEndChange =
        req.body.endTime !== undefined;

      if (
        hasStartChange ||
        hasEndChange
      ) {
        if (
          !isAdmin &&
          appointment.status !==
            'pending'
        ) {
          return errorResponse(
            res,
            409,
            'Chỉ có thể đổi thời gian khi lịch còn pending'
          );
        }

        const nextStart =
          hasStartChange
            ? new Date(
                req.body.startTime
              )
            : new Date(
                appointment.startTime
              );

        const nextEnd =
          hasEndChange
            ? new Date(
                req.body.endTime
              )
            : new Date(
                appointment.endTime
              );

        if (
          Number.isNaN(
            nextStart.getTime()
          )
        ) {
          return errorResponse(
            res,
            400,
            'startTime không hợp lệ'
          );
        }

        if (
          Number.isNaN(
            nextEnd.getTime()
          ) ||
          nextEnd <= nextStart
        ) {
          return errorResponse(
            res,
            400,
            'endTime không hợp lệ hoặc phải sau startTime'
          );
        }

        const durationMinutes =
          (
            nextEnd.getTime() -
            nextStart.getTime()
          ) /
          (60 * 1000);

        if (
          durationMinutes <= 0 ||
          durationMinutes > 480
        ) {
          return errorResponse(
            res,
            400,
            'Thời lượng buổi học phải từ 1 đến 480 phút'
          );
        }

        if (
          nextStart <= new Date()
        ) {
          return errorResponse(
            res,
            400,
            'Không thể đặt lịch trong quá khứ'
          );
        }

        const conflict =
          await Appointment.findOne({
            _id: {
              $ne:
                appointment._id,
            },
            tutorId:
              appointment.tutorId,
            status: {
              $in: [
                'pending',
                'confirmed',
              ],
            },
            startTime: {
              $lt: nextEnd,
            },
            endTime: {
              $gt: nextStart,
            },
          }).select('_id');

        if (conflict) {
          return errorResponse(
            res,
            409,
            'Khung giờ mới đã bị trùng với lịch học khác'
          );
        }

        appointment.startTime =
          nextStart;

        appointment.endTime =
          nextEnd;

        appointment.totalAmount =
          Math.round(
            (
              Number(
                appointment.hourlyRate ||
                  0
              ) *
              durationMinutes
            ) / 60
          );
      }

      await appointment.save();

      const populated =
        await Appointment.findById(
          appointment._id
        )
          .populate(
            'studentId',
            'name email avatar'
          )
          .populate(
            'tutorId',
            'name email avatar subjects hourlyRate verified'
          );

      res.json(
        populated
      );
    } catch (err) {
      errorResponse(
        res,
        err.status || 500,
        err.status
          ? err.message
          : 'Lỗi cập nhật lịch học',
        err.status
          ? null
          : err
      );
    }
  }
);
// ============================================================
// TUTOR REQUESTS
// ============================================================

// CREATE REQUEST
app.post(
  '/api/tutor-requests',
  authenticate,
  async (req, res) => {
    try {
      if (req.userRole !== 'student') {
        return errorResponse(
          res,
          403,
          'Chỉ học sinh mới có thể đăng nhu cầu'
        );
      }

      const {
        subject,
        description = '',
        budget,
        preferredTime = '',
        grade = '',
      } = req.body;

      const numericBudget =
        Number(budget);

      if (
        !subject ||
        !Number.isFinite(
          numericBudget
        ) ||
        numericBudget <= 0
      ) {
        return errorResponse(
          res,
          400,
          'Thiếu subject hoặc budget hợp lệ'
        );
      }

      const request =
        await TutorRequest.create({
          studentId: req.userId,
          subject: String(
            subject
          ).trim(),
          grade: String(
            grade || ''
          ),
          budget: numericBudget,
          description: String(
            description || ''
          ),
          preferredTime: String(
            preferredTime || ''
          ),
          status: 'open',
        });

      const populated =
        await TutorRequest.findById(
          request._id
        )
          .populate(
            'studentId',
            'name email avatar'
          )
          .populate(
            'tutorId',
            'name email avatar'
          );

      res.status(201).json(
        populated
      );
    } catch (err) {
      errorResponse(
        res,
        500,
        'Lỗi tạo yêu cầu tìm gia sư',
        err
      );
    }
  }
);

// GET REQUESTS
app.get(
  '/api/tutor-requests',
  authenticate,
  async (req, res) => {
    try {
      let filter;

      if (req.userRole === 'admin') {
        filter = {};
      } else if (req.userRole === 'tutor') {
        filter = {
          $or: [
            {
              status: 'open',
            },
            {
              tutorId: req.userId,
            },
          ],
        };
      } else {
        filter = {
          studentId: req.userId,
        };
      }

      const requests =
        await TutorRequest.find(filter)
          .sort({
            createdAt: -1,
          })
          .populate(
            'studentId',
            'name email avatar'
          )
          .populate(
            'tutorId',
            'name email avatar'
          );

      res.json(requests);
    } catch (err) {
      errorResponse(
        res,
        500,
        'Lỗi lấy yêu cầu gia sư',
        err
      );
    }
  }
);

// UPDATE REQUEST
app.put(
  '/api/tutor-requests/:id',
  authenticate,
  async (req, res) => {
    try {
      requireObjectId(
        req.params.id,
        'Tutor Request ID'
      );

      const request =
        await TutorRequest.findById(
          req.params.id
        );

      if (!request) {
        return errorResponse(
          res,
          404,
          'Không tìm thấy yêu cầu'
        );
      }

      const {
        status,
        subject,
        grade,
        budget,
        description,
        preferredTime,
      } = req.body;

      // Tutor nhận lớp
      if (
        req.userRole === 'tutor' &&
        status === 'matched'
      ) {
        if (request.status !== 'open') {
          return errorResponse(
            res,
            400,
            'Yêu cầu này đã đóng hoặc đã có người nhận'
          );
        }

        request.status = 'matched';
        request.tutorId =
          req.userId;
      }

      // Student chính chủ hoặc Admin
      else if (
        req.userRole === 'admin' ||
        String(request.studentId) ===
          req.userId
      ) {
        if (
          status !== undefined &&
          ![
            'open',
            'matched',
            'cancelled',
          ].includes(status)
        ) {
          return errorResponse(
            res,
            400,
            'Trạng thái không hợp lệ'
          );
        }

        if (status !== undefined) {
          request.status = status;
        }

        if (subject !== undefined) {
          request.subject =
            String(subject).trim();
        }

        if (grade !== undefined) {
          request.grade =
            String(grade);
        }

        if (budget !== undefined) {
          const numericBudget =
            Number(budget);

          if (
            !Number.isFinite(
              numericBudget
            ) ||
            numericBudget <= 0
          ) {
            return errorResponse(
              res,
              400,
              'Budget không hợp lệ'
            );
          }

          request.budget =
            numericBudget;
        }

        if (
          description !== undefined
        ) {
          request.description =
            String(description);
        }

        if (
          preferredTime !== undefined
        ) {
          request.preferredTime =
            String(preferredTime);
        }
      }

      else {
        return errorResponse(
          res,
          403,
          'Bạn không có quyền cập nhật yêu cầu này'
        );
      }

      await request.save();

      const populated =
        await TutorRequest.findById(
          request._id
        )
          .populate(
            'studentId',
            'name email avatar'
          )
          .populate(
            'tutorId',
            'name email avatar'
          );

      res.json(populated);
    } catch (err) {
      errorResponse(
        res,
        500,
        'Lỗi cập nhật yêu cầu gia sư',
        err
      );
    }
  }
);

// ============================================================
// MESSAGES
// ============================================================

// SEND MESSAGE
app.post(
  '/api/messages',
  authenticate,
  async (req, res) => {
    try {
      const {
        receiverId,
        content,
      } = req.body;

      requireObjectId(
        receiverId,
        'Receiver ID'
      );

      if (
        !content ||
        !String(content).trim()
      ) {
        return errorResponse(
          res,
          400,
          'Nội dung tin nhắn không được để trống'
        );
      }

      if (
        String(receiverId) ===
        req.userId
      ) {
        return errorResponse(
          res,
          400,
          'Không thể gửi tin nhắn cho chính mình'
        );
      }

      const receiver =
        await User.findById(
          receiverId
        ).select('_id');

      if (!receiver) {
        return errorResponse(
          res,
          404,
          'Không tìm thấy người nhận'
        );
      }

      const message =
        await Message.create({
          senderId: req.userId,
          receiverId,
          content:
            String(content).trim(),
          read: false,
        });

      const populated =
        await Message.findById(
          message._id
        )
          .populate(
            'senderId',
            'name email avatar'
          )
          .populate(
            'receiverId',
            'name email avatar'
          );

      res.status(201).json(
        populated
      );
    } catch (err) {
      errorResponse(
        res,
        500,
        'Lỗi gửi tin nhắn',
        err
      );
    }
  }
);

// GET CONVERSATION
app.get(
  '/api/messages/:userId',
  authenticate,
  async (req, res) => {
    try {
      requireObjectId(
        req.params.userId,
        'User ID'
      );

      const otherUserId =
        String(req.params.userId);

      const messages =
        await Message.find({
          $or: [
            {
              senderId: req.userId,
              receiverId: otherUserId,
            },
            {
              senderId: otherUserId,
              receiverId: req.userId,
            },
          ],
        })
          .sort({
            createdAt: 1,
          })
          .populate(
            'senderId',
            'name email avatar'
          )
          .populate(
            'receiverId',
            'name email avatar'
          );

      // Đánh dấu tin nhận được là đã đọc.
      await Message.updateMany(
        {
          senderId: otherUserId,
          receiverId: req.userId,
          read: false,
        },
        {
          $set: {
            read: true,
          },
        }
      );

      res.json(messages);
    } catch (err) {
      errorResponse(
        res,
        500,
        'Lỗi lấy cuộc trò chuyện',
        err
      );
    }
  }
);

// MARK MESSAGE READ
app.put(
  '/api/messages/:id/read',
  authenticate,
  async (req, res) => {
    try {
      requireObjectId(
        req.params.id,
        'Message ID'
      );

      const message =
        await Message.findOneAndUpdate(
          {
            _id: req.params.id,
            receiverId: req.userId,
          },
          {
            $set: {
              read: true,
            },
          },
          {
            new: true,
          }
        )
          .populate(
            'senderId',
            'name email avatar'
          )
          .populate(
            'receiverId',
            'name email avatar'
          );

      if (!message) {
        return errorResponse(
          res,
          404,
          'Không tìm thấy tin nhắn hoặc bạn không có quyền'
        );
      }

      res.json(message);
    } catch (err) {
      errorResponse(
        res,
        500,
        'Lỗi đánh dấu tin nhắn đã đọc',
        err
      );
    }
  }
);

// ============================================================
// REVIEWS
// ============================================================

// CREATE REVIEW
app.post(
  '/api/reviews',
  authenticate,
  async (req, res) => {
    try {
      if (req.userRole !== 'student') {
        return errorResponse(
          res,
          403,
          'Chỉ học sinh mới có thể đánh giá'
        );
      }

      const {
        tutorId,
        appointmentId,
        rating,
        comment = '',
      } = req.body;

      requireObjectId(
        tutorId,
        'Tutor ID'
      );

      requireObjectId(
        appointmentId,
        'Appointment ID'
      );

      const numericRating =
        Number(rating);

      if (
        !Number.isFinite(
          numericRating
        ) ||
        numericRating < 1 ||
        numericRating > 5
      ) {
        return errorResponse(
          res,
          400,
          'Rating phải từ 1 đến 5'
        );
      }

      const appointment =
        await Appointment.findOne({
          _id: appointmentId,
          studentId: req.userId,
          tutorId,
          status: 'completed',
        });

      if (!appointment) {
        return errorResponse(
          res,
          400,
          'Bạn chỉ có thể đánh giá gia sư sau khi hoàn thành buổi học'
        );
      }

      const existingReview =
        await Review.exists({
          appointmentId,
        });

      if (existingReview) {
        return errorResponse(
          res,
          400,
          'Bạn đã gửi đánh giá cho buổi học này rồi'
        );
      }

      const review =
        await Review.create({
          studentId: req.userId,
          tutorId,
          appointmentId,
          rating: numericRating,
          comment: String(comment),
        });

      const populated =
        await Review.findById(
          review._id
        )
          .populate(
            'studentId',
            'name avatar'
          )
          .populate(
            'tutorId',
            'name avatar'
          );

      res.status(201).json(
        populated
      );
    } catch (err) {
      errorResponse(
        res,
        500,
        'Lỗi gửi đánh giá',
        err
      );
    }
  }
);

// GET REVIEWS FOR TUTOR
app.get(
  '/api/reviews/:tutorId',
  async (req, res) => {
    try {
      requireObjectId(
        req.params.tutorId,
        'Tutor ID'
      );

      const reviews =
        await Review.find({
          tutorId:
            req.params.tutorId,
        })
          .sort({
            createdAt: -1,
          })
          .populate(
            'studentId',
            'name avatar'
          )
          .populate(
            'tutorId',
            'name avatar'
          );

      res.json(reviews);
    } catch (err) {
      errorResponse(
        res,
        500,
        'Lỗi lấy đánh giá',
        err
      );
    }
  }
);

// ============================================================
// TRANSACTIONS
// ============================================================

// CREATE TRANSACTION
app.post(
  '/api/transactions',
  authenticate,
  async (req, res) => {
    try {
      const {
        appointmentId,
        paymentMethod = 'wallet',
      } = req.body;

      requireObjectId(
        appointmentId,
        'Appointment ID'
      );

      const appointment =
        await Appointment.findById(
          appointmentId
        );

      if (!appointment) {
        return errorResponse(
          res,
          404,
          'Không tìm thấy lịch học'
        );
      }

      const canPay =
        req.userRole === 'admin' ||
        String(
          appointment.studentId
        ) === req.userId;

      if (!canPay) {
        return errorResponse(
          res,
          403,
          'Bạn không có quyền thanh toán cho lịch học này'
        );
      }

      if (
        appointment.status ===
        'cancelled'
      ) {
        return errorResponse(
          res,
          400,
          'Không thể thanh toán lịch đã hủy'
        );
      }

      const alreadyPaid =
        await Transaction.exists({
          appointmentId,
          status: 'completed',
        });

      if (alreadyPaid) {
        return errorResponse(
          res,
          400,
          'Lịch học này đã được thanh toán'
        );
      }

      const transaction =
        await Transaction.create({
          userId: req.userId,
          studentId:
            appointment.studentId,
          tutorId:
            appointment.tutorId,
          appointmentId,
          amount:
            appointment.totalAmount,
          paymentMethod:
            String(
              paymentMethod || 'wallet'
            ),
          status: 'completed',
        });

      appointment.status =
        'confirmed';

      await appointment.save();

      const populated =
        await Transaction.findById(
          transaction._id
        )
          .populate(
            'studentId',
            'name email avatar'
          )
          .populate(
            'tutorId',
            'name email avatar'
          )
          .populate(
            'appointmentId'
          );

      res.status(201).json(
        populated
      );
    } catch (err) {
      errorResponse(
        res,
        500,
        'Lỗi giao dịch thanh toán',
        err
      );
    }
  }
);

// GET TRANSACTIONS
app.get(
  '/api/transactions',
  authenticate,
  async (req, res) => {
    try {
      let filter;

      if (req.userRole === 'admin') {
        filter = {};
      } else {
        filter = {
          $or: [
            {
              userId: req.userId,
            },
            {
              studentId: req.userId,
            },
            {
              tutorId: req.userId,
            },
          ],
        };
      }

      const transactions =
        await Transaction.find(filter)
          .sort({
            createdAt: -1,
          })
          .populate(
            'studentId',
            'name email avatar'
          )
          .populate(
            'tutorId',
            'name email avatar'
          )
          .populate(
            'appointmentId'
          );

      res.json(transactions);
    } catch (err) {
      errorResponse(
        res,
        500,
        'Lỗi lấy lịch sử giao dịch',
        err
      );
    }
  }
);

// ============================================================
// ADMIN
// ============================================================

// GET ALL USERS
app.get(
  '/api/admin/users',
  authenticate,
  requireRole('admin'),
  async (_req, res) => {
    try {
      const users =
        await User.find()
          .select('-password')
          .sort({
            createdAt: -1,
          });

      res.json(
        users.map(publicUser)
      );
    } catch (err) {
      errorResponse(
        res,
        500,
        'Lỗi lấy danh sách người dùng',
        err
      );
    }
  }
);

// VERIFY TUTOR
app.put(
  '/api/admin/users/:id/verify',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    try {
      requireObjectId(
        req.params.id,
        'User ID'
      );

      const user =
        await User.findOneAndUpdate(
          {
            _id: req.params.id,
            role: 'tutor',
          },
          {
            $set: {
              verified: true,
            },
          },
          {
            new: true,
          }
        ).select('-password');

      if (!user) {
        return errorResponse(
          res,
          404,
          'Không tìm thấy gia sư'
        );
      }

      res.json(
        publicUser(user)
      );
    } catch (err) {
      errorResponse(
        res,
        500,
        'Lỗi xác minh gia sư',
        err
      );
    }
  }
);

// ADMIN STATS
app.get(
  '/api/admin/stats',
  authenticate,
  requireRole('admin'),
  async (_req, res) => {
    try {
      const [
        totalUsers,
        totalTutors,
        totalStudents,
        totalAppointments,
        revenueAgg,
      ] = await Promise.all([
        User.countDocuments(),

        User.countDocuments({
          role: 'tutor',
        }),

        User.countDocuments({
          role: 'student',
        }),

        Appointment.countDocuments(),

        Transaction.aggregate([
          {
            $match: {
              status: 'completed',
            },
          },
          {
            $group: {
              _id: null,
              revenue: {
                $sum: '$amount',
              },
            },
          },
        ]),
      ]);

      res.json({
        totalUsers,
        totalTutors,
        totalStudents,
        totalAppointments,
        revenue:
          revenueAgg[0]?.revenue || 0,
      });
    } catch (err) {
      errorResponse(
        res,
        500,
        'Lỗi lấy thống kê admin',
        err
      );
    }
  }
);

// ============================================================
// 404
// ============================================================

app.use((req, res) => {
  errorResponse(
    res,
    404,
    `Không tìm thấy API: ${req.method} ${req.originalUrl}`
  );
});

// ============================================================
// GLOBAL ERROR
// ============================================================

app.use(
  (
    err,
    _req,
    res,
    _next
  ) => {
    console.error(
      'Unhandled server error:',
      err
    );

    errorResponse(
      res,
      500,
      'Lỗi server không xác định',
      err
    );
  }
);

// ============================================================
// DATABASE + SERVER
// ============================================================

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log(
      'MongoDB connected successfully'
    );

    app.listen(
      PORT,
      () => {
        console.log(
          `TutorMate API running on port ${PORT}`
        );

        console.log(
          `Health: http://localhost:${PORT}/api/health`
        );
      }
    );
  })
  .catch((err) => {
    console.error(
      'MongoDB connection error:',
      err
    );

    process.exit(1);
  });

module.exports = app;