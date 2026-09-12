# TutorMate Backend API

Đây là backend API hoàn chỉnh cho platform TutorMate - nền tảng kết nối gia sư và học sinh.

## 🚀 Tính năng

### Authentication
- ✅ Register (Đăng ký tài khoản)
- ✅ Login (Đăng nhập)
- ✅ JWT Token authentication

### User Management
- ✅ Get profile (Lấy thông tin cá nhân)
- ✅ Update profile (Cập nhật thông tin)
- ✅ Search tutors (Tìm kiếm gia sư)
- ✅ User verification (Xác minh tài khoản)

### Appointments
- ✅ Create appointment (Tạo lịch học)
- ✅ Get appointments (Xem các lịch học)
- ✅ Update appointment (Cập nhật lịch học)
- ✅ Cancel appointment (Hủy lịch học)

### Messaging
- ✅ Send message (Gửi tin nhắn)
- ✅ Get conversation (Xem cuộc trò chuyện)
- ✅ Mark as read (Đánh dấu đã đọc)

### Reviews
- ✅ Create review (Tạo đánh giá)
- ✅ Get reviews (Xem đánh giá)
- ✅ Auto-calculate average rating (Tính rating trung bình)

### Finance
- ✅ Create transaction (Tạo giao dịch)
- ✅ Get transaction history (Xem lịch sử giao dịch)

### Tutor Requests
- ✅ Create tutor request (Tạo yêu cầu tìm gia sư)
- ✅ Get requests (Xem yêu cầu)
- ✅ Update request status (Cập nhật trạng thái)

### Admin Panel
- ✅ View all users (Xem tất cả người dùng)
- ✅ Verify tutors (Xác minh gia sư)
- ✅ Dashboard statistics (Thống kê dashboard)

## 📋 Requirements

- Node.js v14+
- MongoDB v4.4+
- npm hoặc yarn

## 🔧 Installation

1. **Cài đặt dependencies:**
```bash
npm install
```

2. **Tạo file .env:**
```bash
cp .env.example .env
```

3. **Cấu hình MongoDB:**
- Chắc chắn MongoDB đang chạy
- Hoặc sử dụng MongoDB Atlas (cloud):
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tutormate
```

4. **Chạy server:**
```bash
# Development mode (với auto-reload)
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Header
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication APIs

### 1. Register (Đăng ký)
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "Tên người dùng",
  "role": "student"  // hoặc "tutor", "admin"
}

Response:
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "Tên người dùng",
    "role": "student"
  },
  "token": "eyJhbGc..."
}
```

### 2. Login (Đăng nhập)
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "user": { ... },
  "token": "eyJhbGc..."
}
```

---

## 👥 User APIs

### 1. Get Profile
```
GET /users/:id
Authorization: Bearer <token>

Response:
{
  "_id": "...",
  "email": "user@example.com",
  "name": "Tên người dùng",
  "role": "student",
  "avatar": "...",
  "bio": "Giới thiệu bản thân",
  "subjects": ["Toán", "Tiếng Anh"],
  "rating": 4.5,
  "totalReviews": 12,
  ...
}
```

### 2. Update Profile
```
PUT /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "bio": "Cập nhật bio",
  "subjects": ["Toán", "Tiếng Anh", "Vật lý"],
  "hourlyRate": 200000
}

Response: Updated user object
```

### 3. Search Tutors
```
GET /users/search/tutors?subject=Toán&minRating=4

Response: [
  {
    "_id": "...",
    "name": "Gia sư A",
    "subjects": ["Toán", "Vật lý"],
    "rating": 4.8,
    "hourlyRate": 250000,
    ...
  }
]
```

---

## 📅 Appointment APIs

### 1. Create Appointment
```
POST /appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "tutorId": "tutor_id",
  "subject": "Toán học",
  "dateTime": "2024-01-20T14:00:00Z",
  "duration": 60,
  "notes": "Ghi chú thêm"
}

Response:
{
  "_id": "...",
  "studentId": "...",
  "tutorId": "...",
  "subject": "Toán học",
  "status": "pending",
  ...
}
```

### 2. Get My Appointments
```
GET /appointments
Authorization: Bearer <token>

Response: [
  {
    "_id": "...",
    "studentId": { ... },
    "tutorId": { ... },
    "dateTime": "2024-01-20T14:00:00Z",
    "status": "confirmed",
    ...
  }
]
```

### 3. Update Appointment
```
PUT /appointments/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed",  // hoặc "completed", "cancelled"
  "notes": "Cập nhật ghi chú"
}

Response: Updated appointment object
```

---

## 💬 Message APIs

### 1. Send Message
```
POST /messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverId": "recipient_id",
  "content": "Nội dung tin nhắn"
}

Response: Message object with timestamps
```

### 2. Get Conversation
```
GET /messages/:otherUserId
Authorization: Bearer <token>

Response: [
  {
    "_id": "...",
    "senderId": { ... },
    "receiverId": { ... },
    "content": "Nội dung tin nhắn",
    "read": true,
    "createdAt": "2024-01-20T14:00:00Z"
  }
]
```

### 3. Mark as Read
```
PUT /messages/:id/read
Authorization: Bearer <token>

Response: Updated message object
```

---

## ⭐ Review APIs

### 1. Create Review
```
POST /reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "tutorId": "tutor_id",
  "rating": 5,
  "comment": "Gia sư rất tuyệt vời!",
  "appointmentId": "appointment_id"
}

Response: Review object
```

### 2. Get Reviews for Tutor
```
GET /reviews/:tutorId

Response: [
  {
    "_id": "...",
    "tutorId": "...",
    "studentId": { name: "...", ... },
    "rating": 5,
    "comment": "...",
    "createdAt": "..."
  }
]
```

---

## 💰 Transaction APIs

### 1. Create Transaction
```
POST /transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "tutorId": "tutor_id",
  "appointmentId": "appointment_id",
  "amount": 250000
}

Response: Transaction object
```

### 2. Get Transactions
```
GET /transactions
Authorization: Bearer <token>

Response: [
  {
    "_id": "...",
    "tutorId": { ... },
    "studentId": { ... },
    "amount": 250000,
    "status": "completed",
    "createdAt": "..."
  }
]
```

---

## 🎓 Tutor Request APIs

### 1. Create Tutor Request
```
POST /tutor-requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject": "Tiếng Anh",
  "description": "Muốn học tiếng Anh giao tiếp",
  "budget": 300000,
  "preferredTime": "Chiều T2-T5"
}

Response: TutorRequest object
```

### 2. Get Tutor Requests
```
GET /tutor-requests
Authorization: Bearer <token>

Response: [
  {
    "_id": "...",
    "studentId": { ... },
    "subject": "Tiếng Anh",
    "status": "open",
    ...
  }
]
```

### 3. Update Request Status
```
PUT /tutor-requests/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "matched"  // hoặc "completed"
}

Response: Updated request object
```

---

## 🛡️ Admin APIs

### 1. Get All Users
```
GET /admin/users
Authorization: Bearer <admin_token>

Response: [
  {
    "_id": "...",
    "name": "...",
    "email": "...",
    "role": "tutor",
    "verified": false
  }
]
```

### 2. Verify Tutor
```
PUT /admin/users/:id/verify
Authorization: Bearer <admin_token>

Response: Updated user object with verified: true
```

### 3. Dashboard Stats
```
GET /admin/stats
Authorization: Bearer <admin_token>

Response:
{
  "totalUsers": 150,
  "totalTutors": 35,
  "totalStudents": 115,
  "totalAppointments": 500,
  "revenue": 25000000
}
```

---

## 🔗 Tích hợp Frontend

Để tích hợp frontend (app.js) với backend này:

### 1. Cập nhật API Base URL
```javascript
const API_BASE = 'http://localhost:5000/api';

// Ví dụ: Login
async function login(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data.user;
}

// Ví dụ: Get Profile
async function getProfile(userId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/users/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
}
```

### 2. Sử dụng Authorization Header
Thêm token vào mỗi request:
```javascript
const token = localStorage.getItem('token');
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};
```

---

## 🧪 Testing với Postman/cURL

### Login Example
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
- Kiểm tra MongoDB đang chạy: `mongod --version`
- Kiểm tra MONGODB_URI trong .env

### JWT Token Expired
- Token hết hạn sau 7 ngày, yêu cầu login lại

### CORS Error
- Cập nhật CORS_ORIGIN trong .env hoặc server.js

---

## 📦 Production Deployment

Trước khi deploy:

1. **Cập nhật .env:**
```
JWT_SECRET=<random-secret-key>
MONGODB_URI=<production-mongodb-uri>
NODE_ENV=production
PORT=5000
```

2. **Tối ưu hóa:**
- Thêm rate limiting
- Thêm input validation
- Thêm error handling
- Sử dụng HTTPS

3. **Deploy tới Heroku/Railway/Render:**
```bash
npm install -g heroku-cli
heroku create tutormate-backend
heroku config:set JWT_SECRET=your-secret-key
git push heroku main
```

---

## 📝 Ghi chú

- Tất cả endpoints require authentication except register, login, health check, search tutors
- Role-based access control cho admin features
- Auto-calculate rating từ reviews
- Timestamps được tự động thêm vào

---

## 🤝 Support

Có câu hỏi? Kiểm tra lại API docs hoặc console logs!

**Chúc bạn phát triển vui vẻ! 🚀**
