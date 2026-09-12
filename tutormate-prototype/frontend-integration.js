/**
 * HƯỚNG DẪN TÍCH HỢP FRONTEND VỚI BACKEND API
 * 
 * Thay thế các mock function trong app.js bằng các API calls thực sự
 */

const API_BASE = 'https://tutorconnectstartupbav.onrender.com/api';

// ===== HELPER FUNCTIONS =====

/**
 * Hàm helper để fetch dữ liệu từ API
 */
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API Error');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Lưu token vào localStorage
 */
function saveToken(token) {
  localStorage.setItem('token', token);
}

/**
 * Lấy token từ localStorage
 */
function getToken() {
  return localStorage.getItem('token');
}

/**
 * Xóa token (logout)
 */
function clearToken() {
  localStorage.removeItem('token');
}

// ===== AUTHENTICATION =====

/**
 * Đăng ký tài khoản
 */
async function register(email, password, name, role) {
  const data = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, role }),
  });

  saveToken(data.token);
  return data.user;
}

/**
 * Đăng nhập
 */
async function login(email, password) {
  const data = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  saveToken(data.token);
  return data.user;
}

/**
 * Đăng xuất
 */
function logout() {
  clearToken();
  // Chuyển hướng về trang login
  window.location.href = '/login';
}

// ===== USER MANAGEMENT =====

/**
 * Lấy thông tin profile
 */
async function getProfile(userId) {
  return await apiCall(`/users/${userId}`);
}

/**
 * Cập nhật profile
 */
async function updateProfile(userId, updates) {
  return await apiCall(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Tìm kiếm gia sư
 */
async function searchTutors(subject = '', minRating = 0) {
  const params = new URLSearchParams();
  if (subject) params.append('subject', subject);
  if (minRating) params.append('minRating', minRating);

  return await apiCall(`/users/search/tutors?${params.toString()}`);
}

// ===== APPOINTMENTS =====

/**
 * Tạo lịch học
 */
async function createAppointment(tutorId, subject, dateTime, duration, notes = '') {
  return await apiCall('/appointments', {
    method: 'POST',
    body: JSON.stringify({
      tutorId,
      subject,
      dateTime,
      duration,
      notes,
    }),
  });
}

/**
 * Lấy danh sách lịch học
 */
async function getAppointments() {
  return await apiCall('/appointments');
}

/**
 * Lấy chi tiết một lịch học
 */
async function getAppointment(appointmentId) {
  return await apiCall(`/appointments/${appointmentId}`);
}

/**
 * Cập nhật lịch học
 */
async function updateAppointment(appointmentId, updates) {
  return await apiCall(`/appointments/${appointmentId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Hủy lịch học
 */
async function cancelAppointment(appointmentId) {
  return await updateAppointment(appointmentId, { status: 'cancelled' });
}

/**
 * Xác nhận lịch học
 */
async function confirmAppointment(appointmentId) {
  return await updateAppointment(appointmentId, { status: 'confirmed' });
}

// ===== MESSAGING =====

/**
 * Gửi tin nhắn
 */
async function sendMessage(receiverId, content) {
  return await apiCall('/messages', {
    method: 'POST',
    body: JSON.stringify({ receiverId, content }),
  });
}

/**
 * Lấy cuộc trò chuyện với một người
 */
async function getConversation(otherUserId) {
  return await apiCall(`/messages/${otherUserId}`);
}

/**
 * Đánh dấu tin nhắn đã đọc
 */
async function markMessageAsRead(messageId) {
  return await apiCall(`/messages/${messageId}/read`, {
    method: 'PUT',
  });
}

// ===== REVIEWS =====

/**
 * Tạo đánh giá
 */
async function createReview(tutorId, rating, comment, appointmentId = '') {
  return await apiCall('/reviews', {
    method: 'POST',
    body: JSON.stringify({
      tutorId,
      rating,
      comment,
      appointmentId,
    }),
  });
}

/**
 * Lấy đánh giá cho gia sư
 */
async function getReviews(tutorId) {
  return await apiCall(`/reviews/${tutorId}`);
}

// ===== FINANCE =====

/**
 * Tạo giao dịch
 */
async function createTransaction(tutorId, appointmentId, amount) {
  return await apiCall('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      tutorId,
      appointmentId,
      amount,
    }),
  });
}

/**
 * Lấy lịch sử giao dịch
 */
async function getTransactions() {
  return await apiCall('/transactions');
}

// ===== TUTOR REQUESTS =====

/**
 * Tạo yêu cầu tìm gia sư
 */
async function createTutorRequest(subject, description, budget, preferredTime) {
  return await apiCall('/tutor-requests', {
    method: 'POST',
    body: JSON.stringify({
      subject,
      description,
      budget,
      preferredTime,
    }),
  });
}

/**
 * Lấy yêu cầu tìm gia sư
 */
async function getTutorRequests() {
  return await apiCall('/tutor-requests');
}

/**
 * Cập nhật trạng thái yêu cầu
 */
async function updateTutorRequest(requestId, status) {
  return await apiCall(`/tutor-requests/${requestId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

// ===== ADMIN FUNCTIONS =====

/**
 * Lấy danh sách tất cả người dùng (admin)
 */
async function getAllUsers() {
  return await apiCall('/admin/users');
}

/**
 * Xác minh gia sư (admin)
 */
async function verifyTutor(tutorId) {
  return await apiCall(`/admin/users/${tutorId}/verify`, {
    method: 'PUT',
  });
}

/**
 * Lấy thống kê dashboard (admin)
 */
async function getAdminStats() {
  return await apiCall('/admin/stats');
}

// ===== EXAMPLE: SỬ DỤNG CÁC FUNCTIONS =====

/*
// Ví dụ 1: Login
async function handleLogin(email, password) {
  try {
    const user = await login(email, password);
    console.log('Login successful:', user);
    // Cập nhật UI với thông tin user
    state.user = user;
    renderUI();
  } catch (error) {
    console.error('Login failed:', error.message);
    alert('Đăng nhập thất bại: ' + error.message);
  }
}

// Ví dụ 2: Tạo lịch học
async function handleCreateAppointment(tutorId, subject, dateTime, duration) {
  try {
    const appointment = await createAppointment(tutorId, subject, dateTime, duration);
    console.log('Appointment created:', appointment);
    // Thêm appointment vào state
    state.appointments.push(appointment);
    renderUI();
  } catch (error) {
    console.error('Failed to create appointment:', error.message);
    alert('Tạo lịch học thất bại: ' + error.message);
  }
}

// Ví dụ 3: Tìm kiếm gia sư
async function handleSearchTutors(subject) {
  try {
    const tutors = await searchTutors(subject);
    console.log('Tutors found:', tutors);
    // Cập nhật danh sách gia sư
    state.availableTutors = tutors;
    renderUI();
  } catch (error) {
    console.error('Search failed:', error.message);
  }
}

// Ví dụ 4: Gửi tin nhắn
async function handleSendMessage(receiverId, content) {
  try {
    const message = await sendMessage(receiverId, content);
    console.log('Message sent:', message);
    // Thêm tin nhắn vào cuộc trò chuyện
    renderUI();
  } catch (error) {
    console.error('Failed to send message:', error.message);
  }
}

// Ví dụ 5: Tạo đánh giá
async function handleCreateReview(tutorId, rating, comment) {
  try {
    const review = await createReview(tutorId, rating, comment);
    console.log('Review created:', review);
    alert('Đánh giá đã được gửi thành công!');
  } catch (error) {
    console.error('Failed to create review:', error.message);
    alert('Gửi đánh giá thất bại: ' + error.message);
  }
}
*/

// ===== CÁCH TÍCH HỢP VÀO APP.JS =====

/*
1. Thêm script này vào index.html trước app.js:
   <script src="frontend-integration.js"></script>

2. Thay thế các function trong app.js, ví dụ:

   Cũ:
   function createAppointment() {
     state.appointments.push({ ... mock data ... });
   }

   Mới:
   async function createAppointment(tutorId, subject, dateTime, duration) {
     try {
       const appointment = await createAppointment(tutorId, subject, dateTime, duration);
       state.appointments.push(appointment);
       renderUI();
     } catch (error) {
       alert('Lỗi: ' + error.message);
     }
   }

3. Cập nhật event listeners:
   document.querySelector('.create-appointment-btn').addEventListener('click', async () => {
     const tutorId = document.querySelector('#tutorId').value;
     const subject = document.querySelector('#subject').value;
     const dateTime = document.querySelector('#dateTime').value;
     const duration = parseInt(document.querySelector('#duration').value);
     
     await createAppointment(tutorId, subject, dateTime, duration);
   });

4. Kiểm tra console (F12) để xem API responses
*/

// Export để sử dụng trong các modules khác
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    searchTutors,
    createAppointment,
    getAppointments,
    updateAppointment,
    sendMessage,
    getConversation,
    createReview,
    getReviews,
    createTransaction,
    getTransactions,
    createTutorRequest,
    getTutorRequests,
    getAllUsers,
    verifyTutor,
    getAdminStats,
  };
}