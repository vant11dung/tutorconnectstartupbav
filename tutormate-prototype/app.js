const state = {
  role: 'student',
  currentView: 'dashboard',
  selectedTutor: 'Cô Linh Nguyễn',
  selectedTutorId: null,
  unread: 3,
  cvUploaded: false,
  appointments: 12,
  tutorRequests: 3,
  reviews: 7,
  focusSeconds: 25 * 60,
  focusTimer: null,
  currentUser: null,
  data: {
    appointments: [],
    tutors: [],
    tutorRequests: [],
    conversations: [],
    currentChatPartner: null,
    messages: [],
    transactions: [],
    adminUsers: [],
    adminStats: null
  }
};

// ===== Add this at the TOP of app.js (after const state = {...}) =====

// Placeholder functions từ frontend-integration.js
function getToken() {
  return localStorage.getItem('token');
}

function saveToken(token) {
  localStorage.setItem('token', token);
}

function clearToken() {
  localStorage.removeItem('token');
}

async function apiCall(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`http://localhost:5000/api${endpoint}`, {
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

// API Functions
async function login(email, password) {
  const data = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  saveToken(data.token);
  return data.user;
}

async function register(email, password, name, role) {
  const data = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, role }),
  });
  saveToken(data.token);
  return data.user;
}

async function searchTutors(subject = '', minRating = 0) {
  const params = new URLSearchParams();
  if (subject) params.append('subject', subject);
  if (minRating) params.append('minRating', minRating);
  return await apiCall(`/users/search/tutors?${params.toString()}`);
}

async function getAppointments() {
  return await apiCall('/appointments');
}

async function getTutorRequests() {
  return await apiCall('/tutor-requests');
}

async function getTransactions() {
  return await apiCall('/transactions');
}

async function getAllUsers() {
  return await apiCall('/admin/users');
}

async function getAdminStats() {
  return await apiCall('/admin/stats');
}

async function createAppointment(tutorId, subject, dateTime, duration, notes = '') {
  return await apiCall('/appointments', {
    method: 'POST',
    body: JSON.stringify({ tutorId, subject, dateTime, duration, notes }),
  });
}

async function createTutorRequest(subject, description, budget, preferredTime) {
  return await apiCall('/tutor-requests', {
    method: 'POST',
    body: JSON.stringify({ subject, description, budget, preferredTime }),
  });
}

async function verifyTutor(tutorId) {
  return await apiCall(`/admin/users/${tutorId}/verify`, {
    method: 'PUT',
  });
}

async function sendMessage(receiverId, content) {
  return await apiCall('/messages', {
    method: 'POST',
    body: JSON.stringify({ receiverId, content }),
  });
}

async function updateTutorRequest(requestId, status) {
  return await apiCall(`/tutor-requests/${requestId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

// ===== END OF ADDED FUNCTIONS =====

const roles = {
  student: {
    title: 'Không gian học sinh', person: 'An Lâm', initials: 'AL', avatar: 'avatar-user',
    nav: [
      ['dashboard', '⌂', 'Tổng quan'], ['explore', '⌖', 'Tìm gia sư'], ['calendar', '▣', 'Lịch học'],
      ['classroom', '◉', 'Lớp học số'], ['coach', '✦', 'AI Study Coach'], ['messages', '◴', 'Tin nhắn', '3'],
      ['documents', '▤', 'Tài liệu học tập'], ['finance', '◈', 'Thanh toán']
    ]
  },
  tutor: {
    title: 'Không gian gia sư', person: 'Ngọc Mai', initials: 'NM', avatar: 'avatar-tutor',
    nav: [
      ['dashboard', '⌂', 'Tổng quan'], ['explore', '⌖', 'Tìm học sinh'], ['calendar', '▣', 'Lịch giảng dạy'],
      ['classroom', '◉', 'Lớp học số'], ['coach', '✦', 'Teaching Studio'], ['messages', '◴', 'Tin nhắn', '3'],
      ['documents', '▤', 'Hồ sơ & CV'], ['finance', '◈', 'Thu nhập']
    ]
  },
  admin: {
    title: 'Không gian quản trị', person: 'Nguyễn Hoàng', initials: 'NH', avatar: 'avatar-admin',
    nav: [
      ['dashboard', '⌂', 'Tổng quan'], ['admin-review', '✓', 'Duyệt gia sư', '7'], ['calendar', '▣', 'Lịch hệ thống'],
      ['classroom', '◉', 'Giám sát lớp học'], ['coach', '♢', 'Trust & Safety'], ['messages', '◴', 'Tin nhắn hỗ trợ', '5'],
      ['finance', '◈', 'Tài chính'], ['documents', '▤', 'Báo cáo']
    ]
  }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function getInitials(name) {
  if (!name) return 'TM';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function setRole(role) {
  state.role = role;
  state.currentView = 'dashboard';
  if (state.focusTimer) { window.clearInterval(state.focusTimer); state.focusTimer = null; }
  const detail = roles[role];
  const displayName = state.currentUser?.name || detail.person;
  const initials = getInitials(displayName);

  if ($('#workspaceTitle')) $('#workspaceTitle').textContent = detail.title;
  if ($('#workspacePerson')) $('#workspacePerson').textContent = displayName;
  if ($('.current-workspace .avatar')) {
    $('.current-workspace .avatar').textContent = initials;
    $('.current-workspace .avatar').className = `avatar ${detail.avatar}`;
  }
  if ($('#profileBtn')) {
    $('#profileBtn').textContent = initials;
    $('#profileBtn').className = `top-avatar avatar ${detail.avatar}`;
  }
  if ($('#breadcrumbRole')) $('#breadcrumbRole').textContent = detail.title;
  
  renderNav(); 
  await fetchViewData();
  renderAllViews(); 
  navigate('dashboard');
  
  $('#roleMenu')?.classList.remove('open'); 
  $('#roleMenuButton')?.setAttribute('aria-expanded', 'false');
  if (window.innerWidth < 680) $('.sidebar')?.classList.remove('open');
  showToast(`Đã chuyển sang ${detail.title.toLowerCase()}`);
}

function renderNav() {
  const detail = roles[state.role];
  const navContainer = $('#mainNav');
  if (!navContainer) return;
  navContainer.innerHTML = `<p class="nav-label">KHÔNG GIAN CỦA BẠN</p>${detail.nav.map(([id, icon, label, count]) => `
    <button class="nav-item ${id === state.currentView ? 'active' : ''}" data-view="${id}"><span class="nav-icon">${icon}</span><span>${label}</span>${count ? `<span class="nav-count">${id === 'messages' ? state.unread : count}</span>` : ''}</button>`).join('')}`;
  $$('.nav-item').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.view)));
}

async function navigate(view) {
  state.currentView = view;
  const title = { 
    dashboard: 'Tổng quan', 
    explore: state.role === 'tutor' ? 'Tìm học sinh' : 'Tìm gia sư', 
    calendar: state.role === 'tutor' ? 'Lịch giảng dạy' : 'Lịch học', 
    messages: 'Tin nhắn', 
    classroom: state.role === 'admin' ? 'Giám sát lớp học' : 'Lớp học số', 
    coach: state.role === 'student' ? 'AI Study Coach' : state.role === 'tutor' ? 'Teaching Studio' : 'Trust & Safety', 
    documents: state.role === 'tutor' ? 'Hồ sơ & CV' : 'Tài liệu học tập', 
    finance: state.role === 'tutor' ? 'Thu nhập' : state.role === 'admin' ? 'Tài chính' : 'Thanh toán', 
    'admin-review': 'Duyệt gia sư' 
  };
  
  $$('.view').forEach(viewEl => viewEl.classList.remove('active'));
  $(`#view-${view}`)?.classList.add('active');
  if ($('#breadcrumbPage')) $('#breadcrumbPage').textContent = title[view] || 'Tổng quan';
  
  renderNav();
  await fetchViewData();
  renderAllViews();
}

async function fetchViewData() {
  if (!getToken()) return;
  try {
    if (state.currentView === 'dashboard' || state.currentView === 'calendar') {
      try { state.data.appointments = await getAppointments(); } catch (e) { console.warn('Appointments API fail:', e.message); }
    }
    if (state.currentView === 'dashboard' || state.currentView === 'explore') {
      try { state.data.tutors = await searchTutors(); } catch (e) { console.warn('Tutors API fail:', e.message); }
      try { state.data.tutorRequests = await getTutorRequests(); } catch (e) { console.warn('Requests API fail:', e.message); }
    }
    if (state.currentView === 'finance') {
      try { state.data.transactions = await getTransactions(); } catch (e) { console.warn('Transactions API fail:', e.message); }
    }
    if (state.role === 'admin' && (state.currentView === 'dashboard' || state.currentView === 'admin-review')) {
      try { state.data.adminUsers = await getAllUsers(); } catch (e) { console.warn('Admin Users API fail:', e.message); }
      try { state.data.adminStats = await getAdminStats(); } catch (e) { console.warn('Admin Stats API fail:', e.message); }
    }
  } catch (err) {
    console.error('Error fetching view data:', err);
  }
}

const tutorAvatar = (name, cls = 'avatar-linh') => `<span class="avatar ${cls}">${getInitials(name)}</span>`;

function studentDashboard() {
  const appointments = state.data.appointments || [];
  const tutors = state.data.tutors || [];

  const apptRowsHtml = appointments.length > 0 
    ? appointments.slice(0, 3).map(a => {
        const date = new Date(a.dateTime || Date.now());
        const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const tutorName = a.tutorId?.name || 'Gia sư';
        return `
          <div class="schedule-row">
            <div class="time-block"><b>${timeStr}</b>60p</div>
            <i class="event-dot"></i>
            <div class="event-info"><b>${a.subject || 'Lịch học'}</b><span>${tutorName} · ${a.notes || 'Trực tuyến'}</span></div>
            <span class="event-chip online">${a.status === 'confirmed' ? 'Đã xác nhận' : 'Trực tuyến'}</span>
          </div>`;
      }).join('')
    : `
      <div class="schedule-row">
        <div class="time-block"><b>09:00</b>10:30</div><i class="event-dot"></i>
        <div class="event-info"><b>Toán 12 · Tích phân</b><span>Cô Linh Nguyễn · Phòng học trực tuyến</span></div>
        <span class="event-chip online">Trực tuyến</span>
      </div>
      <div class="schedule-row">
        <div class="time-block"><b>15:30</b>17:00</div><i class="event-dot mint"></i>
        <div class="event-info"><b>IELTS Speaking</b><span>Thầy Minh Phạm · Quận Bình Thạnh</span></div>
        <span class="event-chip home">Tại nhà</span>
      </div>`;

  const tutorsHtml = tutors.length > 0
    ? tutors.slice(0, 3).map((t, idx) => `
        <div class="mini-tutor">
          <div class="mini-tutor-top">${tutorAvatar(t.name, idx % 2 === 0 ? 'avatar-linh' : 'avatar-minh')}<div><h3>${t.name}</h3><p>${(t.subjects || ['Toán']).join(', ')} · ${t.experience || 'Nhiều năm kn'}</p></div></div>
          <div class="rating"><strong>★ ${(t.rating || 4.9).toFixed(1)}</strong> · ${t.totalReviews || 12} đánh giá</div>
          <button data-open="booking" data-tutor-id="${t._id}" data-tutor-name="${t.name}">Đặt lịch học</button>
        </div>`).join('')
    : `
        <div class="mini-tutor"><div class="mini-tutor-top">${tutorAvatar('LN')}<div><h3>Cô Linh Nguyễn</h3><p>Toán · 8 năm kinh nghiệm</p></div></div><div class="rating"><strong>★ 4.9</strong> · 126 đánh giá</div><button data-open="booking">Đặt lịch học</button></div>
        <div class="mini-tutor"><div class="mini-tutor-top">${tutorAvatar('MP','avatar-minh')}<div><h3>Thầy Minh Phạm</h3><p>IELTS · 7.5 Overall</p></div></div><div class="rating"><strong>★ 4.8</strong> · 94 đánh giá</div><button data-open="booking">Đặt lịch học</button></div>
        <div class="mini-tutor"><div class="mini-tutor-top">${tutorAvatar('TK','avatar-huy')}<div><h3>Thầy Tuấn Khôi</h3><p>Vật lý · ĐH Bách Khoa</p></div></div><div class="rating"><strong>★ 5.0</strong> · 78 đánh giá</div><button data-open="booking">Đặt lịch học</button></div>`;

  return `
    <div class="welcome"><div><p class="eyebrow">Thứ Hai, 17 tháng 8</p><h1>Chào buổi sáng, ${state.currentUser?.name || 'An'}! <span aria-hidden="true">✦</span></h1><p>Bạn đã sẵn sàng cho một ngày học tập hiệu quả?</p></div><div class="date-pill"><span>▣</span> Tuần 17 — 23 tháng 8</div></div>
    <div class="student-grid">
      <article class="card schedule-card"><div class="card-heading"><h2>Lịch học hôm nay</h2><button class="text-action" data-go="calendar">Xem lịch đầy đủ →</button></div>
        <div class="schedule-list">${apptRowsHtml}</div>
      </article>
      <div class="right-column">
        <article class="card progress-card"><h2>Tiến độ học tập</h2><div class="progress-top"><div class="progress-ring"><b>70%</b><small>mục tiêu</small></div><div class="progress-note"><b>Đúng hướng rồi!</b><span>Hoàn thành thêm 3 buổi học để đạt mục tiêu tháng.</span></div></div><div class="subject-progress"><div><span>Toán học</span><b>82%</b></div><div class="meter"><i style="width:82%"></i></div></div><div class="subject-progress mint"><div><span>Tiếng Anh</span><b>66%</b></div><div class="meter mint"><i style="width:66%"></i></div></div></article>
        <article class="card question-card"><span class="question-icon">?</span><h3>Cần giải đáp nhanh?</h3><p>Đặt câu hỏi cho gia sư hoặc cộng đồng học tập của TutorConnect.</p><button data-open="question">Đặt câu hỏi ngay →</button></article>
      </div>
      <article class="card recommended-card"><div class="card-heading"><h2>Gia sư được đề xuất cho bạn</h2><button class="text-action" data-go="explore">Khám phá tất cả →</button></div><div class="teacher-scroll">${tutorsHtml}</div></article>
      <article class="card next-class"><span class="label">BUỔI HỌC SẮP TỚI</span><h3>Toán 12 · Tích phân</h3><p>Còn 01 giờ 42 phút</p><div class="next-class-bottom">${tutorAvatar('LN')}<button data-open="classroom">Vào lớp học →</button></div></article>
    </div>`;
}

function tutorDashboard() {
  const requests = state.data.tutorRequests || [];
  const reqHtml = requests.length > 0
    ? requests.slice(0, 3).map((r, i) => `
        <div class="student-request">
          ${tutorAvatar(r.studentId?.name || 'Học sinh', i % 2 === 0 ? 'avatar-user' : 'avatar-huy')}
          <div class="request-copy"><b>${r.studentId?.name || 'Học sinh'} · ${r.subject || 'Toán'}</b><span>${r.description || 'Muốn tìm gia sư'} · ${r.preferredTime || 'Lịch linh hoạt'}</span></div>
          <div class="request-actions"><button data-accept="${r.studentId?.name || 'Học sinh'}" data-request-id="${r._id}">Nhận lớp</button><button>Bỏ qua</button></div>
        </div>`).join('')
    : `
        <div class="student-request">${tutorAvatar('GH','avatar-user')}<div class="request-copy"><b>Gia Hân · Toán 10</b><span>Muốn học 2 buổi/tuần · Quận 3 · Từ 25/08</span></div><div class="request-actions"><button data-accept="Gia Hân">Nhận lớp</button><button>Bỏ qua</button></div></div>
        <div class="student-request">${tutorAvatar('HP','avatar-huy')}<div class="request-copy"><b>Hoàng Phúc · Toán 12</b><span>Ôn thi THPT · Trực tuyến · Buổi tối</span></div><div class="request-actions"><button data-accept="Hoàng Phúc">Nhận lớp</button><button>Bỏ qua</button></div></div>`;

  return `
    <div class="welcome"><div><p class="eyebrow">Thứ Hai, 17 tháng 8</p><h1>Chào ${state.currentUser?.name || 'Mai'}, chúc bạn một ngày tốt lành! <span aria-hidden="true">✦</span></h1><p>Hôm nay bạn có 4 buổi dạy và ${requests.length || state.tutorRequests} yêu cầu mới.</p></div><button class="heading-action" data-open="availability">＋ Cập nhật lịch rảnh</button></div>
    <div class="tutor-grid">
      <div><div class="metric-grid"><article class="card metric-card"><span class="metric-icon">♙</span><p>Học sinh đang dạy</p><h3>24</h3><small>↑ 12% so với tháng trước</small></article><article class="card metric-card"><span class="metric-icon">▣</span><p>Buổi học tháng này</p><h3>${(state.data.appointments || []).length || state.appointments}</h3><small>↑ 8% so với tháng trước</small></article><article class="card metric-card"><span class="metric-icon">◈</span><p>Thu nhập dự kiến</p><h3>12.8tr</h3><small>Đã đạt 82% mục tiêu</small></article></div>
      <article class="card"><div class="card-heading"><h2>Yêu cầu học mới <span style="color:#ef6677">(${requests.length || state.tutorRequests})</span></h2><button class="text-action" data-open="requests">Xem tất cả →</button></div><div class="student-request-list">${reqHtml}</div></article></div>
      <div class="right-column"><article class="card"><div class="card-heading"><h2>Lịch hôm nay</h2><button class="text-action" data-go="calendar">Mở lịch →</button></div><div class="tutor-calendar"><div class="timeline"><div class="timeline-item"><b>09:00 · Toán 12 với An Lâm</b><p>Trực tuyến · <span>Vào phòng học</span></p></div><div class="timeline-item"><b>15:30 · Toán 10 với Gia Hân</b><p>Tại nhà · Quận 3</p></div><div class="timeline-item"><b>19:00 · Lớp nhóm ôn thi</b><p>Trực tuyến · 6 học sinh</p></div></div></div></article>
        <article class="card cv-card"><h3>Hồ sơ của bạn</h3><p>${state.cvUploaded ? 'CV của bạn đã được cập nhật và đang chờ duyệt.' : 'Tăng độ tin cậy bằng cách hoàn thiện CV và xác thực bằng cấp.'}</p><div class="cv-progress"><i style="width:${state.cvUploaded ? '100' : '76'}%"></i></div><small>${state.cvUploaded ? '100% hoàn thiện · Đang xét duyệt' : '76% hoàn thiện · Còn thiếu CV'}</small><button data-open="cv">${state.cvUploaded ? 'Xem hồ sơ đã nộp' : 'Hoàn thiện hồ sơ'} →</button></article>
        <article class="card earnings-card"><span class="label">SỐ DƯ KHẢ DỤNG</span><h3>8.450.000đ</h3><p>Kỳ thanh toán tiếp theo: 25/08/2026</p><button data-go="finance">Xem thu nhập →</button></article></div>
    </div>`;
}

function adminDashboard() {
  const stats = state.data.adminStats;
  const users = state.data.adminUsers || [];
  const pendingTutors = users.filter(u => u.role === 'tutor' && !u.verified);

  const reviewRowsHtml = pendingTutors.length > 0
    ? pendingTutors.slice(0, 3).map((u, i) => `
        <tr>
          <td><div class="table-person">${tutorAvatar(u.name, i % 2 === 0 ? 'avatar-huy' : 'avatar-minh')}<div><b>${u.name}</b><span>${u.email}</span></div></div></td>
          <td><span class="subject-pill">${(u.subjects || ['Chưa xếp']).join(', ')}</span></td>
          <td>Chờ duyệt</td>
          <td><span class="status-pill waiting">Chờ duyệt</span></td>
          <td><button class="table-action" data-review="${u.name}" data-user-id="${u._id}">Xem & duyệt</button></td>
        </tr>`).join('')
    : `
      <tr><td><div class="table-person">${tutorAvatar('TK','avatar-huy')}<div><b>Trần Khánh</b><span>ĐH Sư phạm TP.HCM</span></div></div></td><td><span class="subject-pill">Tiếng Anh</span></td><td>08:30 hôm nay</td><td><span class="status-pill waiting">Chờ duyệt</span></td><td><button class="table-action" data-review="Trần Khánh">Xem hồ sơ</button></td></tr>
      <tr><td><div class="table-person">${tutorAvatar('PA','avatar-minh')}<div><b>Phương Anh</b><span>ĐH Kinh tế TP.HCM</span></div></div></td><td><span class="subject-pill">Toán cấp 2</span></td><td>Hôm qua</td><td><span class="status-pill waiting">Chờ duyệt</span></td><td><button class="table-action" data-review="Phương Anh">Xem hồ sơ</button></td></tr>`;

  return `
    <div class="welcome"><div><p class="eyebrow">CẬP NHẬT TỪ HỆ THỐNG API</p><h1>Xin chào, ${state.currentUser?.name || 'Hoàng'}! <span aria-hidden="true">✦</span></h1><p>Hệ thống đang hoạt động ổn định. Có ${pendingTutors.length || state.reviews} hồ sơ cần bạn xem xét.</p></div><button class="heading-action" data-go="admin-review">Duyệt gia sư →</button></div>
    <div class="admin-metrics">
      <article class="card admin-metric"><p>Người dùng hoạt động</p><h2>${stats?.totalUsers || users.length || 2846}</h2><small>Hệ thống thực tế</small></article>
      <article class="card admin-metric"><p>Hồ sơ chờ duyệt</p><h2>${pendingTutors.length || state.reviews}</h2><small>Gia sư chưa xác minh</small></article>
      <article class="card admin-metric"><p>Buổi học hoàn thành</p><h2>${stats?.totalAppointments || 1284}</h2><small>Tất cả lượt học</small></article>
      <article class="card admin-metric"><p>Doanh thu hệ thống</p><h2>${stats?.revenue ? (stats.revenue / 1000000).toFixed(1) + 'tr' : '184.6tr'}</h2><small>Tổng cộng</small></article>
    </div>
    <div class="admin-grid"><article class="card admin-table-card"><div class="table-heading"><h2>Hồ sơ gia sư cần duyệt</h2><button data-go="admin-review">Xem tất cả →</button></div><table class="review-table"><thead><tr><th>GIA SƯ</th><th>CHUYÊN MÔN</th><th>NỘP LÚC</th><th>TRẠNG THÁI</th><th></th></tr></thead><tbody>${reviewRowsHtml}</tbody></table></article><article class="card revenue-card"><h2>Doanh thu tháng 8</h2><div class="chart-head"><b>184.600.000đ</b><span>↑ 9.4%</span></div><div class="bar-chart"><div style="height:38%" data-label="T2"></div><div style="height:52%" data-label="T3"></div><div style="height:42%" data-label="T4"></div><div style="height:70%" data-label="T5"></div><div style="height:59%" data-label="T6"></div><div style="height:87%" data-label="T7"></div><div style="height:78%" data-label="CN"></div></div><div class="transaction-list"><h3>Thanh toán gần đây</h3><div class="transaction"><span class="transaction-icon">↓</span><div class="transaction-copy"><b>Học phí · An Lâm</b><span>Hôm nay, 08:42</span></div><strong>+ 640.000đ</strong></div><div class="transaction"><span class="transaction-icon">↓</span><div class="transaction-copy"><b>Học phí · Gia Hân</b><span>Hôm qua, 20:18</span></div><strong>+ 480.000đ</strong></div></div></article></div>`;
}

function mapSvg() {
  return `<svg class="map-art" viewBox="0 0 750 570" aria-label="Bản đồ mô phỏng các gia sư gần bạn" role="img">
    <path class="water" d="M0 450 C90 420 145 455 240 438 S385 420 480 442 S640 459 750 411 V570 H0Z"/>
    <path class="road major" d="M-20 96 C95 130 108 98 202 135 S326 194 438 162 569 98 777 150"/><path class="road major" d="M180 -20 C222 100 208 164 263 255 S369 375 356 590"/>
    <path class="road minor" d="M8 207 C115 225 164 191 254 207 S418 280 544 242 634 207 774 243"/><path class="road minor" d="M-20 369 C92 336 146 370 229 346 S385 308 466 352 610 382 765 339"/><path class="road minor" d="M505 -15 C466 103 510 136 490 213 S421 283 444 390 508 467 526 584"/><path class="road minor" d="M52 12 C92 86 98 154 65 241 S101 359 113 468 145 541 187 590"/>
    <g stroke="#d8ded5" stroke-width="2" opacity=".75"><path fill="none" d="M11 254l137 8 84 68 111-2 90-59 139 17 136-51"/><path fill="none" d="M20 436l100-41 145 23 80 54 103-20 107 25 162-17"/><path fill="none" d="M280 22l41 105-24 86 85 56 86-16 99 73"/></g>
    <g class="map-label"><text x="254" y="91">QUẬN 1</text><text x="423" y="189">BÌNH THẠNH</text><text x="105" y="333">QUẬN 3</text><text x="278" y="424">QUẬN 4</text><text x="525" y="347">THỦ ĐỨC</text><text x="55" y="167">TÂN BÌNH</text></g>
    <g class="map-marker" data-map-tutor="Cô Linh Nguyễn" transform="translate(330 185)"><circle r="17" fill="#5b5ce2"/><text x="0" y="5" text-anchor="middle" fill="#fff" font-size="16">♙</text></g>
    <g class="map-marker" data-map-tutor="Thầy Minh Phạm" transform="translate(497 247)"><circle r="17" fill="#ee7181"/><text x="0" y="5" text-anchor="middle" fill="#fff" font-size="16">♙</text></g>
    <g class="map-marker" data-map-tutor="Thầy Tuấn Khôi" transform="translate(206 338)"><circle r="17" fill="#39bda0"/><text x="0" y="5" text-anchor="middle" fill="#fff" font-size="16">♙</text></g>
    <g class="map-marker" data-map-tutor="Cô Hương Giang" transform="translate(556 376)"><circle r="17" fill="#f4b84f"/><text x="0" y="5" text-anchor="middle" fill="#fff" font-size="16">♙</text></g>
  </svg>`;
}

function studentExplore() {
  return `<div class="page-heading"><div><p class="eyebrow">KẾT NỐI ĐÚNG NGƯỜI, ĐÚNG NHU CẦU</p><h1>Tìm gia sư gần bạn</h1><p>Khám phá gia sư đã được xác thực và phù hợp nhất với mục tiêu học tập của bạn.</p></div><button class="heading-action" data-open="post-request">＋ Đăng nhu cầu học</button></div>
    <div class="explore-layout"><aside class="card filter-panel"><div class="filter-title"><h2>Bộ lọc</h2><button data-reset-filter>Đặt lại</button></div><div class="filter-group"><h3>Môn học</h3><label class="check-option"><input checked type="checkbox"> Toán học</label><label class="check-option"><input type="checkbox"> Tiếng Anh</label><label class="check-option"><input type="checkbox"> Vật lý</label><label class="check-option"><input type="checkbox"> Hóa học</label></div><div class="filter-group"><h3>Hình thức học</h3><label class="check-option"><input checked type="checkbox"> Trực tuyến</label><label class="check-option"><input checked type="checkbox"> Tại nhà</label></div><div class="filter-group"><h3>Khoảng cách</h3><div class="range-value"><span>0 km</span><span id="distanceValue">8 km</span></div><input class="range" id="distanceRange" type="range" min="1" max="20" value="8"></div><div class="filter-group"><h3>Đánh giá</h3><label class="check-option"><input type="checkbox"> ★ 4.5 trở lên</label><label class="check-option"><input type="checkbox"> Đã xác thực</label></div></aside>
    <section class="card map-section"><div class="search-on-map"><input id="mapSearch" placeholder="Tìm theo môn học, tên gia sư..." aria-label="Tìm gia sư" /><button id="mapSearchButton" aria-label="Tìm kiếm">⌕</button></div>${mapSvg()}<article class="map-tooltip" id="mapTooltip"><div class="map-tooltip-top">${tutorAvatar('LN')}<div><h3>Cô Linh Nguyễn <span style="color:#35a88e">✓</span></h3><p>Toán 10–12 · 8 năm kinh nghiệm</p></div></div><div class="tooltip-meta"><span><b>★ 4.9</b> · 126 đánh giá</span><span>1.2 km</span></div></article><span class="map-legend"><i></i> Vị trí gia sư đã xác thực</span><button class="online-fab" data-online-filter>● Đang trực tuyến</button></section></div>`;
}

function tutorExplore() {
  return `<div class="page-heading"><div><p class="eyebrow">TÌM LỚP PHÙ HỢP</p><h1>Học sinh đang tìm gia sư</h1><p>Các nhu cầu đã được xác thực trong khu vực và môn học của bạn.</p></div><button class="heading-action" data-open="availability">＋ Cập nhật lịch rảnh</button></div><div class="explore-layout"><aside class="card filter-panel"><div class="filter-title"><h2>Bộ lọc lớp</h2><button data-reset-filter>Đặt lại</button></div><div class="filter-group"><h3>Môn học</h3><label class="check-option"><input checked type="checkbox"> Toán học</label><label class="check-option"><input type="checkbox"> Lý</label><label class="check-option"><input type="checkbox"> Hóa</label></div><div class="filter-group"><h3>Khối lớp</h3><label class="check-option"><input type="checkbox"> Lớp 6–9</label><label class="check-option"><input checked type="checkbox"> Lớp 10–12</label></div><div class="filter-group"><h3>Hình thức</h3><label class="check-option"><input checked type="checkbox"> Trực tuyến</label><label class="check-option"><input type="checkbox"> Tại nhà</label></div></aside><section class="card map-section"><div class="search-on-map"><input id="mapSearch" placeholder="Tìm nhu cầu học theo môn, khu vực..." aria-label="Tìm học sinh" /><button id="mapSearchButton" aria-label="Tìm kiếm">⌕</button></div>${mapSvg()}<article class="map-tooltip" id="mapTooltip"><div class="map-tooltip-top">${tutorAvatar('GH','avatar-user')}<div><h3>Gia Hân</h3><p>Toán 10 · 2 buổi/tuần · Bắt đầu 25/08</p></div></div><div class="tooltip-meta"><span><b>350.000đ/buổi</b></span><span>Quận 3</span></div></article><span class="map-legend"><i></i> Nhu cầu đã được xác thực</span><button class="online-fab" data-open="requests">Xem yêu cầu mới →</button></section></div>`;
}

function calendarView() {
  const isTutor = state.role === 'tutor'; 
  const isAdmin = state.role === 'admin';
  const appointments = state.data.appointments || [];

  const events = appointments.length > 0
    ? appointments.map(a => {
        const d = new Date(a.dateTime || Date.now()).getDate();
        return { d: d > 0 && d <= 31 ? d : 17, t: `${a.subject || 'Buổi học'} · ${a.tutorId?.name || a.studentId?.name || 'Đối tác'}`, c: 'mint' };
      })
    : (isAdmin ? [{d:4,t:'Duyệt hồ sơ · Khánh',c:'yellow'},{d:6,t:'Đối soát thanh toán',c:''},{d:11,t:'Phiên hỗ trợ',c:'mint'},{d:14,t:'Duyệt CV · 5 hồ sơ',c:'yellow'},{d:19,t:'Chi trả gia sư',c:''},{d:22,t:'Báo cáo tuần',c:'mint'}] : isTutor ? [{d:3,t:'Toán 12 · An Lâm',c:''},{d:5,t:'Toán 10 · Gia Hân',c:'mint'},{d:8,t:'Lớp ôn thi nhóm',c:'yellow'},{d:11,t:'Toán 8 · Minh Yến',c:''},{d:14,t:'Toán 12 · Hoàng Phúc',c:'mint'},{d:17,t:'Toán 10 · Gia Hân',c:''},{d:21,t:'Lớp ôn thi nhóm',c:'yellow'}] : [{d:3,t:'Toán 12 · Cô Linh',c:''},{d:5,t:'IELTS · Thầy Minh',c:'mint'},{d:8,t:'Ôn tập Vật lý',c:'yellow'},{d:11,t:'Toán 12 · Cô Linh',c:''},{d:14,t:'IELTS · Thầy Minh',c:'mint'},{d:17,t:'Toán 12 · Cô Linh',c:''},{d:21,t:'Lớp tự học',c:'yellow'}]);

  let days = ['T2','T3','T4','T5','T6','T7','CN'].map(x=>`<div class="calendar-day-name">${x}</div>`).join('');
  for (let i=1;i<=35;i++) { 
    const day=i-5; 
    const event=events.find(e=>e.d===day); 
    days+=`<div class="calendar-cell ${day<1||day>31?'muted':''} ${day===17?'today':''}">${day>0&&day<32?`<span class="day-number">${day}</span>${event?`<button class="calendar-event ${event.c}" data-calendar-event="${event.t}">${event.t}</button>`:''}`:''}</div>`; 
  }
  
  const heading = isTutor ? 'Lịch giảng dạy' : isAdmin ? 'Lịch vận hành hệ thống' : 'Lịch học của bạn'; 
  const name = isTutor ? 'Toán 12 · An Lâm' : isAdmin ? 'Duyệt hồ sơ · Trần Khánh' : 'Toán 12 · Tích phân'; 
  const companion = isTutor ? '09:00 · Trực tuyến' : isAdmin ? '09:30 · Xác minh bằng cấp' : '09:00 · Cô Linh Nguyễn · Trực tuyến';
  
  return `<div class="page-heading"><div><p class="eyebrow">CHỦ ĐỘNG SẮP XẾP THỜI GIAN</p><h1>${heading}</h1><p>Đồng bộ lịch, nhận nhắc hẹn và không bỏ lỡ hoạt động quan trọng.</p></div><button class="heading-action" data-open="new-event">＋ ${isAdmin ? 'Thêm công việc' : 'Thêm lịch học'}</button></div><div class="calendar-layout"><article class="card calendar-card"><div class="calendar-toolbar"><div><h2>Tháng 8, 2026</h2></div><div><button class="tiny-button">‹</button><button class="tiny-button">›</button><span class="view-tabs"><button class="active">Tháng</button><button>Tuần</button></span></div></div><div class="calendar-days">${days}</div></article><aside class="calendar-side"><article class="card upcoming-card"><h3>Sắp diễn ra</h3><div class="upcoming-item"><div class="upcoming-date"><b>17</b>THG 8</div><div><h4>${name}</h4><p>${companion}</p></div></div><div class="upcoming-item"><div class="upcoming-date"><b>18</b>THG 8</div><div><h4>${isTutor?'Toán 10 · Gia Hân':isAdmin?'Đối soát giao dịch':'IELTS Speaking'}</h4><p>${isTutor?'15:30 · Tại nhà':'15:30 · Trực tuyến'}</p></div></div><div class="upcoming-item"><div class="upcoming-date"><b>20</b>THG 8</div><div><h4>${isTutor?'Lớp nhóm ôn thi':isAdmin?'Tổng hợp báo cáo':'Ôn tập Vật lý'}</h4><p>19:30 · Trực tuyến</p></div></div></article><article class="card calendar-tip"><b>✦ Mẹo sử dụng lịch</b><p>${isAdmin?'Thiết lập nhắc việc để không bỏ sót các đợt xét duyệt và chi trả.':'Bạn có thể thay đổi lịch với gia sư tối đa 12 giờ trước buổi học.'}</p></article></aside></div>`;
}

function messagesView() {
  const currentUserId = localStorage.getItem('userId') || '';

  return `
    <div class="container margin-top">
      <h2>Tin nhắn & Thảo luận</h2>
      <div class="chat-container">
        <!-- Sidebar danh sách hội thoại -->
        <div class="chat-sidebar">
          <div class="chat-item active">
            <img src="https://via.placeholder.com/40" alt="Avatar" class="avatar-sm">
            <div class="chat-info">
              <h4>Nguyễn Văn A</h4>
              <p class="text-muted">Dạ em đã chuẩn bị xong bài học...</p>
            </div>
          </div>
          <div class="chat-item">
            <img src="https://via.placeholder.com/40" alt="Avatar" class="avatar-sm">
            <div class="chat-info">
              <h4>Trần Thị B</h4>
              <p class="text-muted">Hẹn gặp thầy vào 7h tối nay ạ.</p>
            </div>
          </div>
        </div>

        <!-- Khung chat chính -->
        <div class="chat-main">
          <div class="chat-header">
            <h3>Nguyễn Văn A</h3>
            <span class="badge status-online">Đang hoạt động</span>
          </div>

          <div class="chat-thread" id="chatThread">
            <div class="message incoming">
              <div class="message-content">
                Chào bạn, mình có thể nhận lớp Tiếng Anh lớp 12 này nhé!
              </div>
              <span class="message-time">10:15 AM</span>
            </div>
            <div class="message outgoing">
              <div class="message-content">
                Vâng ạ, học phí 250k/giờ đúng không thầy?
              </div>
              <span class="message-time">10:17 AM</span>
            </div>
            <div class="message incoming">
              <div class="message-content">
                Đúng rồi em, mình bắt đầu vào buổi tối thứ 3 tuần này nhé.
              </div>
              <span class="message-time">10:20 AM</span>
            </div>
          </div>

          <!-- Khung nhập tin nhắn -->
          <form class="chat-input-area" id="chatForm" onsubmit="handleSendMessage(event)">
            <input 
              type="text" 
              id="messageInput" 
              class="form-control" 
              placeholder="Nhập tin nhắn..." 
              required
            >
            <button type="submit" class="btn btn-primary">Gửi</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

// Xử lý gửi tin nhắn trực tiếp trên UI
function handleSendMessage(event) {
  event.preventDefault();
  const input = document.getElementById('messageInput');
  const thread = document.getElementById('chatThread');
  
  if (!input.value.trim()) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = 'message outgoing';
  msgDiv.innerHTML = `
    <div class="message-content">${escapeHTML(input.value)}</div>
    <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
  `;
  
  thread.appendChild(msgDiv);
  input.value = '';
  thread.scrollTop = thread.scrollHeight;
}

// Helper tránh lỗi XSS trên Frontend
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Khởi chạy App khi trang tải hoàn tất
document.addEventListener('DOMContentLoaded', () => {
  // Thay thế hardcode localhost bằng dynamic host nếu cần
  window.API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';

  // Render view ban đầu
  if (typeof renderApp === 'function') {
    renderApp();
  }
})

function classroomView() {
  const isTutor = state.role === 'tutor';
  const isAdmin = state.role === 'admin';
  if (isAdmin) return `<div class="page-heading"><div><p class="eyebrow">AN TOÀN & CHẤT LƯỢNG THEO THỜI GIAN THỰC</p><h1>Giám sát lớp học số</h1><p>Quan sát tín hiệu vận hành để giữ môi trường học tập an toàn, riêng tư và hiệu quả.</p></div><button class="heading-action" data-open="safety-report">Tạo báo cáo an toàn →</button></div><div class="live-monitor-grid"><article class="card live-hero"><div class="live-hero-head"><span class="live-dot">● 18 lớp đang diễn ra</span><span>Cập nhật 20 giây trước</span></div><div class="monitor-stage"><div class="monitor-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><b>1.284 phút học tập hôm nay</b><p>97.8% lớp học có chất lượng kết nối tốt</p></div><div class="monitor-stats"><div><b>18</b><span>Lớp trực tiếp</span></div><div><b>94%</b><span>Điểm tương tác</span></div><div><b>0</b><span>Vi phạm nghiêm trọng</span></div></div></article><article class="card signal-card"><div class="card-heading"><h2>Tín hiệu cần chú ý</h2><span class="signal-badge">2 mới</span></div><div class="signal-list"><div><span class="signal-icon amber">!</span><p><b>Chất lượng mạng thấp</b><small>Lớp IELTS · Thầy Minh · 7 phút</small></p><button data-open="safety-report">Xem</button></div><div><span class="signal-icon blue">◌</span><p><b>Thời lượng vượt kế hoạch</b><small>Toán 12 · Cô Linh · +18 phút</small></p><button data-open="safety-report">Xem</button></div></div></article></div><div class="safety-grid"><article class="card trust-card"><span class="trust-icon">♢</span><h2>Trust score hệ thống</h2><div class="trust-score"><b>96</b><span>/100</span></div><p>Điểm tin cậy được tổng hợp từ xác minh, đánh giá và hành vi cộng đồng.</p><div class="meter mint"><i style="width:96%"></i></div></article><article class="card class-pulse-card"><div class="card-heading"><h2>Nhịp lớp học gần đây</h2><button class="text-action">Xem lịch sử →</button></div><div class="pulse-list"><div><span class="pulse-avatar avatar avatar-linh">LN</span><p><b>Toán 12 · Cô Linh</b><small>8 học sinh · 47 phút · Tương tác cao</small></p><span class="status-pill verified">Ổn định</span></div><div><span class="pulse-avatar avatar avatar-minh">MP</span><p><b>IELTS Speaking · Thầy Minh</b><small>4 học sinh · 32 phút · Cần kiểm tra mạng</small></p><span class="status-pill waiting">Theo dõi</span></div><div><span class="pulse-avatar avatar avatar-huy">TK</span><p><b>Vật lý 10 · Thầy Tuấn</b><small>6 học sinh · 25 phút · Tương tác cao</small></p><span class="status-pill verified">Ổn định</span></div></div></article></div>`;
  const teacher = isTutor ? (state.currentUser?.name || 'Ngọc Mai') : 'Cô Linh Nguyễn';
  const peer = isTutor ? 'An Lâm' : 'Bạn';
  return `<div class="page-heading classroom-heading"><div><p class="eyebrow">KHÔNG GIAN HỌC TẬP TRỰC TUYẾN</p><h1>Lớp học số</h1><p>Video, bảng viết, ghi chú và hoạt động tương tác—tập trung trong một phòng học.</p></div><div class="classroom-status"><span>● Đã mã hóa đầu cuối</span><button class="heading-action" data-join-class>Tham gia lớp học →</button></div></div><div class="classroom-layout"><article class="card virtual-class"><header class="virtual-class-head"><div><span class="class-live">● LIVE</span><b>Toán 12 · Tích phân từng phần</b><small>${teacher} · Buổi 04 · Còn 42 phút</small></div><button class="quiet-button" data-open="classroom">↗ Mở phòng học</button></header><div class="video-stage"><div class="main-video"><div class="video-grid"></div><div class="video-person"><span class="avatar avatar-linh">${getInitials(teacher)}</span><b>${isTutor ? peer : teacher}</b><small>Đang trình bày bảng</small></div><div class="captions">🔒 Phòng học an toàn · Phụ đề tiếng Việt đang bật</div></div><div class="video-side"><div class="participant-tile purple"><span class="avatar avatar-user">${getInitials(state.currentUser?.name || 'An Lâm')}</span><b>${isTutor ? 'An Lâm' : 'Bạn'}</b><small>Đang lắng nghe</small></div><div class="participant-tile teal"><span class="avatar avatar-huy">TK</span><b>Tuấn Khôi</b><small>Nhóm học cùng</small></div></div></div><div class="class-controls"><button title="Bật/tắt micro">♩</button><button title="Bật/tắt camera">◉</button><button title="Chia sẻ màn hình">▣</button><button class="reaction-button" data-quick-reaction>✦</button><span></span><button class="leave-class" data-open="classroom">Rời lớp</button></div></article><aside class="classroom-side"><article class="card session-card"><div class="card-heading"><h2>Mục tiêu buổi học</h2><span class="focus-score">92% tập trung</span></div><div class="session-checklist"><button class="check-task done" data-mark-task><i>✓</i> Nhận diện dạng tích phân</button><button class="check-task" data-mark-task><i></i> Luyện đổi biến số</button><button class="check-task" data-mark-task><i></i> Hoàn thành 5 bài áp dụng</button></div><button class="text-action session-action" data-open="lesson-note">Mở ghi chú chung →</button></article><article class="card whiteboard-card"><div class="card-heading"><h2>Bảng viết chung</h2><button class="text-action" data-open="whiteboard">Mở rộng ↗</button></div><div class="mini-whiteboard"><span>∫ u dv = uv − ∫ v du</span><i></i><b>Ví dụ 3: ∫ x cos(x) dx</b><em>Đổi biến: u = x</em></div><div class="board-footer"><span>● Tự động lưu sau 5 giây</span><button data-open="whiteboard">Xuất PDF</button></div></article></aside></div><section class="card class-feature-strip"><div><span class="feature-round lavender">⌁</span><p><b>Ghi hình thông minh</b><small>Tự đánh dấu đoạn quan trọng.</small></p></div><div><span class="feature-round mint-bg">✦</span><p><b>Tóm tắt AI</b><small>Nhận recap sau mỗi buổi học.</small></p></div><div><span class="feature-round yellow-bg">☰</span><p><b>Phòng thảo luận</b><small>Làm bài theo nhóm nhỏ.</small></p></div><button class="secondary-button" data-open="classroom-settings">Cài đặt lớp học</button></section>`;
}

function coachView() {
  if (state.role === 'tutor') return `<div class="page-heading"><div><p class="eyebrow">CÔNG CỤ GIẢNG DẠY THÔNG MINH</p><h1>Teaching Studio</h1><p>Chuẩn bị bài dạy nhanh hơn, hiểu nhịp học của lớp và chăm sóc học sinh chu đáo hơn.</p></div><button class="heading-action" data-open="lesson-builder">✦ Tạo giáo án với AI</button></div><div class="teaching-grid"><article class="card teaching-hero"><div class="studio-badge">✦ GỢI Ý CHO BUỔI HỌC TỐI NAY</div><h2>Ôn tập tích phân cho An Lâm</h2><p>AI nhận thấy An có tiến bộ rõ rệt ở kỹ thuật từng phần, nhưng vẫn cần luyện thêm đổi biến số.</p><div class="lesson-chips"><span>45 phút</span><span>3 hoạt động</span><span>Độ khó vừa phải</span></div><button class="primary-button" data-open="lesson-builder">Tạo giáo án 1 chạm →</button></article><article class="card learner-insights"><div class="card-heading"><h2>Chỉ số học sinh</h2><button class="text-action">Xem chi tiết →</button></div><div class="learner-row"><span class="avatar avatar-user">AL</span><div><b>An Lâm</b><small>Toán 12 · 8 buổi trong tháng</small></div><span class="insight-up">↑ 18%</span></div><div class="learner-row"><span class="avatar avatar-huy">GH</span><div><b>Gia Hân</b><small>Toán 10 · Cần thêm bài luyện tập</small></div><span class="insight-warm">! Theo dõi</span></div><div class="learner-row"><span class="avatar avatar-minh">MY</span><div><b>Minh Yến</b><small>Toán 8 · Đều đặn 3 tuần</small></div><span class="insight-up">↑ 9%</span></div></article></div><div class="studio-grid"><article class="card activity-card"><div class="card-heading"><h2>Thư viện hoạt động nhanh</h2><button class="text-action" data-open="lesson-builder">Tạo mới →</button></div><div class="activity-tiles"><button data-open="lesson-builder"><span>⚡</span><b>Khởi động 5 phút</b><small>Câu hỏi trắc nghiệm nhanh</small></button><button data-open="lesson-builder"><span>◫</span><b>Kiểm tra hiểu bài</b><small>Exit ticket tự chấm</small></button><button data-open="lesson-builder"><span>◌</span><b>Thảo luận nhóm</b><small>Phân nhóm theo trình độ</small></button></div></article><article class="card parent-card"><span class="parent-icon">⌁</span><div><b>Báo cáo phụ huynh, chỉ 1 phút</b><p>Tự tổng hợp tiến độ, chuyên cần và gợi ý đồng hành theo từng học sinh.</p></div><button class="secondary-button" data-open="parent-report">Tạo báo cáo →</button></article></div>`;
  if (state.role === 'admin') return `<div class="page-heading"><div><p class="eyebrow">TẠO NIỀM TIN CHO MỌI KẾT NỐI</p><h1>Trust & Safety Center</h1><p>Chủ động bảo vệ học sinh, gia sư và chất lượng của toàn bộ cộng đồng TutorConnect.</p></div><button class="heading-action" data-open="safety-report">＋ Tạo báo cáo</button></div><div class="trust-dashboard"><article class="card trust-health"><div class="trust-health-top"><span class="trust-icon">♢</span><div><p>Sức khỏe cộng đồng</p><h2>96 / 100</h2></div><span class="status-pill verified">Ổn định</span></div><div class="health-chart"><i style="height:46%"></i><i style="height:63%"></i><i style="height:57%"></i><i style="height:78%"></i><i style="height:72%"></i><i style="height:90%"></i><i style="height:84%"></i></div><small>Xu hướng điểm tin cậy trong 7 ngày gần nhất</small></article><article class="card alert-center"><div class="card-heading"><h2>Trung tâm cảnh báo</h2><span class="signal-badge">2 mới</span></div><div class="alert-item"><span class="signal-icon amber">!</span><div><b>2 lớp có tỷ lệ rời phòng sớm</b><p>AI gợi ý gửi khảo sát chất lượng.</p></div><button data-open="safety-report">Xử lý</button></div><div class="alert-item"><span class="signal-icon blue">◌</span><div><b>1 đánh giá cần kiểm duyệt</b><p>Nội dung chứa từ khóa nhạy cảm.</p></div><button data-open="safety-report">Xử lý</button></div></article><article class="card policy-card"><span>✓</span><h2>Kiểm duyệt chủ động</h2><p>76% báo cáo được phân loại tự động và chuyển đúng nhóm xử lý.</p><button class="secondary-button" data-open="review-settings">Xem quy tắc</button></article></div><article class="card safety-timeline"><div class="card-heading"><h2>Hoạt động tin cậy gần đây</h2><button class="text-action">Xuất nhật ký →</button></div><div class="safety-log"><span>09:42</span><i class="mint-dot"></i><p><b>Hồ sơ Trần Khánh đã được xác minh</b><small>Tự động đối chiếu bằng cấp thành công.</small></p></div><div class="safety-log"><span>09:26</span><i class="yellow-dot"></i><p><b>Đã chuyển 1 đánh giá sang hàng đợi kiểm duyệt</b><small>Ngôn ngữ cảm xúc mạnh, cần xem xét thủ công.</small></p></div><div class="safety-log"><span>08:55</span><i class="purple-dot"></i><p><b>Hệ thống gửi nhắc bảo mật tới 8 gia sư</b><small>Đã nhắc cập nhật phương thức rút tiền.</small></p></div></article>`;
  return `<div class="page-heading"><div><p class="eyebrow">HỌC CÓ ĐỊNH HƯỚNG, TIẾN BỘ NHÌN THẤY ĐƯỢC</p><h1>AI Study Coach</h1><p>Một trợ lý học tập riêng giúp bạn lên kế hoạch, giữ tập trung và biết chính xác nên học gì tiếp theo.</p></div><button class="heading-action" data-open="study-plan">✦ Tạo kế hoạch tuần</button></div><div class="coach-grid"><article class="card focus-card"><div><span class="focus-kicker">PHIÊN TẬP TRUNG HÔM NAY</span><h2 id="focusTimer">25:00</h2><p>Toán 12 · Tích phân từng phần</p><div class="focus-tags"><span>Không làm phiền</span><span>Âm thanh mưa</span></div><button class="primary-button" data-focus-timer>Bắt đầu tập trung</button></div><div class="focus-orbit"><i></i><span>✦</span></div></article><article class="card coach-insight"><div class="card-heading"><h2>Coach nhận thấy</h2><span class="ai-pill">✦ AI</span></div><div class="coach-tip"><span>↗</span><p><b>Bạn học hiệu quả nhất vào buổi tối</b><small>3 tuần gần nhất, tỷ lệ hoàn thành buổi học lúc 19:00 cao hơn 24%.</small></p></div><div class="coach-tip"><span>◎</span><p><b>Đã đến lúc ôn lại giới hạn</b><small>Chỉ cần 15 phút để giữ kiến thức không bị quên.</small></p></div><button class="text-action coach-action" data-open="study-plan">Xem lộ trình cá nhân →</button></article></div><div class="coach-lower"><article class="card mastery-card"><div class="card-heading"><h2>Bản đồ thành thạo</h2><button class="text-action">Toán 12 ▾</button></div><div class="mastery-list"><div><span class="mastery-node done">✓</span><p><b>Hàm số & đạo hàm</b><small>Đã vững · 92%</small></p><span class="mastery-state good">Vững</span></div><div><span class="mastery-node current">2</span><p><b>Tích phân</b><small>Đang học · 68%</small></p><span class="mastery-state current">Tiếp tục</span></div><div><span class="mastery-node">3</span><p><b>Số phức</b><small>Chưa mở khóa</small></p><span class="mastery-state">Sắp tới</span></div></div></article><article class="card mission-card"><div class="mission-top"><span class="streak-flame">♨</span><div><b>Chuỗi học tập 6 ngày</b><small>Thêm một phiên hôm nay để lên mốc 7 ngày!</small></div><span class="mission-score">+120 XP</span></div><div class="week-dots"><i class="done">T2</i><i class="done">T3</i><i class="done">T4</i><i class="done">T5</i><i class="done">T6</i><i class="done">T7</i><i>CN</i></div><div class="daily-mission"><span>✦</span><p><b>Nhiệm vụ hôm nay</b><small>Hoàn thành 5 bài tích phân · 3/5</small></p><button data-open="study-plan">Tiếp tục</button></div></article></div>`;
}

function documentsView() {
  const isTutor=state.role==='tutor', isAdmin=state.role==='admin'; 
  const heading=isTutor?'Hồ sơ & CV':isAdmin?'Báo cáo hệ thống':'Tài liệu học tập';
  const rows=isTutor?[
    ['CV_Ngoc_Mai_2026.pdf','CV · Cập nhật 17/08/2026','PDF'],['Bang_dai_hoc_Su_pham.pdf','Bằng cấp · Đã xác minh','PDF'],['Chung_chi_nghiep_vu.pdf','Chứng chỉ · Đang chờ duyệt','PDF']
  ]:isAdmin?[
    ['Bao_cao_doanh_thu_T8.xlsx','Tạo bởi hệ thống · 17/08/2026','XLS'],['Danh_sach_gia_su_cho_duyet.xlsx','7 hồ sơ · Cập nhật 09:42','XLS'],['Bao_cao_chat_luong_thang_7.pdf','Tổng hợp đánh giá · Tháng 7','PDF']
  ]:[['Tom_tat_tich_phan.pdf','Cô Linh Nguyễn · 17/08/2026','PDF'],['Bai_tap_Toan_tuan_3.pdf','Cô Linh Nguyễn · 16/08/2026','PDF'],['IELTS_Speaking_framework.pdf','Thầy Minh Phạm · 15/08/2026','PDF'],['Ke_hoach_hoc_thang_8.xlsx','TutorConnect · 01/08/2026','XLS']];
  return `<div class="page-heading"><div><p class="eyebrow">KHO TÀI NGUYÊN RIÊNG TƯ</p><h1>${heading}</h1><p>${isTutor?'Cập nhật hồ sơ để tạo dựng niềm tin với học sinh và phụ huynh.':isAdmin?'Truy cập báo cáo và dữ liệu vận hành mới nhất.':'Lưu trữ tài liệu mà gia sư đã chia sẻ, luôn sẵn sàng khi bạn cần.'}</p></div><button class="heading-action" data-open="${isTutor?'cv':'upload-document'}">＋ ${isTutor?'Nộp / cập nhật CV':'Tải tài liệu lên'}</button></div><div class="docs-grid"><article class="card"><div class="card-heading"><h2>${isTutor?'Tài liệu xác thực':'Tệp của bạn'}</h2><button class="text-action">Sắp xếp ↓</button></div><div class="document-list">${rows.map((row,i)=>`<div class="document-row"><span class="doc-icon ${row[2]==='XLS'?'sheet':''}">${row[2]}</span><div class="document-copy"><b>${row[0]}</b><span>${row[1]}</span></div><button data-open="preview-document">Xem</button></div>`).join('')}</div></article><aside class="card document-tip"><span class="large-icon">${isTutor?'♙':'✦'}</span><h3>${isTutor?'Hồ sơ đáng tin cậy hơn':'Học đúng tài liệu'}</h3><p>${isTutor?'Đầy đủ CV, bằng cấp và chứng chỉ giúp hồ sơ của bạn được ưu tiên đề xuất.':'Tạo thư mục theo môn để tìm nhanh hơn vào mỗi buổi học.'}</p><button data-open="${isTutor?'cv':'upload-document'}">${isTutor?'Hoàn thiện hồ sơ':'Tải tài liệu lên'} →</button></aside></div>`;
}

function financeView() {
  const isTutor = state.role === 'tutor', isAdmin = state.role === 'admin';
  if (isAdmin) return adminFinance();
  const txs = state.data.transactions || [];
  
  const items = txs.length > 0 
    ? txs.map(t => (isTutor ? `${t.studentId?.name || 'Học sinh'} · Lớp học` : `${t.tutorId?.name || 'Gia sư'} · Lớp học`))
    : (isTutor ? ['An Lâm · Toán 12','Gia Hân · Toán 10','Minh Yến · Toán 8','Hoàng Phúc · Toán 12'] : ['Cô Linh Nguyễn · Toán 12','Thầy Minh Phạm · IELTS','TutorConnect Plus · Gói tháng','Cô Linh Nguyễn · Toán 12']);
    
  const prices = txs.length > 0 
    ? txs.map(t => (t.amount ? t.amount.toLocaleString('vi-VN') + 'đ' : '320.000đ'))
    : ['320.000đ','280.000đ','250.000đ','320.000đ'];

  return `<div class="page-heading"><div><p class="eyebrow">MINH BẠCH VÀ AN TOÀN</p><h1>${isTutor?'Thu nhập của bạn':'Thanh toán'}</h1><p>${isTutor?'Theo dõi thu nhập, lịch chi trả và các giao dịch đã hoàn tất.':'Theo dõi học phí, hóa đơn và phương thức thanh toán của bạn.'}</p></div><button class="heading-action" data-open="${isTutor?'withdraw':'payment'}">${isTutor?'Rút tiền':'＋ Nạp tiền'} →</button></div><div class="finance-grid"><article class="card finance-summary"><p>${isTutor?'Số dư khả dụng':'Số dư TutorConnect'}</p><h2>${isTutor?'8.450.000đ':'1.200.000đ'}</h2><small>${isTutor?'Có thể rút ngay':'Cập nhật hôm nay'}</small></article><article class="card finance-summary"><p>${isTutor?'Thu nhập tháng 8':'Đã thanh toán tháng này'}</p><h2>${isTutor?'12.800.000đ':'3.420.000đ'}</h2><small>${isTutor?'↑ 12% so với tháng trước':'4 hóa đơn đã hoàn tất'}</small></article><article class="card finance-summary"><p>${isTutor?'Kỳ chi trả tiếp theo':'Học phí sắp tới'}</p><h2>${isTutor?'25/08':'18/08'}</h2><small>${isTutor?'Dự kiến 4.350.000đ':'Toán 12 · 320.000đ'}</small></article></div><article class="card payout-card"><div class="card-heading"><h2>${isTutor?'Lịch sử giao dịch':'Hóa đơn & giao dịch'}</h2><button class="text-action">Xuất sao kê →</button></div><div class="payout-list"><div class="payout-row header"><span>${isTutor?'HỌC SINH / LỚP':'GIA SƯ / DỊCH VỤ'}</span><span>THỜI GIAN</span><span>SỐ TIỀN</span><span>TRẠNG THÁI</span></div>${items.map((item,i)=>`<div class="payout-row"><span><b>${item}</b><br><small>${isTutor?'Buổi học đã hoàn tất':'Mã đơn #TM-20'+(940+i)}</small></span><span>${17-i}/08/2026</span><span><b>${prices[i] || '320.000đ'}</b></span><span><button>${i===3?'Đang xử lý':'Hoàn tất'}</button></span></div>`).join('')}</div></article>`;
}

function adminFinance() {
  return `<div class="page-heading"><div><p class="eyebrow">VẬN HÀNH TÀI CHÍNH</p><h1>Thanh toán & đối soát</h1><p>Quản lý dòng tiền, hóa đơn và các kỳ chi trả gia sư trên một màn hình.</p></div><button class="heading-action" data-open="run-payout">Tiến hành chi trả →</button></div><div class="finance-grid"><article class="card finance-summary"><p>Doanh thu tháng 8</p><h2>184.6tr</h2><small>↑ 9.4% so với tháng trước</small></article><article class="card finance-summary"><p>Chờ đối soát</p><h2>16.8tr</h2><small>42 giao dịch cần xác minh</small></article><article class="card finance-summary"><p>Chi trả gia sư</p><h2>96.2tr</h2><small>Kỳ tiếp theo: 25/08</small></article></div><article class="card payout-card"><div class="card-heading"><h2>Yêu cầu chi trả gần đây</h2><button class="text-action">Xuất báo cáo →</button></div><div class="payout-list"><div class="payout-row header"><span>GIA SƯ</span><span>YÊU CẦU LÚC</span><span>SỐ TIỀN</span><span>THAO TÁC</span></div>${['Ngọc Mai','Linh Nguyễn','Minh Phạm','Tuấn Khôi'].map((name,i)=>`<div class="payout-row"><span><b>${name}</b><br><small>${12+i*3} buổi học đã hoàn tất</small></span><span>${17-i}/08/2026</span><span><b>${['8.450.000đ','6.230.000đ','5.970.000đ','4.680.000đ'][i]}</b></span><span><button data-payout="${name}">Duyệt chi trả</button></span></div>`).join('')}</div></article>`;
}

function adminReviewView() {
  const users = state.data.adminUsers || [];
  const pendingTutors = users.filter(u => u.role === 'tutor' && !u.verified);

  const pendingRowsHtml = pendingTutors.length > 0
    ? pendingTutors.map((u, idx) => `
        <tr>
          <td><div class="table-person">${tutorAvatar(u.name, idx % 2 === 0 ? 'avatar-huy' : 'avatar-minh')}<div><b>${u.name}</b><span>${u.email}</span></div></div></td>
          <td><span class="subject-pill">${(u.subjects || ['Chuyên môn']).join(', ')}</span></td>
          <td><span class="status-pill waiting">Chờ xác minh</span></td>
          <td>Mới nộp</td>
          <td><button class="table-action" data-review="${u.name}" data-user-id="${u._id}">Xem & duyệt</button></td>
        </tr>`).join('')
    : [['Trần Khánh','Tiếng Anh','08:30 hôm nay','TK','avatar-huy'],['Phương Anh','Toán cấp 2','Hôm qua','PA','avatar-minh'],['Ngọc Huyền','Hóa học','Hôm qua','NH','avatar-linh'],['Đức Thành','Vật lý','16/08/2026','DT','avatar-user'],['Hải Yến','Tiếng Anh','16/08/2026','HY','avatar-huy']].map(row=>`<tr><td><div class="table-person">${tutorAvatar(row[3],row[4])}<div><b>${row[0]}</b><span>Đã nộp CV & bằng cấp</span></div></div></td><td><span class="subject-pill">${row[1]}</span></td><td><span class="status-pill waiting">Chờ xác minh</span></td><td>${row[2]}</td><td><button class="table-action" data-review="${row[0]}">Xem & duyệt</button></td></tr>`).join('');

  return `<div class="page-heading"><div><p class="eyebrow">XÁC THỰC CHẤT LƯỢNG</p><h1>Duyệt hồ sơ gia sư</h1><p>Kiểm tra thông tin, bằng cấp và kinh nghiệm để bảo đảm chất lượng cộng đồng.</p></div><button class="heading-action" data-open="review-settings">⚙ Cấu hình quy trình</button></div><div class="admin-grid"><article class="card admin-table-card"><div class="table-heading"><h2>Hồ sơ chờ xử lý <span style="color:#e28f32">(${pendingTutors.length || state.reviews})</span></h2><button>Bộ lọc ↓</button></div><table class="review-table"><thead><tr><th>GIA SƯ</th><th>CHUYÊN MÔN</th><th>HỒ SƠ</th><th>GỬI LÚC</th><th></th></tr></thead><tbody>${pendingRowsHtml}</tbody></table></article><aside class="right-column"><article class="card progress-card"><h2>Tiến độ duyệt hôm nay</h2><div class="progress-top"><div class="progress-ring" style="background:conic-gradient(var(--mint) 0 294deg,#eeeeff 294deg)"><b>82%</b><small>đã xử lý</small></div><div class="progress-note"><b>18 / 22 hồ sơ</b><span>Chỉ còn 4 hồ sơ cần được xử lý trong hôm nay.</span></div></div><div class="subject-progress mint"><div><span>Thời gian trung bình</span><b>8 phút</b></div><div class="meter mint"><i style="width:72%"></i></div></div></article><article class="card calendar-tip"><b>✦ Nguyên tắc an toàn</b><p>Chỉ xác minh các văn bằng có thông tin rõ ràng và đối chiếu với hồ sơ đã khai báo.</p></article></aside></div>`;
}

function renderAllViews() {
  const dash = $('#view-dashboard'); if (dash) dash.innerHTML = state.role === 'student' ? studentDashboard() : state.role === 'tutor' ? tutorDashboard() : adminDashboard();
  const exp = $('#view-explore'); if (exp) exp.innerHTML = state.role === 'tutor' ? tutorExplore() : studentExplore();
  const cal = $('#view-calendar'); if (cal) cal.innerHTML = calendarView();
  const msg = $('#view-messages'); if (msg) msg.innerHTML = messagesView();
  const cls = $('#view-classroom'); if (cls) cls.innerHTML = classroomView();
  const cch = $('#view-coach'); if (cch) cch.innerHTML = coachView();
  const doc = $('#view-documents'); if (doc) doc.innerHTML = documentsView();
  const fin = $('#view-finance'); if (fin) fin.innerHTML = financeView();
  const adm = $('#view-admin-review'); if (adm) adm.innerHTML = state.role === 'admin' ? adminReviewView() : '<div class="page-heading"><div><h1>Khu vực quản trị</h1><p>Bạn cần quyền quản trị viên để truy cập nội dung này.</p></div></div>';
  bindInteractions();
}

function bindInteractions() {
  $$('[data-go]').forEach(el => el.addEventListener('click', () => navigate(el.dataset.go)));
  $$('[data-open]').forEach(el => el.addEventListener('click', () => {
    if (el.dataset.tutorId) state.selectedTutorId = el.dataset.tutorId;
    if (el.dataset.tutorName) state.selectedTutor = el.dataset.tutorName;
    openModal(el.dataset.open, { name: el.dataset.review || el.dataset.payout });
  }));
  $$('[data-accept]').forEach(el => el.addEventListener('click', async () => { 
    const reqId = el.dataset.requestId;
    if (reqId) {
      try { await updateTutorRequest(reqId, 'matched'); } catch(err) { console.warn('Request match fail:', err.message); }
    }
    state.tutorRequests--; 
    el.closest('.student-request').style.opacity='.45'; 
    el.closest('.student-request').querySelector('.request-actions').innerHTML='<span class="status-pill verified">Đã nhận</span>'; 
    showToast(`Đã nhận lớp của ${el.dataset.accept}`); 
  }));
  $$('[data-review]').forEach(el => el.addEventListener('click', () => openModal('review', { name: el.dataset.review, userId: el.dataset.userId })));
  $$('[data-payout]').forEach(el => el.addEventListener('click', () => openModal('payout', { name: el.dataset.payout })));
  $$('[data-map-tutor]').forEach(el => el.addEventListener('click', () => changeMapTutor(el.dataset.mapTutor)));
  $('#distanceRange')?.addEventListener('input', e => { if ($('#distanceValue')) $('#distanceValue').textContent = `${e.target.value} km`; });
  $('#mapSearchButton')?.addEventListener('click', () => showToast($('#mapSearch')?.value ? `Đang tìm “${$('#mapSearch').value}”` : 'Hiển thị gia sư phù hợp nhất'));
  $('[data-online-filter]')?.addEventListener('click', () => showToast('Đã lọc các hồ sơ đang trực tuyến'));
  $('[data-reset-filter]')?.addEventListener('click', () => { const r=$('#distanceRange'); if(r){r.value=8; if($('#distanceValue')) $('#distanceValue').textContent='8 km';} showToast('Đã đặt lại bộ lọc'); });
  $$('[data-calendar-event]').forEach(el => el.addEventListener('click', () => openModal('event', { name: el.dataset.calendarEvent })));
  $$('.conversation').forEach(el => el.addEventListener('click', () => selectConversation(el)));
  $('#messageForm')?.addEventListener('submit', handleSendMessage);
  $$('[data-mark-task]').forEach(el => el.addEventListener('click', () => {
    el.classList.toggle('done');
    const icon = el.querySelector('i');
    if (icon) icon.textContent = el.classList.contains('done') ? '✓' : '';
    showToast(el.classList.contains('done') ? 'Đã đánh dấu hoàn thành mục tiêu' : 'Đã mở lại mục tiêu');
  }));
  $('[data-focus-timer]')?.addEventListener('click', toggleFocusTimer);
  $$('[data-join-class]').forEach(el => el.addEventListener('click', () => openModal('classroom')));
  $$('[data-quick-reaction]').forEach(el => el.addEventListener('click', () => showToast('Đã gửi lời khen tới cả lớp ✦')));
}

function changeMapTutor(name) {
  state.selectedTutor = name;
  const data = { 'Cô Linh Nguyễn': ['LN','avatar-linh','Cô Linh Nguyễn','Toán 10–12 · 8 năm kinh nghiệm','★ 4.9','1.2 km'], 'Thầy Minh Phạm': ['MP','avatar-minh','Thầy Minh Phạm','IELTS · 7.5 Overall','★ 4.8','2.0 km'], 'Thầy Tuấn Khôi': ['TK','avatar-huy','Thầy Tuấn Khôi','Vật lý · ĐH Bách Khoa','★ 5.0','1.7 km'], 'Cô Hương Giang': ['HG','avatar-user','Cô Hương Giang','Hóa học · 6 năm kinh nghiệm','★ 4.9','3.2 km'] }[name] || ['GH','avatar-user','Gia Hân','Toán 10 · 2 buổi/tuần · Bắt đầu 25/08','350.000đ/buổi','Quận 3'];
  const mapTooltip = $('#mapTooltip');
  if (mapTooltip) {
    mapTooltip.innerHTML = `<div class="map-tooltip-top">${tutorAvatar(data[0],data[1])}<div><h3>${data[2]} <span style="color:#35a88e">✓</span></h3><p>${data[3]}</p></div></div><div class="tooltip-meta"><span><b>${data[4]}</b></span><span>${data[5]}</span></div>`;
  }
}

function selectConversation(el) {
  $$('.conversation').forEach(c=>c.classList.remove('active')); 
  el.classList.add('active'); 
  if ($('#chatName')) $('#chatName').textContent = el.dataset.conversation; 
  showToast(`Đang trò chuyện với ${el.dataset.conversation}`);
}

async function handleSendMessage(e) { 
  e.preventDefault(); 
  const input=$('#messageInput'); 
  const text=input.value.trim(); 
  if(!text) return; 

  $('#chatThread')?.insertAdjacentHTML('beforeend', `<div class="message mine"><span class="avatar avatar-user">${getInitials(state.currentUser?.name || roles[state.role].initials)}</span><div><div class="bubble">${escapeHtml(text)}</div><span class="message-time">Vừa xong · Đã gửi</span></div></div>`); 
  input.value=''; 
  if($('#chatThread')) $('#chatThread').scrollTop=$('#chatThread').scrollHeight;

  try {
    const receiverId = state.data.tutors[0]?._id || '507f1f77bcf86cd799439011';
    await window.sendMessage(receiverId, text);
  } catch (err) {
    console.warn('API send message note:', err.message);
  }
}

function escapeHtml(v) { const d=document.createElement('div');d.textContent=v;return d.innerHTML; }
function renderFocusTime() { const target = $('#focusTimer'); if (target) target.textContent = `${String(Math.floor(state.focusSeconds / 60)).padStart(2, '0')}:${String(state.focusSeconds % 60).padStart(2, '0')}`; }

function toggleFocusTimer(event) {
  const button = event.currentTarget;
  if (state.focusTimer) {
    window.clearInterval(state.focusTimer); state.focusTimer = null; button.textContent = 'Tiếp tục tập trung'; showToast('Đã tạm dừng phiên tập trung'); return;
  }
  button.textContent = 'Tạm dừng phiên'; button.classList.add('is-running'); showToast('Chế độ tập trung đã bật — chúc bạn học tốt!');
  state.focusTimer = window.setInterval(() => {
    state.focusSeconds = Math.max(0, state.focusSeconds - 1); renderFocusTime();
    if (state.focusSeconds === 0) { window.clearInterval(state.focusTimer); state.focusTimer = null; button.textContent = 'Bắt đầu phiên mới'; showToast('Bạn đã hoàn thành phiên tập trung 25 phút!'); }
  }, 1000);
}

function modalTemplate(type, data={}) {
  const forms = {
    whiteboard: `<h2>Bảng viết chung</h2><p>Không gian ghi chú được tự động lưu và đồng bộ cho các thành viên của lớp.</p><div class="expanded-whiteboard"><div><span>∫ u dv = uv − ∫ v du</span><i></i><b>Ví dụ: ∫ x cos(x) dx</b><em>u = x &nbsp;&nbsp; dv = cos(x)dx</em></div><small>✦ Gợi ý AI: chọn u là đa thức để phép tính đơn giản dần.</small></div><div class="modal-actions"><button class="cancel-button" data-close>Đóng</button><button class="primary-button" data-confirm="Đã xuất bảng viết thành PDF">Xuất PDF</button></div>`,
    'lesson-note': `<h2>Ghi chú chung · Tích phân</h2><p>Ghi chú này hiển thị cho toàn bộ thành viên trong phòng học và được lưu theo buổi.</p><div class="form-group"><label>Nội dung chính</label><textarea>• Nhận diện tích phân từng phần&#10;• Công thức ∫ u dv = uv − ∫ v du&#10;• Bài tập về nhà: trang 42, bài 4–8</textarea></div><div class="modal-actions"><button class="cancel-button" data-close>Hủy</button><button class="primary-button" data-confirm="Ghi chú lớp học đã được lưu">Lưu ghi chú</button></div>`,
    'classroom-settings': `<h2>Cài đặt lớp học</h2><p>Tùy chỉnh trải nghiệm học tập an toàn và phù hợp với bạn.</p><div class="form-group"><label>Ngôn ngữ phụ đề</label><select><option>Tiếng Việt</option><option>Tiếng Anh</option><option>Tắt phụ đề</option></select></div><div class="form-group"><label>Chất lượng video ưu tiên</label><select><option>Tự động theo đường truyền</option><option>Tiết kiệm dữ liệu</option><option>Chất lượng cao</option></select></div><div class="modal-actions"><button class="cancel-button" data-close>Hủy</button><button class="primary-button" data-confirm="Cài đặt lớp học đã được lưu">Lưu thay đổi</button></div>`,
    'lesson-builder': `<h2>✦ Trợ lý tạo giáo án</h2><p>Nhập mục tiêu buổi học, TutorConnect sẽ tạo cấu trúc giáo án và hoạt động phù hợp.</p><div class="form-group"><label>Chủ đề</label><input value="Tích phân từng phần" /></div><div class="form-group"><label>Thời lượng</label><select><option>45 phút</option><option>60 phút</option><option>90 phút</option></select></div><div class="form-group"><label>Ưu tiên của buổi học</label><select><option>Củng cố nền tảng + luyện tập</option><option>Ôn thi trọng tâm</option><option>Khám phá kiến thức mới</option></select></div><div class="modal-actions"><button class="cancel-button" data-close>Hủy</button><button class="primary-button" data-confirm="AI đã tạo bản nháp giáo án trong Teaching Studio">Tạo giáo án</button></div>`,
    'parent-report': `<h2>Báo cáo tiến độ phụ huynh</h2><p>Tạo bản tóm tắt rõ ràng, tích cực và cá nhân hóa cho phụ huynh.</p><div class="form-group"><label>Học sinh</label><select><option>An Lâm · Toán 12</option><option>Gia Hân · Toán 10</option><option>Minh Yến · Toán 8</option></select></div><div class="form-group"><label>Kỳ báo cáo</label><select><option>Tuần 17–23 tháng 8</option><option>Tháng 8/2026</option></select></div><div class="modal-actions"><button class="cancel-button" data-close>Hủy</button><button class="primary-button" data-confirm="Bản nháp báo cáo phụ huynh đã sẵn sàng">Tạo bản nháp</button></div>`,
    'study-plan': `<h2>✦ Kế hoạch học tập cá nhân</h2><p>AI dựa trên lịch học, tiến độ và mục tiêu của bạn để tạo một lộ trình thực tế.</p><div class="form-group"><label>Mục tiêu chính</label><select><option>Đạt 8.0 điểm Toán cuối kỳ</option><option>Củng cố nền tảng tích phân</option><option>Ôn thi THPT Quốc gia</option></select></div><div class="form-group"><label>Thời gian có thể tự học</label><select><option>5 buổi / tuần · 45 phút</option><option>3 buổi / tuần · 60 phút</option><option>Cuối tuần · 2 giờ</option></select></div><div class="form-group"><label>Phong cách học</label><select><option>Luyện bài có hướng dẫn</option><option>Flashcard & ôn ngắt quãng</option><option>Học theo dự án</option></select></div><div class="modal-actions"><button class="cancel-button" data-close>Hủy</button><button class="primary-button" data-confirm="AI đã tạo kế hoạch học tập 7 ngày cho bạn">Tạo kế hoạch</button></div>`,
    'safety-report': `<h2>Tạo báo cáo an toàn</h2><p>Ghi nhận sự việc để đội ngũ Trust & Safety xử lý theo quy trình bảo mật.</p><div class="form-group"><label>Loại báo cáo</label><select><option>Chất lượng lớp học</option><option>Hành vi không phù hợp</option><option>Thanh toán / tài khoản</option><option>Khác</option></select></div><div class="form-group"><label>Mức độ ưu tiên</label><select><option>Thông thường</option><option>Cần xử lý sớm</option><option>Khẩn cấp</option></select></div><div class="form-group"><label>Chi tiết</label><textarea placeholder="Mô tả ngắn gọn sự việc và thông tin liên quan..."></textarea></div><div class="modal-actions"><button class="cancel-button" data-close>Hủy</button><button class="primary-button" data-confirm="Báo cáo đã được chuyển tới nhóm Trust & Safety">Gửi báo cáo</button></div>`,
    booking: `<h2>Đặt lịch học</h2><p>Gửi yêu cầu học thử 30 phút với ${state.selectedTutor}. Gia sư sẽ phản hồi sớm nhất có thể.</p><div class="form-group"><label>Môn học</label><select id="bookingSubject"><option>Toán 12 · Tích phân</option><option>Toán 11</option><option>Ôn thi THPT</option></select></div><div class="form-group"><label>Thời gian mong muốn</label><input id="bookingDateTime" type="datetime-local" value="2026-08-19T19:30" /></div><div class="form-group"><label>Lời nhắn cho gia sư</label><textarea id="bookingNotes" placeholder="Chia sẻ mục tiêu hoặc nội dung bạn muốn học..."></textarea></div><div class="modal-actions"><button class="cancel-button" data-close>Hủy</button><button class="primary-button" id="submitBookingBtn">Gửi yêu cầu</button></div>`,
    question: `<h2>Đặt câu hỏi</h2><p>Gia sư của bạn hoặc cộng đồng TutorConnect sẽ hỗ trợ bạn giải đáp.</p><div class="form-group"><label>Chủ đề</label><select><option>Toán học</option><option>Tiếng Anh</option><option>Khác</option></select></div><div class="form-group"><label>Câu hỏi của bạn</label><textarea placeholder="Ví dụ: Làm sao để chọn phương pháp giải tích phân phù hợp?"></textarea></div><div class="modal-actions"><button class="cancel-button" data-close>Hủy</button><button class="primary-button" data-confirm="Câu hỏi đã được đăng thành công">Đăng câu hỏi</button></div>`,
    'post-request': `<h2>Đăng nhu cầu học</h2><p>Hãy chia sẻ nhu cầu để các gia sư phù hợp có thể chủ động liên hệ với bạn.</p><div class="form-group"><label>Môn học & khối lớp</label><input id="reqSubject" placeholder="Ví dụ: Toán lớp 12" value="Toán lớp 12" /></div><div class="form-group"><label>Hình thức & khu vực</label><select id="reqPreferredTime"><option>Chiều T2-T5 · Trực tuyến</option><option>Học tại nhà · Quận 3</option><option>Cuối tuần · Trực tuyến</option></select></div><div class="form-group"><label>Ngân sách mỗi buổi (VNĐ)</label><input id="reqBudget" type="number" placeholder="Ví dụ: 300000" value="300000" /></div><div class="form-group"><label>Mô tả chi tiết</label><textarea id="reqDesc" placeholder="Chi tiết nhu cầu học...">Cần củng cố kiến thức thi đại học</textarea></div><div class="modal-actions"><button class="cancel-button" data-close>Hủy</button><button class="primary-button" id="submitPostReqBtn">Đăng nhu cầu</button></div>`,
    cv: `<h2>${state.cvUploaded?'Hồ sơ & CV đã nộp':'Nộp CV gia sư'}</h2><p>${state.cvUploaded?'Hồ sơ của bạn đã được ghi nhận. Bạn có thể thay thế tài liệu bất cứ lúc nào.':'Bằng cấp và kinh nghiệm rõ ràng giúp bạn được phụ huynh tin tưởng hơn.'}</p><div class="form-group"><label>CV của bạn</label><label class="upload-drop"><span style="font-size:23px">⇧</span><b>Nhấp để tải CV lên</b><span>PDF, DOCX · Tối đa 10 MB</span><input type="file" hidden accept=".pdf,.doc,.docx" /></label></div><div class="form-group"><label>Giới thiệu ngắn</label><textarea placeholder="Chia sẻ kinh nghiệm, phương pháp giảng dạy...">Gia sư Toán với 5 năm kinh nghiệm hỗ trợ học sinh THPT.</textarea></div><div class="modal-actions"><button class="cancel-button" data-close>Hủy</button><button class="primary-button" data-cv-confirm>${state.cvUploaded?'Cập nhật hồ sơ':'Nộp hồ sơ xét duyệt'}</button></div>`,
    availability: `<h2>Cập nhật lịch rảnh</h2><p>Thời gian rảnh sẽ giúp TutorConnect đề xuất bạn tới các học sinh phù hợp.</p><div class="form-group"><label>Ngày áp dụng</label><select><option>Thứ Hai · 17/08/2026</option><option>Thứ Ba · 18/08/2026</option><option>Thứ Tư · 19/08/2026</option></select></div><div class="form-group"><label>Khung giờ</label><select><option>19:00 — 21:00</option><option>13:00 — 17:00</option><option>08:00 — 11:00</option></select></div><div class="modal-actions"><button class="cancel-button" data-close>Hủy</button><button class="primary-button" data-confirm="Lịch rảnh đã được cập nhật">Lưu lịch rảnh</button></div>`,
    requests: `<h2>Yêu cầu học mới</h2><p>Bạn có ${state.tutorRequests} nhu cầu học phù hợp với hồ sơ hiện tại.</p><div class="form-group"><label>Sắp xếp theo</label><select><option>Phù hợp nhất</option><option>Gần vị trí nhất</option><option>Ngân sách cao nhất</option></select></div><div class="modal-actions"><button class="cancel-button" data-close>Đóng</button><button class="primary-button" data-confirm="Đã áp dụng sắp xếp">Áp dụng</button></div>`,
    classroom: `<div class="confirmation"><div class="confirmation-icon">✓</div><h2>Phòng học đã sẵn sàng</h2><p>Liên kết phòng học trực tuyến sẽ mở trong một cửa sổ mới khi tích hợp hệ thống họp trực tuyến.</p><div class="modal-actions"><button class="primary-button" data-close>Đã hiểu</button></div></div>`,
    'new-event': `<h2>Thêm ${state.role==='admin'?'công việc':'lịch học'}</h2><p>Tạo một lịch mới và nhận nhắc hẹn đúng lúc.</p><div class="form-group"><label>Tiêu đề</label><input placeholder="Ví dụ: Toán 12 · Tích phân" /></div><div class="form-group"><label>Thời gian</label><input type="datetime-local" value="2026-08-20T19:00" /></div><div class="modal-actions"><button class="cancel-button" data-close>Hủy</button><button class="primary-button" data-confirm="Đã thêm vào lịch">Thêm vào lịch</button></div>`,
    'new-message': `<h2>Tin nhắn mới</h2><p>Bắt đầu một cuộc trò chuyện riêng tư trên TutorConnect.</p><div class="form-group"><label>Người nhận</label><input placeholder="Nhập tên gia sư hoặc học sinh" /></div><div class="form-group"><label>Tin nhắn</label><textarea placeholder="Viết lời nhắn của bạn..."></textarea></div><div class="modal-actions"><button class="cancel-button" data-close>Hủy</button><button class="primary-button" data-confirm="Tin nhắn đã được gửi">Gửi tin nhắn</button></div>`,
    'upload-document': `<h2>Tải tài liệu lên</h2><p>Lưu tài liệu an toàn trong không gian TutorConnect của bạn.</p><label class="upload-drop"><span style="font-size:23px">⇧</span><b>Kéo thả tệp vào đây</b><span>PDF, DOCX, XLSX · Tối đa 20 MB</span><input type="file" hidden /></label><div class="modal-actions"><button class="cancel-button" data-close>Hủy</button><button class="primary-button" data-confirm="Tài liệu đã được tải lên">Tải lên</button></div>`,
    'preview-document': `<div class="confirmation"><div class="confirmation-icon">▤</div><h2>Xem trước tài liệu</h2><p>Trình xem tài liệu bảo mật và phân quyền vai trò.</p><div class="modal-actions"><button class="primary-button" data-close>Đóng</button></div></div>`,
    payment: `<h2>Nạp tiền vào TutorConnect</h2><p>Số dư dùng để thanh toán học phí nhanh chóng, an toàn.</p><div class="form-group"><label>Số tiền</label><input value="500.000" inputmode="numeric" /></div><div class="form-group"><label>Phương thức thanh toán</label><select><option>Thẻ ngân hàng nội địa</option><option>Ví MoMo</option><option>VNPay</option></select></div><div class="modal-actions"><button class="cancel-button" data-close>Hủy</button><button class="primary-button" data-confirm="Đã tạo yêu cầu thanh toán">Tiếp tục thanh toán</button></div>`,
    withdraw: `<h2>Rút thu nhập</h2><p>Số dư khả dụng: <b>8.450.000đ</b>. Giao dịch được xử lý trong 1–2 ngày làm việc.</p><div class="form-group"><label>Số tiền muốn rút</label><input value="8.450.000" inputmode="numeric" /></div><div class="form-group"><label>Tài khoản nhận tiền</label><select><option>Vietcombank · •••• 2486</option><option>Thêm tài khoản ngân hàng</option></select></div><div class="modal-actions"><button class="cancel-button" data-close>Hủy</button><button class="primary-button" data-confirm="Yêu cầu rút tiền đã được gửi">Gửi yêu cầu rút</button></div>`,
    'run-payout': `<h2>Tiến hành kỳ chi trả</h2><p>Hệ thống sẽ tạo lệnh thanh toán cho các gia sư đủ điều kiện trong kỳ tháng 8.</p><div class="form-group"><label>Chu kỳ chi trả</label><select><option>Kỳ 2 · Tháng 8/2026</option><option>Kỳ 1 · Tháng 9/2026</option></select></div><div class="form-group"><label>Tổng dự kiến</label><input value="96.200.000đ" disabled /></div><div class="modal-actions"><button class="cancel-button" data-close>Hủy</button><button class="primary-button" data-confirm="Đã tạo lệnh chi trả cho 42 gia sư">Tạo lệnh chi trả</button></div>`,
    'review-settings': `<h2>Cấu hình quy trình duyệt</h2><p>Thiết lập thời gian phản hồi và các tài liệu bắt buộc của gia sư.</p><div class="form-group"><label>Thời hạn xử lý hồ sơ</label><select><option>Trong 24 giờ</option><option>Trong 48 giờ</option></select></div><div class="form-group"><label>Tài liệu bắt buộc</label><select><option>CV + Bằng cấp + CCCD</option><option>CV + Bằng cấp</option></select></div><div class="modal-actions"><button class="cancel-button" data-close>Hủy</button><button class="primary-button" data-confirm="Cấu hình đã được lưu">Lưu thay đổi</button></div>`,
    event: `<h2>${data.name || 'Chi tiết lịch'}</h2><p>Đây là chi tiết lịch.</p><div class="modal-actions"><button class="cancel-button" data-close>Đóng</button><button class="primary-button" data-confirm="Đã mở chức năng chỉnh sửa lịch">Chỉnh sửa</button></div>`,
    review: `<h2>Duyệt hồ sơ · ${data.name}</h2><p>Kiểm tra các tài liệu trước khi cho phép gia sư xuất hiện trên hệ thống.</p><div class="form-group"><label>Thông tin đã xác minh</label><select><option>CV, Bằng cấp, Chứng chỉ nghiệp vụ</option></select></div><div class="form-group"><label>Ghi chú nội bộ</label><textarea placeholder="Ghi chú cho nhóm kiểm duyệt..."></textarea></div><div class="modal-actions"><button class="cancel-button" data-close>Từ chối</button><button class="primary-button" id="confirmVerifyTutorBtn" data-user-id="${data.userId || ''}">Duyệt hồ sơ</button></div>`,
    payout: `<h2>Duyệt chi trả · ${data.name}</h2><p>Xác nhận thanh toán thu nhập sau khi đối soát đủ các buổi học và khiếu nại.</p><div class="form-group"><label>Số tiền</label><input value="6.230.000đ" disabled /></div><div class="form-group"><label>Ngân hàng nhận</label><input value="Vietcombank · •••• 2486" disabled /></div><div class="modal-actions"><button class="cancel-button" data-close>Hủy</button><button class="primary-button" data-confirm="Đã duyệt lệnh chi trả">Duyệt chi trả</button></div>`
  };
  return forms[type] || forms.booking;
}

function openModal(type, data) {
  const modalContent = $('#modalContent');
  const modalBackdrop = $('#modalBackdrop');
  if (modalContent) modalContent.innerHTML = modalTemplate(type, data);
  if (modalBackdrop) {
    modalBackdrop.classList.add('open');
    modalBackdrop.setAttribute('aria-hidden', 'false');
  }

  $('[data-close]')?.addEventListener('click', closeModal);
  $('[data-confirm]')?.addEventListener('click', e => { closeModal(); showToast(e.currentTarget.dataset.confirm); });
  $('[data-cv-confirm]')?.addEventListener('click', () => { state.cvUploaded=true; closeModal(); renderAllViews(); showToast('CV đã được nộp để xét duyệt'); });
  
  $('#submitBookingBtn')?.addEventListener('click', async () => {
    const subject = $('#bookingSubject')?.value || 'Toán 12';
    const dateTime = $('#bookingDateTime')?.value || new Date().toISOString();
    const notes = $('#bookingNotes')?.value || '';
    const tutorId = state.selectedTutorId || (state.data.tutors[0]?._id) || '507f1f77bcf86cd799439011';

    try {
      await createAppointment(tutorId, subject, dateTime, 60, notes);
      closeModal();
      showToast('Đã tạo lịch học thành công trên hệ thống!');
      await fetchViewData();
      renderAllViews();
    } catch(err) {
      showToast('Lỗi tạo lịch: ' + err.message);
    }
  });

  $('#submitPostReqBtn')?.addEventListener('click', async () => {
    const subject = $('#reqSubject')?.value || 'Toán';
    const preferredTime = $('#reqPreferredTime')?.value || 'Trực tuyến';
    const budget = parseFloat($('#reqBudget')?.value || 300000);
    const description = $('#reqDesc')?.value || '';

    try {
      await createTutorRequest(subject, description, budget, preferredTime);
      closeModal();
      showToast('Yêu cầu tìm gia sư đã được đăng!');
      await fetchViewData();
      renderAllViews();
    } catch(err) {
      showToast('Lỗi đăng nhu cầu: ' + err.message);
    }
  });

  $('#confirmVerifyTutorBtn')?.addEventListener('click', async (e) => {
    const userId = e.currentTarget.dataset.userId;
    if (userId) {
      try {
        await verifyTutor(userId);
        showToast('Đã xác minh gia sư thành công!');
      } catch(err) {
        showToast('Lỗi xác minh: ' + err.message);
      }
    } else {
      showToast('Đã duyệt hồ sơ!');
    }
    state.reviews--;
    closeModal();
    await fetchViewData();
    renderAllViews();
  });
}

function closeModal() {
  const modalBackdrop = $('#modalBackdrop');
  if (modalBackdrop) {
    modalBackdrop.classList.remove('open');
    modalBackdrop.setAttribute('aria-hidden', 'true');
  }
}

function showToast(message) {
  const toastText = $('#toastText');
  const toast = $('#toast');
  if (toastText) toastText.textContent = message;
  if (toast) {
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 3200);
  }
}

$('#roleMenuButton')?.addEventListener('click', () => {
  $('#roleMenu')?.classList.toggle('open');
  $('#roleMenuButton')?.setAttribute('aria-expanded', $('#roleMenu')?.classList.contains('open'));
});

$$('#roleMenu button').forEach(btn => btn.addEventListener('click', () => setRole(btn.dataset.role)));
$('#mobileMenu')?.addEventListener('click', () => $('.sidebar')?.classList.toggle('open'));
$('#closeModal')?.addEventListener('click', closeModal);
$('#modalBackdrop')?.addEventListener('click', e => { if (e.target === $('#modalBackdrop')) closeModal(); });
$('#notificationBtn')?.addEventListener('click', () => showToast('Bạn có 3 thông báo mới từ gia sư và lịch học'));
$('#searchBtn')?.addEventListener('click', () => { navigate('explore'); setTimeout(() => $('#mapSearch')?.focus(), 40); });
$('#helpBtn')?.addEventListener('click', () => openModal('new-message'));

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if (e.metaKey || e.ctrlKey) {
    const rolesArray = ['student', 'tutor', 'admin'];
    const number = Number(e.key);
    if (rolesArray[number - 1]) {
      e.preventDefault();
      setRole(rolesArray[number - 1]);
    }
  }
});

async function startExperienceWithAuth(email, password, role) {
  try {
    let user;
    try {
      user = await login(email, password);
    } catch (loginErr) {
      const defaultName = role === 'student' ? 'An Lâm' : role === 'tutor' ? 'Ngọc Mai' : 'Nguyễn Hoàng';
      user = await register(email, password, defaultName, role);
    }
    state.currentUser = user;
    await setRole(user.role || role);
    $('#authScreen')?.classList.add('exit');
    showToast(`Đã đăng nhập tài khoản: ${user.name}`);
  } catch (err) {
    console.warn('Backend login/register issue, falling back to local demo mode:', err.message);
    state.currentUser = { name: roles[role].person, email, role };
    await setRole(role);
    $('#authScreen')?.classList.add('exit');
    showToast(`Chế độ trải nghiệm (${roles[role].title})`);
  }
}

$('#loginForm')?.addEventListener('submit', async e => { 
  e.preventDefault(); 
  const email = $('#loginForm input[type="text"]')?.value || 'an.lam@example.com';
  const password = $('#loginForm input[type="password"]')?.value || 'password123';
  const role = $('#loginRole')?.value || 'student';
  
  await startExperienceWithAuth(email, password, role);
});

$$('[data-login-role]').forEach(button => button.addEventListener('click', async () => {
  const role = button.dataset.loginRole;
  if ($('#loginRole')) $('#loginRole').value = role;
  
  const demoAccounts = {
    student: { email: 'student@example.com', pass: 'password123' },
    tutor: { email: 'tutor@example.com', pass: 'password123' },
    admin: { email: 'admin@example.com', pass: 'password123' }
  };
  
  const acc = demoAccounts[role] || demoAccounts.student;
  await startExperienceWithAuth(acc.email, acc.pass, role);
}));

renderNav();
renderAllViews();