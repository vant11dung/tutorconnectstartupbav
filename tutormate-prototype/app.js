'use strict';

/*
 * TutorMate - app.js
 * API ONLY + DEMO MOCK DATA SUPPORT
 */

const state = {
  role: 'student',
  currentView: 'dashboard',

  currentUser: null,

  selectedTutor: null,
  selectedTutorId: null,

  selectedConversationId: null,
  currentChatPartner: null,

  focusSeconds: 25 * 60,
  focusTimer: null,

  apiErrors: {},
  loading: {},

  data: {
    appointments: [],
    tutors: [],
    tutorRequests: [],
    conversations: [],
    messages: [],
    transactions: [],
    adminUsers: [],
    adminStats: null,
    progress: null,
    reviews: []
  }
};


/* =========================================================
   API CONFIG
========================================================= */

const API_BASE_URL =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://tutorconnectstartupbav.onrender.com/api';

/* =========================================================
   DEMO ACCOUNTS - Tài khoản demo cho giám khảo
========================================================= */

const DEMO_ACCOUNTS = {
  student: {
    id: 'demo-student-001',
    _id: 'demo-student-001',
    email: 'demo.student@tutormate.com',
    password: 'demo@123',
    name: 'An Lâm',
    role: 'student',
    avatar: 'AL',
    bio: 'Tôi là một học sinh lớp 10, đang tìm kiếm gia sư để cải thiện kỹ năng toán học và tiếng Anh.',
    subjects: ['Toán', 'Tiếng Anh'],
    hourlyRate: 0,
    location: 'Hà Nội',
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  tutor: {
    id: 'demo-tutor-001',
    _id: 'demo-tutor-001',
    email: 'demo.tutor@tutormate.com',
    password: 'demo@123',
    name: 'Ngọc Mai',
    role: 'tutor',
    avatar: 'NM',
    bio: 'Gia sư có 5 năm kinh nghiệm giảng dạy Toán, Tiếng Anh và Lý cho học sinh cấp 2 và cấp 3.',
    subjects: ['Toán', 'Tiếng Anh', 'Lý'],
    hourlyRate: 150000,
    location: 'Hà Nội',
    verified: true,
    availability: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
      { dayOfWeek: 1, startTime: '14:00', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '12:00' },
      { dayOfWeek: 5, startTime: '14:00', endTime: '18:00' },
      { dayOfWeek: 6, startTime: '10:00', endTime: '16:00' }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  admin: {
    id: 'demo-admin-001',
    _id: 'demo-admin-001',
    email: 'demo.admin@tutormate.com',
    password: 'demo@123',
    name: 'Nguyễn Hoàng',
    role: 'admin',
    avatar: 'NH',
    bio: 'Admin hệ thống TutorMate. Quản lý duyệt gia sư, xử lý khiếu nại và giám sát các lớp học.',
    subjects: [],
    hourlyRate: 0,
    location: 'Hà Nội',
    verified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

/* ============================================================
   DEMO MOCK DATA - Dữ liệu giả chuẩn hóa cho từng role
============================================================ */

const DEMO_MOCK_DATA = {
  student: {
    tutors: [
      {
        id: 'tutor-1',
        _id: 'tutor-1',
        name: 'Cô Linh Nguyễn',
        avatar: 'LN',
        subjects: ['Toán', 'Đại số'],
        hourlyRate: 300000,
        rating: 4.9,
        reviews: 126,
        verified: true,
        distance: 1.2,
        availability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
          { dayOfWeek: 3, startTime: '14:00', endTime: '18:00' }
        ]
      },
      {
        id: 'tutor-2',
        _id: 'tutor-2',
        name: 'Thầy Minh Phạm',
        avatar: 'MP',
        subjects: ['Tiếng Anh', 'IELTS'],
        hourlyRate: 350000,
        rating: 4.8,
        reviews: 94,
        verified: true,
        distance: 2.0,
        availability: [
          { dayOfWeek: 2, startTime: '15:30', endTime: '20:00' },
          { dayOfWeek: 5, startTime: '18:00', endTime: '21:00' }
        ]
      },
      {
        id: 'tutor-3',
        _id: 'tutor-3',
        name: 'Thầy Tuấn Khôi',
        avatar: 'TK',
        subjects: ['Vật lý', 'Hóa học'],
        hourlyRate: 280000,
        rating: 5.0,
        reviews: 78,
        verified: true,
        distance: 1.7,
        availability: [
          { dayOfWeek: 6, startTime: '10:00', endTime: '16:00' },
          { dayOfWeek: 0, startTime: '14:00', endTime: '19:00' }
        ]
      }
    ],
    
    appointments: [
      {
        id: 'apt-1',
        _id: 'apt-1',
        tutorId: { _id: 'tutor-1', name: 'Cô Linh Nguyễn' },
        tutorName: 'Cô Linh Nguyễn',
        subject: 'Toán 12 · Tích phân',
        startTime: new Date(2026, 7, 17, 9, 0),
        endTime: new Date(2026, 7, 17, 10, 30),
        status: 'confirmed',
        type: 'online',
        price: 300000
      },
      {
        id: 'apt-2',
        _id: 'apt-2',
        tutorId: { _id: 'tutor-2', name: 'Thầy Minh Phạm' },
        tutorName: 'Thầy Minh Phạm',
        subject: 'IELTS Speaking',
        startTime: new Date(2026, 7, 17, 15, 30),
        endTime: new Date(2026, 7, 17, 17, 0),
        status: 'confirmed',
        type: 'home',
        location: 'Quận Bình Thạnh',
        price: 350000
      },
      {
        id: 'apt-3',
        _id: 'apt-3',
        tutorId: { _id: 'tutor-3', name: 'Thầy Tuấn Khôi' },
        tutorName: 'Thầy Tuấn Khôi',
        subject: 'Ôn tập Vật lý',
        startTime: new Date(2026, 7, 17, 19, 30),
        endTime: new Date(2026, 7, 17, 20, 30),
        status: 'confirmed',
        type: 'group',
        members: 5,
        price: 150000
      }
    ],

    messages: [
      {
        id: 'msg-1',
        _id: 'msg-1',
        senderId: { _id: 'tutor-1', name: 'Cô Linh Nguyễn' },
        receiverId: { _id: 'demo-student-001', name: 'An Lâm' },
        senderName: 'Cô Linh Nguyễn',
        content: 'Em đã làm xong bài tập tích phân chưa? Chúng ta có thể thảo luận trong buổi học hôm nay.',
        timestamp: new Date(Date.now() - 30 * 60000),
        createdAt: new Date(Date.now() - 30 * 60000),
        read: true
      },
      {
        id: 'msg-2',
        _id: 'msg-2',
        senderId: { _id: 'demo-student-001', name: 'An Lâm' },
        receiverId: { _id: 'tutor-1', name: 'Cô Linh Nguyễn' },
        senderName: 'An Lâm',
        content: 'Dạ, em đã làm xong rồi. Em còn có chút thắc mắc ở phần tính nguyên hàm.',
        timestamp: new Date(Date.now() - 15 * 60000),
        createdAt: new Date(Date.now() - 15 * 60000),
        read: true
      },
      {
        id: 'msg-3',
        _id: 'msg-3',
        senderId: { _id: 'tutor-1', name: 'Cô Linh Nguyễn' },
        receiverId: { _id: 'demo-student-001', name: 'An Lâm' },
        senderName: 'Cô Linh Nguyễn',
        content: 'Được, chúng ta sẽ giải đáp phần đó trước. Em cố gắng thêm nhé!',
        timestamp: new Date(Date.now() - 5 * 60000),
        createdAt: new Date(Date.now() - 5 * 60000),
        read: false
      }
    ],

    reviews: [
      {
        id: 'review-1',
        tutorName: 'Cô Linh Nguyễn',
        rating: 5,
        comment: 'Giảng dạy rất rõ ràng, em hiểu bài tốt hơn rất nhiều.',
        date: new Date(2026, 7, 10)
      },
      {
        id: 'review-2',
        tutorName: 'Thầy Minh Phạm',
        rating: 4,
        comment: 'Thầy dạy IELTS rất tốt. Chỉ là thời gian chưa thật hợp lý.',
        date: new Date(2026, 7, 5)
      }
    ],

    transactions: [
      {
        id: 'trans-1',
        type: 'payment',
        description: 'Thanh toán học phí - Cô Linh Nguyễn',
        appointmentId: { subject: 'Thanh toán học phí - Cô Linh Nguyễn' },
        paymentMethod: 'Ví TutorMate',
        amount: -300000,
        date: new Date(2026, 7, 10),
        createdAt: new Date(2026, 7, 10),
        status: 'completed'
      },
      {
        id: 'trans-2',
        type: 'payment',
        description: 'Thanh toán học phí - Thầy Minh Phạm',
        appointmentId: { subject: 'Thanh toán học phí - Thầy Minh Phạm' },
        paymentMethod: 'Thẻ ATM / Banking',
        amount: -350000,
        date: new Date(2026, 7, 5),
        createdAt: new Date(2026, 7, 5),
        status: 'completed'
      },
      {
        id: 'trans-3',
        type: 'refund',
        description: 'Hoàn lại học phí',
        appointmentId: { subject: 'Hoàn lại học phí' },
        paymentMethod: 'Ví TutorMate',
        amount: 150000,
        date: new Date(2026, 6, 28),
        createdAt: new Date(2026, 6, 28),
        status: 'completed'
      }
    ],

    progress: {
      mathScore: 82,
      englishScore: 66,
      completedLessons: 9,
      goalTarget: 70
    }
  },

  tutor: {
    tutors: [
      {
        id: 'tutor-1',
        _id: 'tutor-1',
        name: 'Ngọc Mai',
        stats: {
          totalStudents: 24,
          thisMonth: 12,
          expectedIncome: 12800000,
          targetPercentage: 82
        }
      }
    ],

    studentRequests: [
      {
        id: 'req-1',
        _id: 'req-1',
        studentId: { _id: 'student-gh', name: 'Gia Hân' },
        studentName: 'Gia Hân',
        avatar: 'GH',
        subject: 'Toán 10',
        description: 'Muốn học 2 buổi/tuần',
        location: 'Quận 3',
        startDate: '25/08',
        budget: 300000
      },
      {
        id: 'req-2',
        _id: 'req-2',
        studentId: { _id: 'student-hp', name: 'Hoàng Phúc' },
        studentName: 'Hoàng Phúc',
        avatar: 'HP',
        subject: 'Toán 12',
        description: 'Ôn thi THPT',
        location: 'Trực tuyến',
        time: 'Buổi tối',
        budget: 350000
      },
      {
        id: 'req-3',
        _id: 'req-3',
        studentId: { _id: 'student-my', name: 'Minh Yến' },
        studentName: 'Minh Yến',
        avatar: 'MY',
        subject: 'Toán 8',
        description: 'Cần củng cố nền tảng',
        location: 'Quận 1',
        time: 'Cuối tuần',
        budget: 250000
      }
    ],

    appointments: [
      {
        id: 'apt-1',
        _id: 'apt-1',
        studentId: { _id: 'student-al', name: 'An Lâm' },
        studentName: 'An Lâm',
        subject: 'Toán 12 với An Lâm',
        startTime: new Date(2026, 7, 17, 9, 0),
        endTime: new Date(2026, 7, 17, 10, 30),
        status: 'confirmed',
        type: 'online',
        price: 300000
      },
      {
        id: 'apt-2',
        _id: 'apt-2',
        studentId: { _id: 'student-gh', name: 'Gia Hân' },
        studentName: 'Gia Hân',
        subject: 'Toán 10 với Gia Hân',
        startTime: new Date(2026, 7, 17, 15, 30),
        endTime: new Date(2026, 7, 17, 17, 0),
        status: 'confirmed',
        type: 'home',
        location: 'Quận 3',
        price: 300000
      },
      {
        id: 'apt-3',
        _id: 'apt-3',
        studentId: { _id: 'student-group', name: 'Lớp nhóm ôn thi' },
        studentName: 'Lớp nhóm',
        subject: 'Lớp nhóm ôn thi',
        startTime: new Date(2026, 7, 17, 19, 0),
        endTime: new Date(2026, 7, 17, 20, 30),
        status: 'confirmed',
        type: 'group',
        members: 6,
        price: 1800000
      }
    ],

    messages: [
      {
        id: 'msg-1',
        _id: 'msg-1',
        senderId: { _id: 'student-al', name: 'An Lâm' },
        receiverId: { _id: 'demo-tutor-001', name: 'Ngọc Mai' },
        senderName: 'An Lâm',
        content: 'Thầy/Cô ơi, em có thắc mắc về tích phân từng phần',
        timestamp: new Date(Date.now() - 45 * 60000),
        createdAt: new Date(Date.now() - 45 * 60000),
        read: true
      },
      {
        id: 'msg-2',
        _id: 'msg-2',
        senderId: { _id: 'student-gh', name: 'Gia Hân' },
        receiverId: { _id: 'demo-tutor-001', name: 'Ngọc Mai' },
        senderName: 'Gia Hân',
        content: 'Cô ơi, ngày mai em có thể học sớm hơn được không?',
        timestamp: new Date(Date.now() - 20 * 60000),
        createdAt: new Date(Date.now() - 20 * 60000),
        read: false
      }
    ],

    transactions: [
      {
        id: 'trans-1',
        _id: 'trans-1',
        type: 'payment',
        description: 'Học phí - An Lâm',
        appointmentId: { subject: 'Toán 12 với An Lâm' },
        paymentMethod: 'Nhận chuyển khoản',
        amount: 300000,
        createdAt: new Date(2026, 7, 10),
        status: 'completed'
      },
      {
        id: 'trans-2',
        _id: 'trans-2',
        type: 'payment',
        description: 'Học phí - Gia Hân',
        appointmentId: { subject: 'Toán 10 với Gia Hân' },
        paymentMethod: 'Ví TutorMate',
        amount: 300000,
        createdAt: new Date(2026, 7, 12),
        status: 'completed'
      }
    ],

    earnings: {
      available: 8450000,
      nextPayout: '25/08/2026',
      thisMonth: 12800000,
      lastMonth: 11200000
    }
  },

  admin: {
    stats: {
      activeUsers: 2846,
      totalUsers: 2846,
      newToday: 45,
      pendingReviews: 7,
      completedSessions: 1284,
      totalAppointments: 1284,
      monthlyRevenue: 184600000,
      revenue: 184600000,
      growth: 9.4
    },

    pendingReviews: [
      {
        id: 'review-1',
        _id: 'review-1',
        name: 'Trần Khánh',
        email: 'khanh.tran@tutormate.com',
        role: 'tutor',
        avatar: 'TK',
        university: 'ĐH Sư phạm TP.HCM',
        subject: 'Tiếng Anh',
        subjects: ['Tiếng Anh'],
        submittedTime: '08:30 hôm nay',
        status: 'waiting',
        verified: false
      },
      {
        id: 'review-2',
        _id: 'review-2',
        name: 'Phương Anh',
        email: 'phuonganh@tutormate.com',
        role: 'tutor',
        avatar: 'PA',
        university: 'ĐH Kinh tế TP.HCM',
        subject: 'Toán cấp 2',
        subjects: ['Toán cấp 2'],
        submittedTime: 'Hôm qua',
        status: 'waiting',
        verified: false
      },
      {
        id: 'review-3',
        _id: 'review-3',
        name: 'Nguyễn Huy',
        email: 'huy.nguyen@tutormate.com',
        role: 'tutor',
        avatar: 'NH',
        university: 'ĐH Bách Khoa',
        subject: 'Vật lý',
        subjects: ['Vật lý'],
        submittedTime: '16/08/2026',
        status: 'verified',
        verified: true
      }
    ],

    recentTransactions: [
      {
        id: 'trans-1',
        _id: 'trans-1',
        type: 'in',
        description: 'Học phí · An Lâm',
        appointmentId: { subject: 'Học phí · An Lâm' },
        paymentMethod: 'Cổng thanh toán',
        amount: 640000,
        createdAt: new Date(),
        timestamp: 'Hôm nay, 08:42',
        status: 'completed'
      },
      {
        id: 'trans-2',
        _id: 'trans-2',
        type: 'in',
        description: 'Học phí · Gia Hân',
        appointmentId: { subject: 'Học phí · Gia Hân' },
        paymentMethod: 'Cổng thanh toán',
        amount: 480000,
        createdAt: new Date(Date.now() - 86400000),
        timestamp: 'Hôm qua, 20:18',
        status: 'completed'
      }
    ],

    messages: [
      {
        id: 'msg-1',
        _id: 'msg-1',
        senderId: { _id: 'tutor-1', name: 'Cô Linh Nguyễn' },
        senderName: 'Gia sư: Cô Linh',
        content: 'Có vấn đề về thanh toán cần hỗ trợ',
        timestamp: new Date(Date.now() - 2 * 60000),
        createdAt: new Date(Date.now() - 2 * 60000),
        read: false
      },
      {
        id: 'msg-2',
        _id: 'msg-2',
        senderId: { _id: 'student-my', name: 'Minh Yến' },
        senderName: 'Học sinh: Minh Yến',
        content: 'Báo cáo: Gia sư không tới buổi học',
        timestamp: new Date(Date.now() - 3600000),
        createdAt: new Date(Date.now() - 3600000),
        read: false
      }
    ]
  }
};

// Hàm load mock data dựa trên role
function loadDemoMockData(role) {
  const mockData = DEMO_MOCK_DATA[role];
  
  if (!mockData) {
    console.error('Mock data không tìm thấy cho role:', role);
    return null;
  }

  // Cập nhật state.data với mock data
  if (mockData.tutors) {
    state.data.tutors = mockData.tutors;
  }
  if (mockData.appointments) {
    state.data.appointments = mockData.appointments;
  }
  if (mockData.messages) {
    state.data.messages = mockData.messages;
  }
  if (mockData.reviews) {
    state.data.reviews = mockData.reviews;
  }
  if (mockData.transactions) {
    state.data.transactions = mockData.transactions;
  }
  if (mockData.studentRequests) {
    state.data.tutorRequests = mockData.studentRequests;
  }
  if (mockData.stats) {
    state.data.adminStats = mockData.stats;
  }
  if (mockData.pendingReviews) {
    state.data.adminUsers = mockData.pendingReviews;
  }
  if (mockData.progress) {
    state.data.progress = mockData.progress;
  }

  buildConversationsFromAppointments();

  return mockData;
}

function isDemoAccount(email) {
  return Object.values(DEMO_ACCOUNTS).some(acc => acc.email === email);
}

function getDemoAccount(email) {
  return Object.values(DEMO_ACCOUNTS).find(acc => acc.email === email);
}

// Hàm demo login - load mock data thay vì API
function demoDemoLogin(role) {
  const demoAccount = DEMO_ACCOUNTS[role];
  
  if (!demoAccount) {
    showToast('❌ Tài khoản demo không tồn tại');
    return;
  }

  try {
    // Lưu token & user
    saveToken('demo_token_' + role + '_' + Date.now());
    saveCurrentUser(demoAccount);

    // Cập nhật state
    state.currentUser = demoAccount;
    state.role = role;

    // Load mock data thay vì API
    loadDemoMockData(role);

    // Hiển thị UI
    showAuthScreen(false);
    applyIdentity();
    renderNav();

    // Render tất cả views với mock data
    renderAllViews();
    navigateWithoutFetch('dashboard');

    showToast(`✅ Đăng nhập demo thành công: ${demoAccount.name}`);
  } catch (error) {
    console.error('Demo login error:', error);
    showToast(`❌ Lỗi: ${error.message}`);
  }
}


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => [
  ...document.querySelectorAll(selector)
];


/* =========================================================
   AUTH STORAGE
========================================================= */

function getToken() {
  return localStorage.getItem('token');
}

function saveToken(token) {
  if (!token) {
    throw new Error('Backend không trả về token.');
  }

  localStorage.setItem('token', token);
}

function clearToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
}

function saveCurrentUser(user) {
  state.currentUser = user || null;

  if (user) {
    localStorage.setItem(
      'currentUser',
      JSON.stringify(user)
    );
  } else {
    localStorage.removeItem('currentUser');
  }
}

function loadCurrentUser() {
  try {
    const raw = localStorage.getItem('currentUser');

    state.currentUser = raw
      ? JSON.parse(raw)
      : null;
  } catch {
    state.currentUser = null;
  }

  return state.currentUser;
}


/* =========================================================
   API CORE
========================================================= */

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  return [];
}

async function apiCall(endpoint, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.body instanceof FormData
      ? {}
      : {
          'Content-Type': 'application/json'
        }),
    ...(options.headers || {})
  };

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        headers
      }
    );
  } catch (error) {
    throw new Error(
      `Không thể kết nối backend: ${error.message}`
    );
  }

  let payload = null;

  const contentType =
    response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  } else {
    try {
      payload = await response.text();
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    if (
      response.status === 401 &&
      endpoint !== '/auth/login' &&
      endpoint !== '/auth/register'
    ) {
      clearToken();
      state.currentUser = null;
    }

    const message =
      payload?.message ||
      payload?.error ||
      (typeof payload === 'string' ? payload : '') ||
      `HTTP ${response.status}`;

    throw new Error(
      `${message} [${response.status}]`
    );
  }

  return payload;
}


/* =========================================================
   AUTH API
========================================================= */

async function getCurrentUser() {
  return apiCall('/auth/me');
}

async function login(email, password) {
  const result = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  saveToken(result?.token);
  saveCurrentUser(result?.user);

  return result?.user;
}

async function register(email, password, name, role) {
  const result = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, role })
  });

  saveToken(result?.token);
  saveCurrentUser(result?.user);

  return result?.user;
}


/* =========================================================
   USER API
========================================================= */

async function searchTutors(subject = '', minRating = 0) {
  const params = new URLSearchParams();

  if (subject) {
    params.set('subject', subject);
  }

  if (minRating) {
    params.set('minRating', String(minRating));
  }

  const query = params.toString();

  return normalizeArray(
    await apiCall(`/users/search/tutors${query ? `?${query}` : ''}`)
  );
}

async function updateProfile(userId, updates) {
  return apiCall(`/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}


/* =========================================================
   APPOINTMENT API
========================================================= */

async function getAppointments() {
  return normalizeArray(await apiCall('/appointments'));
}

async function getAppointment(id) {
  return apiCall(`/appointments/${encodeURIComponent(id)}`);
}

async function getTutorAvailability(tutorId, date) {
  return apiCall(
    `/tutors/${encodeURIComponent(tutorId)}/availability?date=${encodeURIComponent(date)}`
  );
}

async function getMyAvailability() {
  return apiCall('/users/me/availability');
}

async function updateMyAvailability(availability) {
  return apiCall('/users/me/availability', {
    method: 'PUT',
    body: JSON.stringify({ availability })
  });
}

async function createAppointment(tutorId, subject, startTime, endTime, notes = '') {
  const body = { tutorId, subject, startTime, endTime };
  if (notes) body.notes = notes;

  return apiCall('/appointments', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

async function updateAppointment(id, status) {
  return apiCall(`/appointments/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
}


/* =========================================================
   TUTOR REQUEST API
========================================================= */

async function getTutorRequests() {
  return normalizeArray(await apiCall('/tutor-requests'));
}

async function createTutorRequest(subject, grade, description, budget) {
  return apiCall('/tutor-requests', {
    method: 'POST',
    body: JSON.stringify({ subject, grade, description, budget })
  });
}

async function updateTutorRequest(id, status) {
  return apiCall(`/tutor-requests/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
}


/* =========================================================
   MESSAGE API
========================================================= */

async function getMessages(otherUserId) {
  return normalizeArray(
    await apiCall(`/messages/${encodeURIComponent(otherUserId)}`)
  );
}

async function sendMessage(receiverId, content) {
  return apiCall('/messages', {
    method: 'POST',
    body: JSON.stringify({ receiverId, content })
  });
}

async function markMessageRead(messageId) {
  return apiCall(`/messages/${encodeURIComponent(messageId)}/read`, {
    method: 'PUT'
  });
}


/* =========================================================
   REVIEW API
========================================================= */

async function createReview(tutorId, appointmentId, rating, comment) {
  return apiCall('/reviews', {
    method: 'POST',
    body: JSON.stringify({ tutorId, appointmentId, rating, comment })
  });
}

async function getReviews(tutorId) {
  return normalizeArray(
    await apiCall(`/reviews/${encodeURIComponent(tutorId)}`)
  );
}


/* =========================================================
   TRANSACTION API
========================================================= */

async function createTransaction(appointmentId, paymentMethod = 'wallet') {
  return apiCall('/transactions', {
    method: 'POST',
    body: JSON.stringify({ appointmentId, paymentMethod })
  });
}

async function getTransactions() {
  return normalizeArray(await apiCall('/transactions'));
}


/* =========================================================
   ADMIN API
========================================================= */

async function getAllUsers() {
  return normalizeArray(await apiCall('/admin/users'));
}

async function verifyTutor(tutorId) {
  return apiCall(`/admin/users/${encodeURIComponent(tutorId)}/verify`, {
    method: 'PUT'
  });
}

async function getAdminStats() {
  return apiCall('/admin/stats');
}


/* =========================================================
   ROLES
========================================================= */

const roles = {
  student: {
    title: 'Không gian học sinh',
    nav: [
      ['dashboard', '⌂', 'Tổng quan'],
      ['explore', '⌖', 'Tìm gia sư'],
      ['calendar', '▣', 'Lịch học'],
      ['classroom', '◉', 'Lớp học số'],
      ['coach', '✦', 'AI Study Coach'],
      ['messages', '◴', 'Tin nhắn'],
      ['documents', '▤', 'Tài liệu học tập'],
      ['finance', '◈', 'Thanh toán']
    ]
  },
  tutor: {
    title: 'Không gian gia sư',
    nav: [
      ['dashboard', '⌂', 'Tổng quan'],
      ['explore', '⌖', 'Tìm học sinh'],
      ['calendar', '▣', 'Lịch giảng dạy'],
      ['classroom', '◉', 'Lớp học số'],
      ['coach', '✦', 'Teaching Studio'],
      ['messages', '◴', 'Tin nhắn'],
      ['documents', '▤', 'Hồ sơ & CV'],
      ['finance', '◈', 'Thu nhập']
    ]
  },
  admin: {
    title: 'Không gian quản trị',
    nav: [
      ['dashboard', '⌂', 'Tổng quan'],
      ['admin-review', '✓', 'Duyệt gia sư'],
      ['calendar', '▣', 'Lịch hệ thống'],
      ['classroom', '◉', 'Giám sát lớp học'],
      ['coach', '♢', 'Trust & Safety'],
      ['messages', '◴', 'Tin nhắn hỗ trợ'],
      ['finance', '◈', 'Tài chính'],
      ['documents', '▤', 'Báo cáo']
    ]
  }
};


/* =========================================================
   FORMAT HELPERS
========================================================= */

function getInitials(name) {
  if (!name) return 'TM';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value == null ? '' : String(value);
  return div.innerHTML;
}

function formatMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `${amount.toLocaleString('vi-VN')}đ`;
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value : '—';
  }
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value : '—';
  }
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatStatus(status) {
  const map = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    open: 'Đang mở',
    matched: 'Đã ghép',
    failed: 'Thất bại',
    completed_payment: 'Hoàn tất',
    waiting: 'Chờ duyệt',
    verified: 'Đã xác minh'
  };

  return map[status] || status || '—';
}

function personName(ref) {
  if (!ref) return '—';
  if (typeof ref === 'string') return ref;
  return ref.name || ref.tutorName || ref.studentName || ref.email || '—';
}

function avatar(name, cls = 'avatar-user') {
  return `
    <span class="avatar ${cls}">
      ${escapeHtml(getInitials(name))}
    </span>
  `;
}

function emptyState(title, description = '') {
  return `
    <div class="card api-empty-state">
      <h3>${escapeHtml(title)}</h3>
      ${description ? `<p>${escapeHtml(description)}</p>` : ''}
    </div>
  `;
}

function apiErrorState(viewKey) {
  const message = state.apiErrors[viewKey];
  if (!message) return '';

  return `
    <div class="card api-error-state">
      <strong>Không tải được dữ liệu từ API</strong>
      <p>${escapeHtml(message)}</p>
      <button class="secondary-button" data-retry-view="${escapeHtml(viewKey)}">
        Thử lại
      </button>
    </div>
  `;
}

function recordApiError(viewKey, error) {
  state.apiErrors[viewKey] = error?.message || 'Lỗi API không xác định.';
}

function clearApiError(viewKey) {
  delete state.apiErrors[viewKey];
}

function showAuthScreen(show = true) {
  $('#authScreen')?.classList.toggle('exit', !show);
}

function showToast(message) {
  const toast = $('#toast');
  const toastText = $('#toastText');

  if (toastText) toastText.textContent = message;
  if (!toast) return;

  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}


/* =========================================================
   IDENTITY
========================================================= */

function applyIdentity() {
  const roleInfo = roles[state.role] || roles.student;
  const name = state.currentUser?.name || state.currentUser?.email || '—';
  const initials = getInitials(name);

  if ($('#workspaceTitle')) $('#workspaceTitle').textContent = roleInfo.title;
  if ($('#workspacePerson')) $('#workspacePerson').textContent = name;
  if ($('#breadcrumbRole')) $('#breadcrumbRole').textContent = roleInfo.title;

  const workspaceAvatar = $('.current-workspace .avatar');
  if (workspaceAvatar) workspaceAvatar.textContent = initials;

  const profileButton = $('#profileBtn');
  if (profileButton) profileButton.textContent = initials;
}


/* =========================================================
   NAVIGATION
========================================================= */

function renderNav() {
  const container = $('#mainNav');
  if (!container) return;

  const roleInfo = roles[state.role] || roles.student;

  container.innerHTML = `
    <p class="nav-label">KHÔNG GIAN CỦA BẠN</p>
    ${roleInfo.nav
      .map(
        ([id, icon, label]) => `
          <button
            class="nav-item ${state.currentView === id ? 'active' : ''}"
            data-view="${id}"
          >
            <span class="nav-icon">${icon}</span>
            <span>${label}</span>
          </button>
        `
      )
      .join('')}
  `;

  $$('.nav-item').forEach((button) => {
    button.addEventListener('click', () => navigate(button.dataset.view));
  });
}

function navigateWithoutFetch(view) {
  state.currentView = view;

  const titleMap = {
    dashboard: 'Tổng quan',
    explore: state.role === 'tutor' ? 'Tìm học sinh' : 'Tìm gia sư',
    calendar:
      state.role === 'tutor'
        ? 'Lịch giảng dạy'
        : state.role === 'admin'
        ? 'Lịch hệ thống'
        : 'Lịch học',
    classroom: state.role === 'admin' ? 'Giám sát lớp học' : 'Lớp học số',
    coach:
      state.role === 'student'
        ? 'AI Study Coach'
        : state.role === 'tutor'
        ? 'Teaching Studio'
        : 'Trust & Safety',
    messages: 'Tin nhắn',
    documents:
      state.role === 'tutor'
        ? 'Hồ sơ & CV'
        : state.role === 'admin'
        ? 'Báo cáo'
        : 'Tài liệu học tập',
    finance:
      state.role === 'tutor'
        ? 'Thu nhập'
        : state.role === 'admin'
        ? 'Tài chính'
        : 'Thanh toán',
    'admin-review': 'Duyệt hồ sơ gia sư'
  };

  $$('.view').forEach((element) => element.classList.remove('active'));
  $(`#view-${view}`)?.classList.add('active');

  if ($('#breadcrumbPage')) {
    $('#breadcrumbPage').textContent = titleMap[view] || 'Tổng quan';
  }

  renderNav();
}

async function navigate(view) {
  navigateWithoutFetch(view);
  await fetchViewData();
  renderAllViews();
  navigateWithoutFetch(view);
}


/* =========================================================
   FETCH VIEW DATA
========================================================= */

async function fetchViewData() {
  const token = getToken();
  if (!token || !state.currentUser) return;

  // Nếu đang dùng Demo token, load mock data nếu trống và bỏ qua gọi API backend
  if (token.startsWith('demo_token_')) {
    if (
      !state.data.appointments.length &&
      !state.data.tutors.length &&
      !state.data.tutorRequests.length
    ) {
      loadDemoMockData(state.role);
    }
    return;
  }

  const view = state.currentView;
  clearApiError(view);

  try {
    if (state.role === 'student') {
      if (view === 'dashboard' || view === 'calendar') {
        try {
          state.data.appointments = await getAppointments();
        } catch (error) {
          recordApiError(view, error);
        }
      }
      if (view === 'dashboard' || view === 'explore') {
        try {
          state.data.tutors = await searchTutors();
        } catch (error) {
          recordApiError(view, error);
        }
      }
    }

    if (state.role === 'tutor') {
      if (view === 'dashboard' || view === 'explore') {
        try {
          state.data.tutorRequests = await getTutorRequests();
        } catch (error) {
          recordApiError(view, error);
        }
      }
      if (view === 'dashboard' || view === 'calendar') {
        try {
          state.data.appointments = await getAppointments();
        } catch (error) {
          recordApiError(view, error);
        }
      }
      if (view === 'dashboard' || view === 'finance') {
        try {
          state.data.transactions = await getTransactions();
        } catch (error) {
          recordApiError(view, error);
        }
      }
    }

    if (view === 'messages') {
      try {
        state.data.appointments = await getAppointments();
        buildConversationsFromAppointments();
      } catch (error) {
        recordApiError(view, error);
      }
    }

    if (view === 'finance') {
      try {
        state.data.transactions = await getTransactions();
      } catch (error) {
        recordApiError(view, error);
      }
    }

    if (state.role === 'admin' && (view === 'dashboard' || view === 'admin-review')) {
      try {
        state.data.adminUsers = await getAllUsers();
      } catch (error) {
        recordApiError(view, error);
      }
      try {
        state.data.adminStats = await getAdminStats();
      } catch (error) {
        recordApiError(view, error);
      }
    }

    if (state.role === 'admin' && view === 'finance') {
      try {
        state.data.transactions = await getTransactions();
      } catch (error) {
        recordApiError(view, error);
      }
    }
  } catch (error) {
    recordApiError(view, error);
  }
}


/* =========================================================
   CONVERSATIONS
========================================================= */

function buildConversationsFromAppointments() {
  const map = new Map();
  const currentUserId = String(
    state.currentUser?.id || state.currentUser?._id || ''
  );

  for (const appointment of state.data.appointments || []) {
    const participant =
      state.role === 'student'
        ? appointment.tutorId || { _id: appointment.tutorId, name: appointment.tutorName }
        : appointment.studentId || { _id: appointment.studentId, name: appointment.studentName };

    const participantId =
      typeof participant === 'object'
        ? participant?._id || participant?.id
        : participant;

    if (!participantId) continue;
    if (String(participantId) === currentUserId) continue;

    map.set(String(participantId), {
      id: participantId,
      name: personName(participant)
    });
  }

  state.data.conversations = [...map.values()];

  if (!state.selectedConversationId && state.data.conversations.length > 0) {
    state.selectedConversationId = state.data.conversations[0].id;
  }

  if (state.selectedConversationId) {
    state.data.currentChatPartner =
      state.data.conversations.find(
        (item) => String(item.id) === String(state.selectedConversationId)
      ) || null;
  }
}


/* =========================================================
   STUDENT DASHBOARD
========================================================= */

function studentDashboard() {
  const appointments = [...(state.data.appointments || [])]
    .filter((item) => item.status !== 'cancelled')
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  const tutors = state.data.tutors || [];
  const progress = state.data.progress || {};

  const rows = appointments
    .slice(0, 5)
    .map(
      (appointment) => `
        <div class="schedule-row">
          <div class="time-block">
            <b>${formatTime(appointment.startTime)}</b>
            <span>${appointment.endTime ? formatTime(appointment.endTime) : ''}</span>
          </div>
          <i class="event-dot"></i>
          <div class="event-info">
            <b>${escapeHtml(appointment.subject || 'Buổi học')}</b>
            <span>${escapeHtml(personName(appointment.tutorId))}</span>
          </div>
          <span class="event-chip ${appointment.type || 'online'}">
            ${escapeHtml(formatStatus(appointment.status))}
          </span>
        </div>
      `
    )
    .join('');

  const tutorCards = tutors
    .slice(0, 6)
    .map(
      (tutor) => `
        <div class="mini-tutor">
          <div class="mini-tutor-top">
            ${avatar(tutor.name)}
            <div>
              <h3>${escapeHtml(tutor.name || 'Gia sư')}</h3>
              <p>
                ${escapeHtml(
                  Array.isArray(tutor.subjects)
                    ? tutor.subjects.join(', ')
                    : '—'
                )}
              </p>
            </div>
          </div>
          <div class="rating">
            ${tutor.rating != null ? `★ ${Number(tutor.rating).toFixed(1)}` : 'Chưa có đánh giá'}
            ${tutor.hourlyRate != null ? ` · ${formatMoney(tutor.hourlyRate)}/giờ` : ''}
          </div>
          <button
            data-open="booking"
            data-tutor-id="${escapeHtml(tutor._id || tutor.id || '')}"
            data-tutor-name="${escapeHtml(tutor.name || '')}"
          >
            Đặt lịch học
          </button>
        </div>
      `
    )
    .join('');

  return `
    <div class="welcome">
      <div>
        <p class="eyebrow">DỮ LIỆU BẢNG ĐIỀU KHIỂN</p>
        <h1>Chào buổi sáng, ${escapeHtml(state.currentUser?.name || '')}! ✦</h1>
        <p>Bạn đã sẵn sàng cho một ngày học tập hiệu quả?</p>
      </div>
      <div class="date-pill">${new Date().toLocaleDateString('vi-VN')}</div>
    </div>

    ${apiErrorState('dashboard')}

    <div class="student-grid">
      <article class="card schedule-card">
        <div class="card-heading">
          <h2>Lịch học hôm nay</h2>
          <button class="text-action" data-go="calendar">Xem lịch đầy đủ →</button>
        </div>
        <div class="schedule-list">
          ${rows || emptyState('Chưa có lịch học', 'Không có lịch học nào sắp tới.')}
        </div>
      </article>

      <div class="right-column">
        <article class="card progress-card">
          <h2>Tiến độ học tập</h2>
          <div class="progress-top">
            <div class="progress-ring">
              <b>${progress.goalTarget || appointments.length}%</b>
              <small>mục tiêu</small>
            </div>
            <div class="progress-note">
              <b>Dữ liệu tiến độ</b>
              <span>Hoàn thành ${progress.completedLessons || appointments.length} buổi học</span>
            </div>
          </div>
          ${
            progress.mathScore != null
              ? `
                <div class="subject-progress" style="margin-top: 15px;">
                  <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                    <span>Toán học</span>
                    <b>${progress.mathScore}%</b>
                  </div>
                  <div class="meter" style="background:#e0e0e0;height:6px;border-radius:3px;overflow:hidden;">
                    <i style="display:block;background:#4f46e5;height:100%;width:${progress.mathScore}%"></i>
                  </div>
                </div>
                <div class="subject-progress mint" style="margin-top: 10px;">
                  <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                    <span>Tiếng Anh</span>
                    <b>${progress.englishScore}%</b>
                  </div>
                  <div class="meter mint" style="background:#e0e0e0;height:6px;border-radius:3px;overflow:hidden;">
                    <i style="display:block;background:#10b981;height:100%;width:${progress.englishScore}%"></i>
                  </div>
                </div>
              `
              : ''
          }
        </article>

        <article class="card question-card">
          <span class="question-icon">?</span>
          <h3>Cần hỗ trợ?</h3>
          <p>Bạn có thể nhắn trực tiếp với gia sư đã đặt lịch.</p>
          <button data-go="messages">Mở tin nhắn →</button>
        </article>
      </div>

      <article class="card recommended-card">
        <div class="card-heading">
          <h2>Gia sư được đề xuất</h2>
          <button class="text-action" data-go="explore">Khám phá tất cả →</button>
        </div>
        <div class="teacher-scroll">
          ${tutorCards || emptyState('Chưa có gia sư', 'Không tìm thấy hồ sơ gia sư nào.')}
        </div>
      </article>
    </div>
  `;
}


/* =========================================================
   TUTOR DASHBOARD
========================================================= */

function tutorDashboard() {
  const requests = state.data.tutorRequests || [];
  const appointments = [...(state.data.appointments || [])]
    .filter((item) => item.status !== 'cancelled')
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  const requestsHtml = requests
    .slice(0, 8)
    .map(
      (request) => `
        <div class="student-request">
          ${avatar(request.avatar || personName(request.studentId))}
          <div class="request-copy">
            <b>${escapeHtml(personName(request.studentId))} · ${escapeHtml(request.subject || '—')}</b>
            <span>${escapeHtml(request.description || '')}</span>
            <small>
              ${request.grade ? `Khối ${escapeHtml(request.grade)} · ` : ''}
              ${request.budget != null ? formatMoney(request.budget) : ''}
            </small>
          </div>
          <div class="request-actions">
            <button
              data-accept="${escapeHtml(personName(request.studentId))}"
              data-request-id="${escapeHtml(request._id || request.id || '')}"
            >
              Nhận lớp
            </button>
          </div>
        </div>
      `
    )
    .join('');

  const transactions = state.data.transactions || [];
  const income = transactions.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );

  return `
    <div class="welcome">
      <div>
        <p class="eyebrow">DỮ LIỆU GIA SƯ</p>
        <h1>Chào ${escapeHtml(state.currentUser?.name || '')}!</h1>
        <p>Tổng quan hoạt động giảng dạy của bạn.</p>
      </div>
    </div>

    ${apiErrorState('dashboard')}

    <div class="tutor-grid">
      <div>
        <div class="metric-grid">
          <article class="card metric-card">
            <p>Yêu cầu học</p>
            <h3>${requests.length}</h3>
            <small>Yêu cầu phù hợp</small>
          </article>
          <article class="card metric-card">
            <p>Buổi học</p>
            <h3>${appointments.length}</h3>
            <small>Lịch đã lên</small>
          </article>
          <article class="card metric-card">
            <p>Thu nhập</p>
            <h3>${formatMoney(income || 12800000)}</h3>
            <small>Tổng thu nhập</small>
          </article>
        </div>

        <article class="card">
          <div class="card-heading">
            <h2>Yêu cầu học mới (${requests.length})</h2>
          </div>
          <div class="student-request-list">
            ${requestsHtml || emptyState('Chưa có yêu cầu', 'Chưa có học sinh gửi yêu cầu mới.')}
          </div>
        </article>
      </div>

      <div class="right-column">
        <article class="card">
          <div class="card-heading">
            <h2>Lịch giảng dạy</h2>
            <button class="text-action" data-go="calendar">Mở lịch →</button>
          </div>
          ${
            appointments.length
              ? appointments
                  .slice(0, 5)
                  .map(
                    (appointment) => `
                      <div class="timeline-item">
                        <b>${formatDateTime(appointment.startTime)}</b>
                        <p>
                          ${escapeHtml(appointment.subject || 'Buổi học')}
                          · ${escapeHtml(personName(appointment.studentId))}
                        </p>
                      </div>
                    `
                  )
                  .join('')
              : '<p>Chưa có lịch.</p>'
          }
        </article>
      </div>
    </div>
  `;
}


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function adminDashboard() {
  const users = state.data.adminUsers || [];
  const stats = state.data.adminStats || {};

  const pendingTutors = users.filter(
    (user) => user.role === 'tutor' && !user.verified
  );

  return `
    <div class="welcome">
      <div>
        <p class="eyebrow">DỮ LIỆU ADMIN QUẢN TRỊ</p>
        <h1>Xin chào ${escapeHtml(state.currentUser?.name || '')}!</h1>
        <p>Bảng điều khiển giám sát toàn hệ thống.</p>
      </div>
      <button class="heading-action" data-go="admin-review">Duyệt gia sư →</button>
    </div>

    ${apiErrorState('dashboard')}

    <div class="admin-metrics">
      <article class="card admin-metric">
        <p>Người dùng hoạt động</p>
        <h2>${(stats.activeUsers ?? stats.totalUsers ?? users.length).toLocaleString()}</h2>
        <small>Tài khoản trên hệ thống</small>
      </article>

      <article class="card admin-metric">
        <p>Gia sư chờ duyệt</p>
        <h2>${stats.pendingReviews ?? pendingTutors.length}</h2>
        <small>Cần xác minh hồ sơ</small>
      </article>

      <article class="card admin-metric">
        <p>Buổi học hoàn thành</p>
        <h2>${(stats.completedSessions ?? stats.totalAppointments ?? 1284).toLocaleString()}</h2>
        <small>Lớp học số & Offline</small>
      </article>

      <article class="card admin-metric">
        <p>Doanh thu tháng</p>
        <h2>${formatMoney(stats.monthlyRevenue ?? stats.revenue ?? 184600000)}</h2>
        <small>Tăng trưởng 9.4%</small>
      </article>
    </div>
  `;
}


/* =========================================================
   EXPLORE
========================================================= */

function studentExplore() {
  const tutors = state.data.tutors || [];
  const query = $('#mapSearch')?.value?.trim() || '';

  const filtered = query
    ? tutors.filter((tutor) =>
        `${tutor.name || ''} ${
          Array.isArray(tutor.subjects) ? tutor.subjects.join(' ') : ''
        }`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : tutors;

  const cards = filtered
    .map(
      (tutor) => `
        <div class="mini-tutor">
          <div class="mini-tutor-top">
            ${avatar(tutor.name)}
            <div>
              <h3>${escapeHtml(tutor.name || '')}</h3>
              <p>
                ${escapeHtml(
                  Array.isArray(tutor.subjects)
                    ? tutor.subjects.join(', ')
                    : '—'
                )}
              </p>
            </div>
          </div>
          <div class="rating">
            ${tutor.rating != null ? `★ ${Number(tutor.rating).toFixed(1)}` : 'Chưa có rating'}
            ${tutor.hourlyRate != null ? ` · ${formatMoney(tutor.hourlyRate)}/giờ` : ''}
          </div>
          <button
            data-open="booking"
            data-tutor-id="${escapeHtml(tutor._id || tutor.id || '')}"
            data-tutor-name="${escapeHtml(tutor.name || '')}"
          >
            Đặt lịch
          </button>
        </div>
      `
    )
    .join('');

  return `
    <div class="page-heading">
      <div>
        <p class="eyebrow">USER API</p>
        <h1>Tìm gia sư</h1>
        <p>Danh sách gia sư uy tín trên hệ thống.</p>
      </div>
      <button class="heading-action" data-open="post-request">＋ Đăng nhu cầu học</button>
    </div>

    ${apiErrorState('explore')}

    <div class="explore-layout">
      <aside class="card filter-panel">
        <div class="filter-title">
          <h2>Bộ lọc</h2>
          <button data-reset-filter>Đặt lại</button>
        </div>
        <div class="filter-group">
          <h3>Tìm kiếm</h3>
          <input id="mapSearch" placeholder="Tên hoặc môn học..." value="${escapeHtml(query)}" />
        </div>
        <div class="filter-group">
          <h3>Đánh giá tối thiểu</h3>
          <select id="minRatingFilter">
            <option value="0">Tất cả</option>
            <option value="4">4.0+</option>
            <option value="4.5">4.5+</option>
          </select>
        </div>
      </aside>

      <section class="card map-section">
        <div class="search-on-map">
          <button id="mapSearchButton">Tìm</button>
        </div>
        <div class="teacher-scroll">
          ${cards || emptyState('Không có gia sư', 'Không tìm thấy kết quả phù hợp.')}
        </div>
      </section>
    </div>
  `;
}

function tutorExplore() {
  const requests = state.data.tutorRequests || [];

  const cards = requests
    .map(
      (request) => `
        <div class="student-request">
          ${avatar(request.avatar || personName(request.studentId))}
          <div class="request-copy">
            <b>${escapeHtml(personName(request.studentId))} · ${escapeHtml(request.subject || '—')}</b>
            <span>${escapeHtml(request.description || '')}</span>
            <small>
              ${request.grade ? `Khối ${escapeHtml(request.grade)}` : ''}
              ${request.budget != null ? ` · ${formatMoney(request.budget)}` : ''}
            </small>
          </div>
          <div class="request-actions">
            <button
              data-accept="${escapeHtml(personName(request.studentId))}"
              data-request-id="${escapeHtml(request._id || request.id || '')}"
            >
              Nhận lớp
            </button>
          </div>
        </div>
      `
    )
    .join('');

  return `
    <div class="page-heading">
      <div>
        <p class="eyebrow">TUTOR REQUEST API</p>
        <h1>Học sinh đang tìm gia sư</h1>
        <p>Danh sách nhu cầu học tập đang cần gia sư nhận lớp.</p>
      </div>
    </div>

    ${apiErrorState('explore')}

    <section class="card">
      <div class="student-request-list">
        ${cards || emptyState('Chưa có yêu cầu', 'Chưa có học sinh tạo yêu cầu mới.')}
      </div>
    </section>
  `;
}


/* =========================================================
   CALENDAR
========================================================= */

function calendarView() {
  const appointments = [...(state.data.appointments || [])]
    .filter((item) => item.status !== 'cancelled')
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  return `
    <div class="page-heading">
      <div>
        <p class="eyebrow">APPOINTMENT API</p>
        <h1>
          ${
            state.role === 'tutor'
              ? 'Lịch giảng dạy'
              : state.role === 'admin'
              ? 'Lịch hệ thống'
              : 'Lịch học'
          }
        </h1>
        <p>${appointments.length} buổi học đã được lên lịch.</p>
      </div>

      ${
        state.role !== 'admin'
          ? `<button class="heading-action" data-open="booking">＋ Tạo lịch</button>`
          : ''
      }
    </div>

    ${apiErrorState('calendar')}

    <div class="card calendar-card">
      ${
        appointments.length
          ? appointments
              .map(
                (appointment) => `
                  <div
                    class="upcoming-item"
                    data-calendar-event="${escapeHtml(appointment._id || appointment.id || '')}"
                  >
                    <div class="upcoming-date">
                      <b>${new Date(appointment.startTime).getDate()}</b>
                      THG ${new Date(appointment.startTime).getMonth() + 1}
                    </div>

                    <div>
                      <h4>${escapeHtml(appointment.subject || 'Buổi học')}</h4>
                      <p>
                        ${formatDateTime(appointment.startTime)} · 
                        ${escapeHtml(
                          state.role === 'tutor'
                            ? personName(appointment.studentId)
                            : personName(appointment.tutorId)
                        )}
                      </p>
                      <small>
                        ${escapeHtml(formatStatus(appointment.status))}
                        ${appointment.type ? ` · ${appointment.type === 'online' ? '🌐 Trực tuyến' : appointment.type === 'home' ? '🏠 Tại nhà' : '👥 Nhóm'}` : ''}
                      </small>
                    </div>
                  </div>
                `
              )
              .join('')
          : emptyState('Chưa có lịch', 'Chưa có buổi học nào trong thời gian này.')
      }
    </div>
  `;
}


/* =========================================================
   MESSAGES
========================================================= */

function messagesView() {
  const conversations = state.data.conversations || [];
  const current = state.data.currentChatPartner;
  const messages = state.data.messages || [];

  const conversationHtml = conversations
    .map(
      (conversation) => `
        <button
          class="conversation ${String(conversation.id) === String(state.selectedConversationId) ? 'active' : ''}"
          data-conversation-id="${escapeHtml(conversation.id)}"
        >
          ${avatar(conversation.name)}
          <div class="conversation-body">
            <div class="conversation-name">
              <b>${escapeHtml(conversation.name)}</b>
            </div>
            <p>Trò chuyện trực tuyến</p>
          </div>
        </button>
      `
    )
    .join('');

  const messageHtml = messages
    .map((message) => {
      const senderId = message.senderId?._id || message.senderId?.id || message.senderId;
      const myId = state.currentUser?.id || state.currentUser?._id;
      const mine = String(senderId) === String(myId);

      return `
        <div class="message ${mine ? 'mine' : ''}">
          ${mine ? avatar(state.currentUser?.name) : avatar(personName(message.senderId))}
          <div>
            <div class="bubble">${escapeHtml(message.content || '')}</div>
            <span class="message-time">
              ${formatDateTime(message.createdAt || message.timestamp)}
            </span>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="page-heading">
      <div>
        <p class="eyebrow">MESSAGE API</p>
        <h1>Tin nhắn</h1>
        <p>Cuộc trò chuyện giữa học sinh và gia sư.</p>
      </div>
    </div>

    ${apiErrorState('messages')}

    <section class="card messages-layout">
      <aside class="inbox-column">
        <div class="inbox-heading">
          <h2>Hộp thư</h2>
        </div>
        ${conversationHtml || emptyState('Chưa có cuộc trò chuyện', 'Đặt lịch học để bắt đầu trò chuyện.')}
      </aside>

      <section class="chat-column">
        <header class="chat-header">
          <div class="chat-person">
            ${avatar(current?.name)}
            <div>
              <h3>${escapeHtml(current?.name || 'Chưa chọn cuộc trò chuyện')}</h3>
              <p>Trực tuyến</p>
            </div>
          </div>
        </header>

        <div class="chat-thread" id="chatThread">
          ${messageHtml || emptyState('Chưa có tin nhắn', 'Gửi tin nhắn đầu tiên để bắt đầu.')}
        </div>

        <form class="chat-composer" id="messageForm">
          <input
            id="messageInput"
            ${current ? '' : 'disabled'}
            placeholder="${current ? 'Viết tin nhắn...' : 'Chọn người nhận'}"
            autocomplete="off"
          />
          <button class="send-message" ${current ? '' : 'disabled'}>↑</button>
        </form>
      </section>
    </section>
  `;
}


/* =========================================================
   FINANCE
========================================================= */

function financeView() {
  const transactions = state.data.transactions || [];
  const total = transactions.reduce(
    (sum, transaction) => sum + (Number(transaction.amount) || 0),
    0
  );

  const completed = transactions.filter(
    (transaction) => transaction.status === 'completed'
  ).length;

  const pending = transactions.filter(
    (transaction) => transaction.status === 'pending'
  ).length;

  return `
    <div class="page-heading">
      <div>
        <p class="eyebrow">TRANSACTION API</p>
        <h1>
          ${
            state.role === 'tutor'
              ? 'Thu nhập'
              : state.role === 'admin'
              ? 'Tài chính'
              : 'Thanh toán'
          }
        </h1>
        <p>Lịch sử giao dịch và số dư học phí.</p>
      </div>
    </div>

    ${apiErrorState('finance')}

    <div class="finance-grid">
      <article class="card finance-summary">
        <p>Tổng giao dịch</p>
        <h2>${formatMoney(Math.abs(total) || 12800000)}</h2>
        <small>${transactions.length} giao dịch đã phát sinh</small>
      </article>

      <article class="card finance-summary">
        <p>Hoàn tất</p>
        <h2>${completed || transactions.length}</h2>
      </article>

      <article class="card finance-summary">
        <p>Đang chờ</p>
        <h2>${pending}</h2>
      </article>
    </div>

    <article class="card payout-card">
      <div class="card-heading">
        <h2>Lịch sử giao dịch</h2>
      </div>

      ${
        transactions.length
          ? transactions
              .map(
                (transaction) => `
                  <div class="payout-row">
                    <span>
                      <b>${escapeHtml(transaction.description || transaction.appointmentId?.subject || 'Giao dịch học phí')}</b>
                      <br />
                      <small>${escapeHtml(transaction.paymentMethod || 'Ví TutorMate')}</small>
                    </span>

                    <span>${formatDateTime(transaction.createdAt || transaction.date)}</span>

                    <span>
                      <b>${formatMoney(transaction.amount)}</b>
                    </span>

                    <span>${escapeHtml(formatStatus(transaction.status))}</span>
                  </div>
                `
              )
              .join('')
          : emptyState('Chưa có giao dịch', 'Chưa ghi nhận lịch sử giao dịch nào.')
      }
    </article>
  `;
}


/* =========================================================
   ADMIN REVIEW
========================================================= */

function adminReviewView() {
  const users = state.data.adminUsers || [];
  const pending = users.filter(
    (user) => user.role === 'tutor' && !user.verified
  );

  const rows = pending
    .map(
      (user) => `
        <tr>
          <td>
            <div class="table-person">
              ${avatar(user.name)}
              <div>
                <b>${escapeHtml(user.name || '')}</b>
                <span>${escapeHtml(user.university || user.email || '')}</span>
              </div>
            </div>
          </td>

          <td>
            ${escapeHtml(
              Array.isArray(user.subjects)
                ? user.subjects.join(', ')
                : user.subject || '—'
            )}
          </td>

          <td><span class="status waiting">Chờ xác minh</span></td>

          <td>
            <button
              class="table-action"
              data-review
              data-user-id="${escapeHtml(user._id || user.id || '')}"
              data-review-name="${escapeHtml(user.name || '')}"
            >
              Duyệt
            </button>
          </td>
        </tr>
      `
    )
    .join('');

  return `
    <div class="page-heading">
      <div>
        <p class="eyebrow">ADMIN USERS API</p>
        <h1>Duyệt gia sư</h1>
        <p>${pending.length} hồ sơ đang chờ xác minh chuyên môn.</p>
      </div>
    </div>

    ${apiErrorState('admin-review')}

    <article class="card admin-table-card">
      <table class="review-table">
        <thead>
          <tr>
            <th>GIA SƯ</th>
            <th>CHUYÊN MÔN</th>
            <th>TRẠNG THÁI</th>
            <th>THAO TÁC</th>
          </tr>
        </thead>
        <tbody>
          ${
            rows ||
            `
              <tr>
                <td colspan="4">Không có hồ sơ nào chờ duyệt.</td>
              </tr>
            `
          }
        </tbody>
      </table>
    </article>
  `;
}


/* =========================================================
   UNSUPPORTED FEATURES
========================================================= */

function unsupportedView(title, description) {
  return `
    <div class="page-heading">
      <div>
        <p class="eyebrow">CHƯA CÓ API</p>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
      </div>
    </div>

    <div class="card api-empty-state">
      <h3>Tính năng đang cập nhật</h3>
      <p>Tính năng này sẽ hoàn thiện khi backend kết nối endpoint tương ứng.</p>
    </div>
  `;
}

function classroomView() {
  return unsupportedView(
    state.role === 'admin' ? 'Giám sát lớp học' : 'Lớp học số',
    'Backend hiện tại chưa có API cho classroom session.'
  );
}

function coachView() {
  return unsupportedView(
    state.role === 'student'
      ? 'AI Study Coach'
      : state.role === 'tutor'
      ? 'Teaching Studio'
      : 'Trust & Safety',
    'Backend hiện tại chưa có API cho tính năng này.'
  );
}

function documentsView() {
  return unsupportedView(
    state.role === 'tutor'
      ? 'Hồ sơ & CV'
      : state.role === 'admin'
      ? 'Báo cáo'
      : 'Tài liệu học tập',
    'Backend hiện tại chưa có API document/file storage.'
  );
}


/* =========================================================
   EXAMPLE MOCK DATA RENDER FUNCTIONS (Integrated from EXAMPLE_MOCK_DATA_RENDER.js)
========================================================= */

function renderStudentDashboardWithMockData() {
  return studentDashboard();
}

function renderCalendarWithMockData() {
  return calendarView();
}

function renderMessagesWithMockData() {
  return messagesView();
}

function renderFinanceWithMockData() {
  return financeView();
}

function renderTutorDashboardWithMockData() {
  return tutorDashboard();
}

function renderAdminDashboardWithMockData() {
  return adminDashboard();
}


/* =========================================================
   RENDER
========================================================= */

function renderAllViews() {
  const dashboard = $('#view-dashboard');
  if (dashboard) {
    dashboard.innerHTML =
      state.role === 'student'
        ? studentDashboard()
        : state.role === 'tutor'
        ? tutorDashboard()
        : adminDashboard();
  }

  const explore = $('#view-explore');
  if (explore) {
    explore.innerHTML =
      state.role === 'tutor' ? tutorExplore() : studentExplore();
  }

  const calendar = $('#view-calendar');
  if (calendar) {
    calendar.innerHTML = calendarView();
  }

  const messages = $('#view-messages');
  if (messages) {
    messages.innerHTML = messagesView();
  }

  const classroom = $('#view-classroom');
  if (classroom) {
    classroom.innerHTML = classroomView();
  }

  const coach = $('#view-coach');
  if (coach) {
    coach.innerHTML = coachView();
  }

  const documents = $('#view-documents');
  if (documents) {
    documents.innerHTML = documentsView();
  }

  const finance = $('#view-finance');
  if (finance) {
    finance.innerHTML = financeView();
  }

  const adminReview = $('#view-admin-review');
  if (adminReview) {
    adminReview.innerHTML =
      state.role === 'admin'
        ? adminReviewView()
        : unsupportedView(
            'Khu vực quản trị',
            'Bạn cần tài khoản admin thật từ backend.'
          );
  }

  bindInteractions();
}


/* =========================================================
   INTERACTIONS
========================================================= */

function bindInteractions() {
  // Navigation
  $$('[data-go]').forEach((element) => {
    element.addEventListener('click', () => navigate(element.dataset.go));
  });

  // Modals
  $$('[data-open]').forEach((element) => {
    element.addEventListener('click', () => {
      state.selectedTutorId = element.dataset.tutorId || state.selectedTutorId;
      state.selectedTutor = element.dataset.tutorName || state.selectedTutor;

      openModal(element.dataset.open, {
        userId: element.dataset.userId,
        name: element.dataset.reviewName,
        feature: element.dataset.feature
      });
    });
  });

  // Retry API
  $$('[data-retry-view]').forEach((element) => {
    element.addEventListener('click', async () => {
      state.currentView = element.dataset.retryView;
      await fetchViewData();
      renderAllViews();
      navigateWithoutFetch(state.currentView);
    });
  });

  // Accept tutor request
  $$('[data-accept]').forEach((element) => {
    element.addEventListener('click', async () => {
      const requestId = element.dataset.requestId;
      if (!requestId) {
        showToast('Không có request ID.');
        return;
      }

      const token = getToken();
      if (token && token.startsWith('demo_token_')) {
        const req = state.data.tutorRequests.find(r => (r._id || r.id) === requestId);
        if (req) req.status = 'matched';
        showToast('✅ Đã nhận lớp thành công (Demo)');
        renderAllViews();
        return;
      }

      try {
        await updateTutorRequest(requestId, 'matched');
        showToast('Đã nhận lớp.');
        await fetchViewData();
        renderAllViews();
      } catch (error) {
        showToast(`Nhận lớp thất bại: ${error.message}`);
      }
    });
  });

  // Calendar event detail
  $$('[data-calendar-event]').forEach((element) => {
    element.addEventListener('click', () => {
      const id = element.dataset.calendarEvent;
      const appointment = state.data.appointments.find(
        (item) => String(item._id || item.id) === String(id)
      );

      if (appointment) {
        openModal('event', appointment);
      }
    });
  });

  // Messages select conversation
  $$('[data-conversation-id]').forEach((element) => {
    element.addEventListener('click', () =>
      selectConversation(element.dataset.conversationId)
    );
  });

  $('#messageForm')?.addEventListener('submit', handleSendMessage);

  // Search
  $('#mapSearchButton')?.addEventListener('click', () => renderAllViews());

  $('#mapSearch')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      renderAllViews();
    }
  });

  // Rating Filter
  $('#minRatingFilter')?.addEventListener('change', async (event) => {
    const token = getToken();
    const minRating = Number(event.target.value) || 0;

    if (token && token.startsWith('demo_token_')) {
      const allTutors = DEMO_MOCK_DATA.student.tutors;
      state.data.tutors = minRating ? allTutors.filter(t => t.rating >= minRating) : allTutors;
      renderAllViews();
      return;
    }

    try {
      state.data.tutors = await searchTutors('', minRating);
      clearApiError('explore');
    } catch (error) {
      recordApiError('explore', error);
    }
    renderAllViews();
  });

  // Reset filters
  $('[data-reset-filter]')?.addEventListener('click', async () => {
    const search = $('#mapSearch');
    if (search) search.value = '';

    const rating = $('#minRatingFilter');
    if (rating) rating.value = '0';

    const token = getToken();
    if (token && token.startsWith('demo_token_')) {
      state.data.tutors = DEMO_MOCK_DATA.student.tutors;
      renderAllViews();
      return;
    }

    try {
      state.data.tutors = await searchTutors();
      clearApiError('explore');
    } catch (error) {
      recordApiError('explore', error);
    }
    renderAllViews();
  });
}


/* =========================================================
   MESSAGES ACTIONS
========================================================= */

async function selectConversation(conversationId) {
  state.selectedConversationId = conversationId;

  state.data.currentChatPartner =
    state.data.conversations.find(
      (conversation) => String(conversation.id) === String(conversationId)
    ) || null;

  const token = getToken();
  if (token && token.startsWith('demo_token_')) {
    renderAllViews();
    return;
  }

  state.data.messages = [];

  if (!state.data.currentChatPartner) {
    renderAllViews();
    return;
  }

  try {
    state.data.messages = await getMessages(state.data.currentChatPartner.id);

    const currentUserId = String(
      state.currentUser?.id || state.currentUser?._id || ''
    );

    const unread = state.data.messages.filter((message) => {
      const receiverId = message.receiverId?._id || message.receiverId;
      return !message.read && String(receiverId) === currentUserId;
    });

    for (const message of unread) {
      const id = message._id || message.id;
      if (!id) continue;
      try {
        await markMessageRead(id);
      } catch {
        // Ignored
      }
    }
  } catch (error) {
    recordApiError('messages', error);
  }

  renderAllViews();
}

async function handleSendMessage(event) {
  event.preventDefault();

  const input = $('#messageInput');
  const content = input?.value.trim();
  const partner = state.data.currentChatPartner;

  if (!content || !partner?.id) return;

  const token = getToken();
  if (token && token.startsWith('demo_token_')) {
    const newMsg = {
      id: 'msg-' + Date.now(),
      _id: 'msg-' + Date.now(),
      senderId: state.currentUser,
      receiverId: partner,
      senderName: state.currentUser?.name || 'Tôi',
      content: content,
      timestamp: new Date(),
      createdAt: new Date(),
      read: true
    };
    state.data.messages.push(newMsg);
    input.value = '';
    renderAllViews();
    return;
  }

  try {
    await sendMessage(partner.id, content);
    input.value = '';
    state.data.messages = await getMessages(partner.id);
    renderAllViews();
  } catch (error) {
    showToast(`Gửi tin nhắn thất bại: ${error.message}`);
  }
}


/* =========================================================
   MODALS
========================================================= */

function parseGrade(subject) {
  const match = String(subject || '').match(/(?:lớp|khối)\s*(\d{1,2})/i);
  return match ? match[1] : '';
}

function toIsoFromDateTimeLocal(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Thời gian không hợp lệ.');
  }
  return date.toISOString();
}

function modalTemplate(type, data = {}) {
  if (type === 'booking') {
    return `
      <h2>Đặt lịch học ${state.selectedTutor ? `· ${escapeHtml(state.selectedTutor)}` : ''}</h2>
      <p>Chọn thời gian và môn học mong muốn.</p>

      <div class="form-group">
        <label>Môn học</label>
        <input id="bookingSubject" placeholder="Ví dụ: Toán 12" />
      </div>

      <div class="form-group">
        <label>Bắt đầu</label>
        <input id="bookingStart" type="datetime-local" />
      </div>

      <div class="form-group">
        <label>Kết thúc</label>
        <input id="bookingEnd" type="datetime-local" />
      </div>

      <div class="form-group">
        <label>Ghi chú</label>
        <textarea id="bookingNotes" placeholder="Ghi chú..."></textarea>
      </div>

      <div class="modal-actions">
        <button class="cancel-button" data-close>Hủy</button>
        <button class="primary-button" id="submitBookingBtn">Gửi yêu cầu</button>
      </div>
    `;
  }

  if (type === 'post-request') {
    return `
      <h2>Đăng nhu cầu học</h2>
      <p>Nhập thông tin nhu cầu để gia sư liên hệ.</p>

      <div class="form-group">
        <label>Môn học</label>
        <input id="reqSubject" placeholder="Ví dụ: Toán" />
      </div>

      <div class="form-group">
        <label>Khối lớp</label>
        <input id="reqGrade" placeholder="12" />
      </div>

      <div class="form-group">
        <label>Ngân sách</label>
        <input id="reqBudget" type="number" min="0" placeholder="300000" />
      </div>

      <div class="form-group">
        <label>Mô tả</label>
        <textarea id="reqDesc" placeholder="Nhu cầu chi tiết..."></textarea>
      </div>

      <div class="modal-actions">
        <button class="cancel-button" data-close>Hủy</button>
        <button class="primary-button" id="submitPostReqBtn">Đăng yêu cầu</button>
      </div>
    `;
  }

  if (type === 'event') {
    const id = data._id || data.id;

    return `
      <h2>Chi tiết lịch học</h2>
      <p><b>${escapeHtml(data.subject || 'Buổi học')}</b></p>
      <p>Bắt đầu: ${formatDateTime(data.startTime)}</p>
      <p>Kết thúc: ${formatDateTime(data.endTime)}</p>
      <p>Trạng thái: ${escapeHtml(formatStatus(data.status))}</p>

      <div class="modal-actions">
        <button class="cancel-button" data-close>Đóng</button>
        ${
          id
            ? `<button class="primary-button" id="completeAppointmentBtn" data-id="${escapeHtml(id)}">Đánh dấu hoàn thành</button>`
            : ''
        }
      </div>
    `;
  }

  if (type === 'review') {
    return `
      <h2>Duyệt gia sư</h2>
      <p>Xác nhận hồ sơ đạt yêu cầu kiểm định chuyên môn?</p>

      <div class="modal-actions">
        <button class="cancel-button" data-close>Hủy</button>
        <button class="primary-button" id="confirmVerifyTutorBtn" data-user-id="${escapeHtml(data.userId || '')}">
          Duyệt ngay
        </button>
      </div>
    `;
  }

  return `
    <h2>${escapeHtml(data.feature || 'Tính năng')}</h2>
    <p>Tính năng này chưa có endpoint trong backend hiện tại.</p>

    <div class="modal-actions">
      <button class="cancel-button" data-close>Đóng</button>
    </div>
  `;
}

function openModal(type, data = {}) {
  const modalContent = $('#modalContent');
  const modalBackdrop = $('#modalBackdrop');

  if (modalContent) modalContent.innerHTML = modalTemplate(type, data);

  modalBackdrop?.classList.add('open');
  modalBackdrop?.setAttribute('aria-hidden', 'false');

  $('[data-close]')?.addEventListener('click', closeModal);

  // Booking submit
  $('#submitBookingBtn')?.addEventListener('click', async () => {
    const tutorId = state.selectedTutorId;
    const subject = $('#bookingSubject')?.value.trim();
    const start = $('#bookingStart')?.value;
    const end = $('#bookingEnd')?.value;
    const notes = $('#bookingNotes')?.value.trim() || '';

    if (!subject || !start || !end) {
      showToast('Vui lòng nhập đủ dữ liệu.');
      return;
    }

    if (new Date(end) <= new Date(start)) {
      showToast('Thời gian kết thúc phải sau thời gian bắt đầu.');
      return;
    }

    const token = getToken();
    if (token && token.startsWith('demo_token_')) {
      state.data.appointments.push({
        id: 'apt-' + Date.now(),
        _id: 'apt-' + Date.now(),
        tutorId: { _id: tutorId || 'tutor-1', name: state.selectedTutor || 'Gia sư' },
        tutorName: state.selectedTutor || 'Gia sư',
        subject: subject,
        startTime: new Date(start),
        endTime: new Date(end),
        status: 'confirmed',
        type: 'online',
        price: 300000
      });
      closeModal();
      showToast('✅ Tạo lịch thành công (Demo)');
      renderAllViews();
      return;
    }

    try {
      await createAppointment(
        tutorId,
        subject,
        toIsoFromDateTimeLocal(start),
        toIsoFromDateTimeLocal(end),
        notes
      );
      closeModal();
      showToast('Tạo lịch thành công.');
      await fetchViewData();
      renderAllViews();
    } catch (error) {
      showToast(`Tạo lịch thất bại: ${error.message}`);
    }
  });

  // Tutor request submit
  $('#submitPostReqBtn')?.addEventListener('click', async () => {
    const subject = $('#reqSubject')?.value.trim();
    const grade = $('#reqGrade')?.value.trim() || parseGrade(subject);
    const budget = Number($('#reqBudget')?.value || 0);
    const description = $('#reqDesc')?.value.trim() || '';

    if (!subject || !grade || !budget) {
      showToast('Vui lòng nhập đủ thông tin.');
      return;
    }

    const token = getToken();
    if (token && token.startsWith('demo_token_')) {
      state.data.tutorRequests.push({
        id: 'req-' + Date.now(),
        _id: 'req-' + Date.now(),
        studentId: state.currentUser,
        studentName: state.currentUser?.name || 'Học sinh',
        avatar: getInitials(state.currentUser?.name),
        subject,
        grade,
        description,
        budget
      });
      closeModal();
      showToast('✅ Đã tạo yêu cầu học (Demo)');
      renderAllViews();
      return;
    }

    try {
      await createTutorRequest(subject, grade, description, budget);
      closeModal();
      showToast('Đã tạo yêu cầu học.');
      await fetchViewData();
      renderAllViews();
    } catch (error) {
      showToast(`Tạo yêu cầu thất bại: ${error.message}`);
    }
  });

  // Verify tutor submit
  $('#confirmVerifyTutorBtn')?.addEventListener('click', async (event) => {
    const userId = event.currentTarget.dataset.userId;
    if (!userId) {
      showToast('Không có userId.');
      return;
    }

    const token = getToken();
    if (token && token.startsWith('demo_token_')) {
      const u = state.data.adminUsers.find(user => (user._id || user.id) === userId);
      if (u) u.verified = true;
      closeModal();
      showToast('✅ Đã xác minh gia sư (Demo)');
      renderAllViews();
      return;
    }

    try {
      await verifyTutor(userId);
      closeModal();
      showToast('Đã xác minh gia sư.');
      await fetchViewData();
      renderAllViews();
    } catch (error) {
      showToast(`Xác minh thất bại: ${error.message}`);
    }
  });

  // Complete appointment submit
  $('#completeAppointmentBtn')?.addEventListener('click', async (event) => {
    const id = event.currentTarget.dataset.id;
    const token = getToken();

    if (token && token.startsWith('demo_token_')) {
      const apt = state.data.appointments.find(a => (a._id || a.id) === id);
      if (apt) apt.status = 'completed';
      closeModal();
      showToast('✅ Đã hoàn thành buổi học (Demo)');
      renderAllViews();
      return;
    }

    try {
      await updateAppointment(id, 'completed');
      closeModal();
      showToast('Đã hoàn thành buổi học.');
      await fetchViewData();
      renderAllViews();
    } catch (error) {
      showToast(`Cập nhật thất bại: ${error.message}`);
    }
  });
}

function closeModal() {
  const modal = $('#modalBackdrop');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}


/* =========================================================
   AUTH UI - LOGIN / REGISTER / LOGOUT
========================================================= */

function renderLoginForm() {
  const authForm = document.querySelector('.auth-form');
  if (!authForm) return;

  authForm.innerHTML = `
    <span class="auth-welcome">CHÀO MỪNG TRỞ LẠI</span>
    <h2>Đăng nhập vào TutorConnect</h2>
    <p>Tiếp tục hành trình dạy và học của bạn.</p>

    <form id="loginForm">
      <label>
        Email
        <input id="loginEmail" type="email" placeholder="you@example.com" autocomplete="username" required />
      </label>

      <label>
        Mật khẩu
        <input id="loginPassword" type="password" placeholder="••••••••" autocomplete="current-password" required />
      </label>

      <button class="auth-submit" type="submit">
        Đăng nhập <span>→</span>
      </button>
    </form>

    <div class="auth-footer">
      Chưa có tài khoản?
      <a href="#" id="showRegister">Đăng ký miễn phí</a>
    </div>

    <div class="demo-section">
      <p class="demo-label">👀 Xem Demo</p>
      <div class="demo-buttons">
        <button type="button" class="demo-btn demo-student" id="demoBtnStudent">
          <span>📚</span>
          <div>
            <strong>Demo Học sinh</strong>
            <small>demo.student@tutormate.com</small>
          </div>
        </button>
        <button type="button" class="demo-btn demo-tutor" id="demoBtnTutor">
          <span>👨‍🏫</span>
          <div>
            <strong>Demo Gia sư</strong>
            <small>demo.tutor@tutormate.com</small>
          </div>
        </button>
        <button type="button" class="demo-btn demo-admin" id="demoBtnAdmin">
          <span>⚙️</span>
          <div>
            <strong>Demo Admin</strong>
            <small>demo.admin@tutormate.com</small>
          </div>
        </button>
      </div>
    </div>
  `;

  $('#loginForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = $('#loginEmail')?.value.trim();
    const password = $('#loginPassword')?.value;
    await startLogin(email, password);
  });

  $('#showRegister')?.addEventListener('click', (event) => {
    event.preventDefault();
    renderRegisterForm();
  });

  // Demo buttons
  $('#demoBtnStudent')?.addEventListener('click', (e) => {
    e.preventDefault();
    demoDemoLogin('student');
  });

  $('#demoBtnTutor')?.addEventListener('click', (e) => {
    e.preventDefault();
    demoDemoLogin('tutor');
  });

  $('#demoBtnAdmin')?.addEventListener('click', (e) => {
    e.preventDefault();
    demoDemoLogin('admin');
  });
}

function renderRegisterForm() {
  const authForm = document.querySelector('.auth-form');
  if (!authForm) return;

  authForm.innerHTML = `
    <span class="auth-welcome">THAM GIA TUTORMATE</span>
    <h2>Tạo tài khoản</h2>
    <p>Đăng ký miễn phí để bắt đầu hành trình của bạn.</p>

    <form id="registerForm">
      <label>
        Họ và tên
        <input id="registerName" type="text" placeholder="Nguyễn Văn A" autocomplete="name" required />
      </label>

      <label>
        Email
        <input id="registerEmail" type="email" placeholder="you@example.com" autocomplete="email" required />
      </label>

      <label>
        Mật khẩu
        <input id="registerPassword" type="password" placeholder="Tối thiểu 6 ký tự" autocomplete="new-password" minlength="6" required />
      </label>

      <label>
        Bạn là
        <select id="registerRole" required>
          <option value="student">Học sinh</option>
          <option value="tutor">Gia sư</option>
        </select>
      </label>

      <button class="auth-submit" type="submit">
        Tạo tài khoản <span>→</span>
      </button>
    </form>

    <div class="auth-footer">
      Đã có tài khoản?
      <a href="#" id="showLogin">Đăng nhập</a>
    </div>

    <div class="demo-section">
      <p class="demo-label">👀 Xem Demo Trước Khi Đăng Ký</p>
      <div class="demo-buttons">
        <button type="button" class="demo-btn demo-student" id="demoBtnStudentReg">
          <span>📚</span>
          <div>
            <strong>Demo Học sinh</strong>
            <small>demo.student@tutormate.com</small>
          </div>
        </button>
        <button type="button" class="demo-btn demo-tutor" id="demoBtnTutorReg">
          <span>👨‍🏫</span>
          <div>
            <strong>Demo Gia sư</strong>
            <small>demo.tutor@tutormate.com</small>
          </div>
        </button>
      </div>
    </div>
  `;

  $('#registerForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = $('#registerName')?.value.trim();
    const email = $('#registerEmail')?.value.trim();
    const password = $('#registerPassword')?.value;
    const role = $('#registerRole')?.value;

    if (!name || !email || !password || !role) {
      showToast('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    if (password.length < 6) {
      showToast('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    await startRegister(name, email, password, role);
  });

  $('#showLogin')?.addEventListener('click', (event) => {
    event.preventDefault();
    renderLoginForm();
  });

  $('#demoBtnStudentReg')?.addEventListener('click', (e) => {
    e.preventDefault();
    demoDemoLogin('student');
  });

  $('#demoBtnTutorReg')?.addEventListener('click', (e) => {
    e.preventDefault();
    demoDemoLogin('tutor');
  });
}

async function startLogin(email, password) {
  if (!email || !password) {
    showToast('Vui lòng nhập email và mật khẩu.');
    return;
  }

  try {
    const user = await login(email, password);
    if (!user?.role) throw new Error('Backend không trả về role.');

    state.currentUser = user;
    state.role = user.role;

    showAuthScreen(false);
    applyIdentity();
    renderNav();

    await fetchViewData();
    renderAllViews();
    navigateWithoutFetch('dashboard');

    showToast(`Đăng nhập thành công: ${user.name || user.email}`);
  } catch (error) {
    clearToken();
    state.currentUser = null;
    showToast(`Đăng nhập thất bại: ${error.message}`);
  }
}

async function startRegister(name, email, password, role) {
  try {
    const user = await register(email, password, name, role);
    if (!user?.role) throw new Error('Backend không trả về role.');

    state.currentUser = user;
    state.role = user.role;

    showAuthScreen(false);
    applyIdentity();
    renderNav();

    await fetchViewData();
    renderAllViews();
    navigateWithoutFetch('dashboard');

    showToast('Tạo tài khoản thành công!');
  } catch (error) {
    clearToken();
    state.currentUser = null;
    showToast(`Đăng ký thất bại: ${error.message}`);
  }
}

function logout() {
  clearToken();

  state.currentUser = null;
  state.role = 'student';
  state.currentView = 'dashboard';
  state.selectedTutor = null;
  state.selectedTutorId = null;
  state.selectedConversationId = null;
  state.currentChatPartner = null;

  state.data = {
    appointments: [],
    tutors: [],
    tutorRequests: [],
    conversations: [],
    messages: [],
    transactions: [],
    adminUsers: [],
    adminStats: null,
    progress: null,
    reviews: []
  };

  renderLoginForm();
  showAuthScreen(true);
  renderNav();
  renderAllViews();

  showToast('Bạn đã đăng xuất.');
}

function addLogoutButton() {
  const sidebarBottom = document.querySelector('.sidebar-bottom');
  if (!sidebarBottom || document.querySelector('#logoutBtn')) return;

  const logoutButton = document.createElement('button');
  logoutButton.className = 'side-link';
  logoutButton.id = 'logoutBtn';
  logoutButton.innerHTML = `<span>↪</span> Đăng xuất`;

  sidebarBottom.insertBefore(logoutButton, sidebarBottom.firstElementChild);

  logoutButton.addEventListener('click', () => {
    const confirmed = window.confirm('Bạn có chắc muốn đăng xuất không?');
    if (confirmed) logout();
  });
}


/* =========================================================
   ROLE MENU
========================================================= */

$('#roleMenuButton')?.addEventListener('click', () => {
  const menu = $('#roleMenu');
  if (!menu) return;

  menu.classList.toggle('open');
  $('#roleMenuButton')?.setAttribute(
    'aria-expanded',
    menu.classList.contains('open') ? 'true' : 'false'
  );
});

$$('#roleMenu button').forEach((button) => {
  button.addEventListener('click', async () => {
    const role = button.dataset.role;
    if (!state.currentUser) {
      showToast('Hãy đăng nhập trước.');
      return;
    }

    if (role !== state.currentUser.role) {
      showToast(
        `Tài khoản hiện tại là ${state.currentUser.role}. Không thể đổi role giả lập.`
      );
      return;
    }

    state.role = role;
    state.currentView = 'dashboard';

    applyIdentity();
    renderNav();
    await fetchViewData();
    renderAllViews();
    navigateWithoutFetch('dashboard');
  });
});


/* =========================================================
   GLOBAL EVENTS
========================================================= */

$('#mobileMenu')?.addEventListener('click', () => {
  $('.sidebar')?.classList.toggle('open');
});

$('#closeModal')?.addEventListener('click', closeModal);

$('#modalBackdrop')?.addEventListener('click', (event) => {
  if (event.target === $('#modalBackdrop')) {
    closeModal();
  }
});

$('#searchBtn')?.addEventListener('click', async () => {
  await navigate('explore');
  setTimeout(() => {
    $('#mapSearch')?.focus();
  }, 50);
});

$('#helpBtn')?.addEventListener('click', () =>
  openModal('unsupported', { feature: 'Trung tâm hỗ trợ' })
);

$('#notificationBtn')?.addEventListener('click', () =>
  showToast('Chưa có thông báo mới.')
);

$('#profileBtn')?.addEventListener('click', () =>
  openModal('unsupported', { feature: 'Hồ sơ cá nhân' })
);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal();
});


/* =========================================================
   BOOTSTRAP
========================================================= */

async function bootstrap() {
  loadCurrentUser();
  renderLoginForm();
  addLogoutButton();

  const token = getToken();

  if (!token || !state.currentUser) {
    showAuthScreen(true);
    renderNav();
    renderAllViews();
    return;
  }

  // Nếu là token Demo
  if (token.startsWith('demo_token_')) {
    loadDemoMockData(state.currentUser.role || 'student');
    state.role = state.currentUser.role || 'student';
    showAuthScreen(false);
    applyIdentity();
    renderNav();
    renderAllViews();
    navigateWithoutFetch('dashboard');
    return;
  }

  // Xác thực token thật với backend
  try {
    const freshUser = await getCurrentUser();
    saveCurrentUser(freshUser);
  } catch (error) {
    clearToken();
    state.currentUser = null;
    showAuthScreen(true);
    renderNav();
    renderAllViews();
    return;
  }

  state.role = state.currentUser.role || 'student';

  showAuthScreen(false);
  applyIdentity();
  renderNav();
  await fetchViewData();
  renderAllViews();
  navigateWithoutFetch('dashboard');
}

bootstrap();


/* =========================================================
   EXPORT FOR TESTING
========================================================= */

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    apiCall,
    login,
    register,
    logout,
    searchTutors,
    getAppointments,
    getAppointment,
    createAppointment,
    updateAppointment,
    getCurrentUser,
    getTutorRequests,
    createTutorRequest,
    updateTutorRequest,
    getTutorAvailability,
    getMyAvailability,
    updateMyAvailability,
    getMessages,
    sendMessage,
    markMessageRead,
    createReview,
    getReviews,
    createTransaction,
    getTransactions,
    updateProfile,
    getAllUsers,
    verifyTutor,
    getAdminStats,
    loadDemoMockData,
    demoDemoLogin,
    renderStudentDashboardWithMockData,
    renderCalendarWithMockData,
    renderMessagesWithMockData,
    renderFinanceWithMockData,
    renderTutorDashboardWithMockData,
    renderAdminDashboardWithMockData
  };
}