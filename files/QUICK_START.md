# 🚀 Quick Start - Bắt Đầu Nhanh TutorMate Backend

Hướng dẫn chi tiết từng bước để chạy backend API trong 5 phút.

## 📋 Yêu cầu trước

- **Node.js** v14+ ([Tải tại đây](https://nodejs.org/))
- **MongoDB** ([Cài đặt hoặc dùng MongoDB Atlas](https://www.mongodb.com/))
- **npm** (đi kèm với Node.js)

Kiểm tra cài đặt:
```bash
node --version
npm --version
mongod --version  # Hoặc bỏ qua nếu dùng MongoDB Atlas
```

## ⚡ Step 1: Chuẩn bị thư mục

```bash
# Tạo thư mục project
mkdir tutormate-backend
cd tutormate-backend

# Copy các file sau vào thư mục:
# - server.js
# - package.json
# - .env.example
# - frontend-integration.js
```

## 📦 Step 2: Cài đặt Dependencies

```bash
npm install
```

**Được cài gì:**
- Express (Web framework)
- MongoDB (Database)
- JWT (Authentication)
- bcryptjs (Password hashing)
- CORS (Cross-origin requests)

## 🔐 Step 3: Cấu hình Environment

**Option A: MongoDB Local** (Nếu có MongoDB cài trên máy)

1. Chắc chắn MongoDB đang chạy:
```bash
mongod  # Windows/Linux
# hoặc
brew services start mongodb-community  # macOS
```

2. Tạo file `.env`:
```bash
cp .env.example .env
```

3. Giữ nguyên `.env` như vậy:
```
MONGODB_URI=mongodb://localhost:27017/tutormate
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
```

**Option B: MongoDB Atlas Cloud** (Nếu không muốn cài MongoDB)

1. Đăng ký tại [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Tạo cluster và lấy connection string
3. Tạo file `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tutormate
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
```

## 🎯 Step 4: Chạy Server

```bash
# Development mode (auto-reload khi sửa file)
npm run dev

# Hoặc Production mode
npm start
```

**Kết quả thành công:**
```
Connected to MongoDB
Server running on port 5000
```

## ✅ Step 5: Kiểm tra Server

Mở browser hoặc Postman, truy cập:
```
http://localhost:5000/api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

✅ **Server chạy thành công!**

---

## 🧪 Step 6: Test API (Postman hoặc cURL)

### A. Đăng ký tài khoản

**Postman:**
```
Method: POST
URL: http://localhost:5000/api/auth/register
Body (JSON):
{
  "email": "student@example.com",
  "password": "password123",
  "name": "An Lâm",
  "role": "student"
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "name": "An Lâm",
    "role": "student"
  }'
```

**Response:**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "student@example.com",
    "name": "An Lâm",
    "role": "student"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### B. Đăng nhập

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'
```

### C. Lấy Profile (Cần Token)

```bash
curl -X GET http://localhost:5000/api/users/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### D. Tìm kiếm Gia sư

```bash
curl "http://localhost:5000/api/users/search/tutors?subject=Toán&minRating=4"
```

---

## 🔗 Step 7: Tích hợp Frontend

1. **Thêm script vào index.html:**
```html
<!DOCTYPE html>
<html>
<head>
  ...
</head>
<body>
  <!-- Content -->
  
  <!-- Thêm script này -->
  <script src="frontend-integration.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

2. **Cập nhật API Base URL trong frontend-integration.js:**
```javascript
const API_BASE = 'http://localhost:5000/api';
```

3. **Thay thế mock functions bằng API calls:**

**Trước (Mock):**
```javascript
function createAppointment() {
  state.appointments.push({
    id: '1',
    tutor: 'Cô Linh Nguyễn',
    ...
  });
}
```

**Sau (API Call):**
```javascript
async function createAppointment(tutorId, subject, dateTime, duration) {
  try {
    const appointment = await apiCall('/appointments', {
      method: 'POST',
      body: JSON.stringify({
        tutorId,
        subject,
        dateTime,
        duration,
      }),
    });
    state.appointments.push(appointment);
    renderUI();
  } catch (error) {
    alert('Lỗi: ' + error.message);
  }
}
```

---

## 🚨 Troubleshooting

### ❌ MongoDB connection error
**Giải pháp:**
```bash
# Nếu dùng local MongoDB
mongod  # Chạy MongoDB server

# Nếu dùng MongoDB Atlas
# Kiểm tra connection string trong .env
```

### ❌ Port 5000 already in use
**Giải pháp:**
```bash
# Thay đổi PORT trong .env
PORT=5001
```

### ❌ CORS error trong browser
**Giải pháp:** Kiểm tra CORS settings trong server.js:
```javascript
app.use(cors());  // Cho phép tất cả origins
```

### ❌ JWT token expired
**Giải pháp:** Login lại để lấy token mới

---

## 📚 Các File Quan Trọng

| File | Mô tả |
|------|-------|
| `server.js` | Backend API server |
| `package.json` | Dependencies và scripts |
| `.env` | Environment variables |
| `frontend-integration.js` | Helper functions cho frontend |
| `BACKEND_README.md` | API documentation chi tiết |

---

## 🎓 Các Endpoints Chính

### Authentication
```
POST   /api/auth/register     → Đăng ký
POST   /api/auth/login        → Đăng nhập
```

### Users
```
GET    /api/users/:id         → Lấy profile
PUT    /api/users/:id         → Cập nhật profile
GET    /api/users/search/tutors → Tìm gia sư
```

### Appointments
```
POST   /api/appointments      → Tạo lịch học
GET    /api/appointments      → Xem lịch học
PUT    /api/appointments/:id  → Cập nhật lịch học
```

### Messages
```
POST   /api/messages          → Gửi tin nhắn
GET    /api/messages/:userId  → Xem tin nhắn
```

### Reviews
```
POST   /api/reviews           → Tạo đánh giá
GET    /api/reviews/:tutorId  → Xem đánh giá
```

### Transactions
```
POST   /api/transactions      → Tạo giao dịch
GET    /api/transactions      → Xem giao dịch
```

---

## 🎬 Demo Data

Để test, bạn có thể tạo tài khoản:

**Student:**
- Email: student@example.com
- Password: password123
- Role: student

**Tutor:**
- Email: tutor@example.com
- Password: password123
- Role: tutor

**Admin:**
- Email: admin@example.com
- Password: password123
- Role: admin

---

## 🔗 Các Resource Hữu Ích

- [Express.js Docs](https://expressjs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [JWT Guide](https://jwt.io/)
- [Postman Docs](https://learning.postman.com/)

---

## ✨ Bước Tiếp Theo

1. ✅ Backend chạy thành công
2. ⏳ Tích hợp API vào frontend (app.js)
3. ⏳ Thêm validation và error handling
4. ⏳ Deploy lên cloud (Heroku, Railway, Render)
5. ⏳ Thêm tính năng: Video call, Payment, Notifications

---

## 💬 Có Vấn Đề?

**Lỗi phổ biến:**

```javascript
// ❌ Quên Authorization header
fetch('/api/appointments')

// ✅ Đúng cách
fetch('/api/appointments', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

```javascript
// ❌ Quên await async function
createAppointment(...)

// ✅ Đúng cách
await createAppointment(...)
```

```javascript
// ❌ URL không đúng
fetch('localhost:5000/api/users')

// ✅ Đúng cách
fetch('http://localhost:5000/api/users')
```

---

## 🎉 Chúc Mừng!

Bạn đã sẵn sàng phát triển TutorMate với backend hoàn chỉnh!

**Lưu ý:** Đây là phiên bản cơ bản. Để production, hãy thêm:
- Input validation
- Rate limiting
- Error handling chuyên nghiệp
- Logging system
- Testing

---

**Có câu hỏi? Tham khảo BACKEND_README.md để chi tiết! 📖**
