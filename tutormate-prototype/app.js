'use strict';

/*
 * TutorMate - app.js
 * API ONLY
 *
 * - Không sử dụng dữ liệu demo/fake.
 * - Không fallback sang tài khoản demo.
 * - Dữ liệu nghiệp vụ lấy từ backend API.
 * - API lỗi -> hiển thị lỗi.
 * - Tính năng chưa có endpoint -> hiển thị "Chưa có API".
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
    adminStats: null
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

async function login(email, password) {
  const result = await apiCall('/auth/login', {
    method: 'POST',

    body: JSON.stringify({
      email,
      password
    })
  });

  saveToken(result?.token);
  saveCurrentUser(result?.user);

  return result?.user;
}

async function register(
  email,
  password,
  name,
  role
) {
  const result = await apiCall('/auth/register', {
    method: 'POST',

    body: JSON.stringify({
      email,
      password,
      name,
      role
    })
  });

  saveToken(result?.token);
  saveCurrentUser(result?.user);

  return result?.user;
}

function logout() {
  clearToken();

  state.currentUser = null;
  state.role = 'student';
  state.currentView = 'dashboard';

  state.data = {
    appointments: [],
    tutors: [],
    tutorRequests: [],
    conversations: [],
    messages: [],
    transactions: [],
    adminUsers: [],
    adminStats: null
  };

  showAuthScreen(true);
}


/* =========================================================
   USER API
========================================================= */

async function searchTutors(
  subject = '',
  minRating = 0
) {
  const params = new URLSearchParams();

  if (subject) {
    params.set('subject', subject);
  }

  if (minRating) {
    params.set(
      'minRating',
      String(minRating)
    );
  }

  const query = params.toString();

  return normalizeArray(
    await apiCall(
      `/users/search/tutors${
        query ? `?${query}` : ''
      }`
    )
  );
}

async function updateProfile(
  userId,
  updates
) {
  return apiCall(
    `/users/${encodeURIComponent(userId)}`,
    {
      method: 'PUT',

      body: JSON.stringify(updates)
    }
  );
}


/* =========================================================
   APPOINTMENT API
========================================================= */

async function getAppointments() {
  return normalizeArray(
    await apiCall('/appointments')
  );
}

async function getAppointment(id) {
  return apiCall(
    `/appointments/${encodeURIComponent(id)}`
  );
}

async function createAppointment(
  tutorId,
  subject,
  startTime,
  endTime,
  notes = ''
) {
  const body = {
    tutorId,
    subject,
    startTime,
    endTime
  };

  if (notes) {
    body.notes = notes;
  }

  return apiCall('/appointments', {
    method: 'POST',

    body: JSON.stringify(body)
  });
}

async function updateAppointment(
  id,
  status
) {
  return apiCall(
    `/appointments/${encodeURIComponent(id)}`,
    {
      method: 'PUT',

      body: JSON.stringify({
        status
      })
    }
  );
}


/* =========================================================
   TUTOR REQUEST API
========================================================= */

async function getTutorRequests() {
  return normalizeArray(
    await apiCall('/tutor-requests')
  );
}

async function createTutorRequest(
  subject,
  grade,
  description,
  budget
) {
  return apiCall('/tutor-requests', {
    method: 'POST',

    body: JSON.stringify({
      subject,
      grade,
      description,
      budget
    })
  });
}

async function updateTutorRequest(
  id,
  status
) {
  return apiCall(
    `/tutor-requests/${encodeURIComponent(id)}`,
    {
      method: 'PUT',

      body: JSON.stringify({
        status
      })
    }
  );
}


/* =========================================================
   MESSAGE API
========================================================= */

async function getMessages(otherUserId) {
  return normalizeArray(
    await apiCall(
      `/messages/${encodeURIComponent(otherUserId)}`
    )
  );
}

async function sendMessage(
  receiverId,
  content
) {
  return apiCall('/messages', {
    method: 'POST',

    body: JSON.stringify({
      receiverId,
      content
    })
  });
}

async function markMessageRead(
  messageId
) {
  return apiCall(
    `/messages/${encodeURIComponent(messageId)}/read`,
    {
      method: 'PUT'
    }
  );
}


/* =========================================================
   REVIEW API
========================================================= */

async function createReview(
  tutorId,
  appointmentId,
  rating,
  comment
) {
  return apiCall('/reviews', {
    method: 'POST',

    body: JSON.stringify({
      tutorId,
      appointmentId,
      rating,
      comment
    })
  });
}

async function getReviews(tutorId) {
  return normalizeArray(
    await apiCall(
      `/reviews/${encodeURIComponent(tutorId)}`
    )
  );
}


/* =========================================================
   TRANSACTION API
========================================================= */

async function createTransaction(
  appointmentId,
  paymentMethod = 'wallet'
) {
  return apiCall('/transactions', {
    method: 'POST',

    body: JSON.stringify({
      appointmentId,
      paymentMethod
    })
  });
}

async function getTransactions() {
  return normalizeArray(
    await apiCall('/transactions')
  );
}


/* =========================================================
   ADMIN API
========================================================= */

async function getAllUsers() {
  return normalizeArray(
    await apiCall('/admin/users')
  );
}

async function verifyTutor(tutorId) {
  return apiCall(
    `/admin/users/${encodeURIComponent(tutorId)}/verify`,
    {
      method: 'PUT'
    }
  );
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
  if (!name) {
    return 'TM';
  }

  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

function escapeHtml(value) {
  const div = document.createElement('div');

  div.textContent =
    value == null ? '' : String(value);

  return div.innerHTML;
}

function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '—';
  }

  return `${amount.toLocaleString(
    'vi-VN'
  )}đ`;
}

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString(
    'vi-VN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  );
}

function formatTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleTimeString(
    'vi-VN',
    {
      hour: '2-digit',
      minute: '2-digit'
    }
  );
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
    completed_payment: 'Hoàn tất'
  };

  return (
    map[status] ||
    status ||
    '—'
  );
}

function personName(ref) {
  if (!ref) {
    return '—';
  }

  if (typeof ref === 'string') {
    return ref;
  }

  return (
    ref.name ||
    ref.email ||
    '—'
  );
}

function avatar(
  name,
  cls = 'avatar-user'
) {
  return `
    <span class="avatar ${cls}">
      ${escapeHtml(getInitials(name))}
    </span>
  `;
}

function emptyState(
  title,
  description = ''
) {
  return `
    <div class="card api-empty-state">
      <h3>
        ${escapeHtml(title)}
      </h3>

      ${
        description
          ? `<p>${escapeHtml(
              description
            )}</p>`
          : ''
      }
    </div>
  `;
}

function apiErrorState(
  viewKey
) {
  const message =
    state.apiErrors[viewKey];

  if (!message) {
    return '';
  }

  return `
    <div class="card api-error-state">
      <strong>
        Không tải được dữ liệu từ API
      </strong>

      <p>
        ${escapeHtml(message)}
      </p>

      <button
        class="secondary-button"
        data-retry-view="${escapeHtml(
          viewKey
        )}"
      >
        Thử lại
      </button>
    </div>
  `;
}

function recordApiError(
  viewKey,
  error
) {
  state.apiErrors[viewKey] =
    error?.message ||
    'Lỗi API không xác định.';
}

function clearApiError(
  viewKey
) {
  delete state.apiErrors[viewKey];
}

function showAuthScreen(
  show = true
) {
  $('#authScreen')?.classList.toggle(
    'exit',
    !show
  );
}

function showToast(message) {
  const toast = $('#toast');
  const toastText = $('#toastText');

  if (toastText) {
    toastText.textContent = message;
  }

  if (!toast) {
    return;
  }

  toast.classList.add('show');

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(() => {
      toast.classList.remove(
        'show'
      );
    }, 3500);
}


/* =========================================================
   IDENTITY
========================================================= */

function applyIdentity() {
  const roleInfo =
    roles[state.role] ||
    roles.student;

  const name =
    state.currentUser?.name ||
    state.currentUser?.email ||
    '—';

  const initials =
    getInitials(name);

  if ($('#workspaceTitle')) {
    $('#workspaceTitle').textContent =
      roleInfo.title;
  }

  if ($('#workspacePerson')) {
    $('#workspacePerson').textContent =
      name;
  }

  if ($('#breadcrumbRole')) {
    $('#breadcrumbRole').textContent =
      roleInfo.title;
  }

  const workspaceAvatar =
    $('.current-workspace .avatar');

  if (workspaceAvatar) {
    workspaceAvatar.textContent =
      initials;
  }

  const profileButton =
    $('#profileBtn');

  if (profileButton) {
    profileButton.textContent =
      initials;
  }
}


/* =========================================================
   NAVIGATION
========================================================= */

function renderNav() {
  const container =
    $('#mainNav');

  if (!container) {
    return;
  }

  const roleInfo =
    roles[state.role] ||
    roles.student;

  container.innerHTML = `
    <p class="nav-label">
      KHÔNG GIAN CỦA BẠN
    </p>

    ${roleInfo.nav
      .map(
        ([id, icon, label]) => `
          <button
            class="nav-item ${
              state.currentView === id
                ? 'active'
                : ''
            }"
            data-view="${id}"
          >
            <span class="nav-icon">
              ${icon}
            </span>

            <span>
              ${label}
            </span>
          </button>
        `
      )
      .join('')}
  `;

  $$('.nav-item').forEach(
    (button) => {
      button.addEventListener(
        'click',
        () =>
          navigate(
            button.dataset.view
          )
      );
    }
  );
}

function navigateWithoutFetch(
  view
) {
  state.currentView = view;

  const titleMap = {
    dashboard: 'Tổng quan',

    explore:
      state.role === 'tutor'
        ? 'Tìm học sinh'
        : 'Tìm gia sư',

    calendar:
      state.role === 'tutor'
        ? 'Lịch giảng dạy'
        : state.role === 'admin'
        ? 'Lịch hệ thống'
        : 'Lịch học',

    classroom:
      state.role === 'admin'
        ? 'Giám sát lớp học'
        : 'Lớp học số',

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

    'admin-review':
      'Duyệt hồ sơ gia sư'
  };

  $$('.view').forEach(
    (element) =>
      element.classList.remove(
        'active'
      )
  );

  $(`#view-${view}`)?.classList.add(
    'active'
  );

  if ($('#breadcrumbPage')) {
    $('#breadcrumbPage').textContent =
      titleMap[view] ||
      'Tổng quan';
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
  if (
    !getToken() ||
    !state.currentUser
  ) {
    return;
  }

  const view =
    state.currentView;

  clearApiError(view);

  try {
    /*
     * STUDENT
     */
    if (
      state.role === 'student'
    ) {
      if (
        view === 'dashboard' ||
        view === 'calendar'
      ) {
        try {
          state.data.appointments =
            await getAppointments();
        } catch (error) {
          recordApiError(
            view,
            error
          );
        }
      }

      if (
        view === 'dashboard' ||
        view === 'explore'
      ) {
        try {
          state.data.tutors =
            await searchTutors();
        } catch (error) {
          recordApiError(
            view,
            error
          );
        }
      }
    }


    /*
     * TUTOR
     */
    if (
      state.role === 'tutor'
    ) {
      if (
        view === 'dashboard' ||
        view === 'explore'
      ) {
        try {
          state.data.tutorRequests =
            await getTutorRequests();
        } catch (error) {
          recordApiError(
            view,
            error
          );
        }
      }

      if (
        view === 'dashboard' ||
        view === 'calendar'
      ) {
        try {
          state.data.appointments =
            await getAppointments();
        } catch (error) {
          recordApiError(
            view,
            error
          );
        }
      }

      if (
        view === 'dashboard' ||
        view === 'finance'
      ) {
        try {
          state.data.transactions =
            await getTransactions();
        } catch (error) {
          recordApiError(
            view,
            error
          );
        }
      }
    }


    /*
     * MESSAGE
     */
    if (
      view === 'messages'
    ) {
      try {
        state.data.appointments =
          await getAppointments();

        buildConversationsFromAppointments();
      } catch (error) {
        recordApiError(
          view,
          error
        );
      }
    }


    /*
     * FINANCE
     */
    if (
      view === 'finance'
    ) {
      try {
        state.data.transactions =
          await getTransactions();
      } catch (error) {
        recordApiError(
          view,
          error
        );
      }
    }


    /*
     * ADMIN
     */
    if (
      state.role === 'admin' &&
      (
        view === 'dashboard' ||
        view === 'admin-review'
      )
    ) {
      try {
        state.data.adminUsers =
          await getAllUsers();
      } catch (error) {
        recordApiError(
          view,
          error
        );
      }

      try {
        state.data.adminStats =
          await getAdminStats();
      } catch (error) {
        recordApiError(
          view,
          error
        );
      }
    }

    if (
      state.role === 'admin' &&
      view === 'finance'
    ) {
      try {
        state.data.transactions =
          await getTransactions();
      } catch (error) {
        recordApiError(
          view,
          error
        );
      }
    }
  } catch (error) {
    recordApiError(
      view,
      error
    );
  }
}


/* =========================================================
   CONVERSATIONS
========================================================= */

function buildConversationsFromAppointments() {
  const map = new Map();

  const currentUserId =
    String(
      state.currentUser?.id ||
      state.currentUser?._id ||
      ''
    );

  for (
    const appointment of
    state.data.appointments || []
  ) {
    const participant =
      state.role === 'student'
        ? appointment.tutorId
        : appointment.studentId;

    const participantId =
      typeof participant === 'object'
        ? participant?._id ||
          participant?.id
        : participant;

    if (!participantId) {
      continue;
    }

    if (
      String(participantId) ===
      currentUserId
    ) {
      continue;
    }

    map.set(
      String(participantId),
      {
        id: participantId,
        name: personName(
          participant
        )
      }
    );
  }

  state.data.conversations = [
    ...map.values()
  ];

  if (
    state.selectedConversationId
  ) {
    state.data.currentChatPartner =
      state.data.conversations.find(
        (item) =>
          String(item.id) ===
          String(
            state.selectedConversationId
          )
      ) || null;
  }
}


/* =========================================================
   STUDENT DASHBOARD
========================================================= */

function studentDashboard() {
  const appointments = [
    ...(state.data.appointments || [])
  ]
    .filter(
      (item) =>
        item.status !== 'cancelled'
    )
    .sort(
      (a, b) =>
        new Date(
          a.startTime
        ) -
        new Date(
          b.startTime
        )
    );

  const tutors =
    state.data.tutors || [];

  const rows =
    appointments
      .slice(0, 5)
      .map(
        (appointment) => `
          <div class="schedule-row">
            <div class="time-block">
              <b>
                ${formatTime(
                  appointment.startTime
                )}
              </b>

              <span>
                ${
                  appointment.endTime
                    ? formatTime(
                        appointment.endTime
                      )
                    : ''
                }
              </span>
            </div>

            <i class="event-dot"></i>

            <div class="event-info">
              <b>
                ${escapeHtml(
                  appointment.subject ||
                    'Buổi học'
                )}
              </b>

              <span>
                ${escapeHtml(
                  personName(
                    appointment.tutorId
                  )
                )}
              </span>
            </div>

            <span class="event-chip online">
              ${escapeHtml(
                formatStatus(
                  appointment.status
                )
              )}
            </span>
          </div>
        `
      )
      .join('');

  const tutorCards =
    tutors
      .slice(0, 6)
      .map(
        (tutor) => `
          <div class="mini-tutor">
            <div class="mini-tutor-top">
              ${avatar(
                tutor.name
              )}

              <div>
                <h3>
                  ${escapeHtml(
                    tutor.name ||
                      'Gia sư'
                  )}
                </h3>

                <p>
                  ${escapeHtml(
                    Array.isArray(
                      tutor.subjects
                    )
                      ? tutor.subjects.join(
                          ', '
                        )
                      : '—'
                  )}
                </p>
              </div>
            </div>

            <div class="rating">
              ${
                tutor.rating != null
                  ? `★ ${Number(
                      tutor.rating
                    ).toFixed(1)}`
                  : 'Chưa có đánh giá'
              }

              ${
                tutor.hourlyRate != null
                  ? ` · ${formatMoney(
                      tutor.hourlyRate
                    )}/giờ`
                  : ''
              }
            </div>

            <button
              data-open="booking"
              data-tutor-id="${escapeHtml(
                tutor._id ||
                  tutor.id ||
                  ''
              )}"
              data-tutor-name="${escapeHtml(
                tutor.name ||
                  ''
              )}"
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
        <p class="eyebrow">
          DỮ LIỆU TỪ API
        </p>

        <h1>
          Chào
          ${escapeHtml(
            state.currentUser?.name ||
              ''
          )}
          !
        </h1>

        <p>
          Dữ liệu được tải trực tiếp từ
          backend TutorMate.
        </p>
      </div>

      <div class="date-pill">
        ${new Date().toLocaleDateString(
          'vi-VN'
        )}
      </div>
    </div>

    ${apiErrorState('dashboard')}

    <div class="student-grid">

      <article class="card schedule-card">
        <div class="card-heading">
          <h2>
            Lịch học
          </h2>

          <button
            class="text-action"
            data-go="calendar"
          >
            Xem lịch đầy đủ →
          </button>
        </div>

        <div class="schedule-list">
          ${
            rows ||
            emptyState(
              'Chưa có lịch học',
              'Backend chưa trả về lịch học.'
            )
          }
        </div>
      </article>


      <div class="right-column">
        <article class="card progress-card">
          <h2>
            Thông tin tài khoản
          </h2>

          <div class="progress-top">
            <div class="progress-ring">
              <b>
                ${appointments.length}
              </b>

              <small>
                lịch học
              </small>
            </div>

            <div class="progress-note">
              <b>
                Dữ liệu thực
              </b>

              <span>
                Không sử dụng thống kê học tập giả.
              </span>
            </div>
          </div>
        </article>

        <article class="card question-card">
          <span class="question-icon">
            ?
          </span>

          <h3>
            Cần hỗ trợ?
          </h3>

          <p>
            Bạn có thể nhắn với gia sư
            đã xuất hiện trong lịch.
          </p>

          <button data-go="messages">
            Mở tin nhắn →
          </button>
        </article>
      </div>


      <article class="card recommended-card">
        <div class="card-heading">
          <h2>
            Gia sư từ API
          </h2>

          <button
            class="text-action"
            data-go="explore"
          >
            Khám phá tất cả →
          </button>
        </div>

        <div class="teacher-scroll">
          ${
            tutorCards ||
            emptyState(
              'Chưa có gia sư',
              'Backend chưa trả về hồ sơ gia sư.'
            )
          }
        </div>
      </article>
    </div>
  `;
}


/* =========================================================
   TUTOR DASHBOARD
========================================================= */

function tutorDashboard() {
  const requests =
    state.data.tutorRequests || [];

  const appointments = [
    ...(state.data.appointments || [])
  ]
    .filter(
      (item) =>
        item.status !== 'cancelled'
    )
    .sort(
      (a, b) =>
        new Date(
          a.startTime
        ) -
        new Date(
          b.startTime
        )
    );

  const requestsHtml =
    requests
      .slice(0, 8)
      .map(
        (request) => `
          <div class="student-request">
            ${avatar(
              personName(
                request.studentId
              )
            )}

            <div class="request-copy">
              <b>
                ${escapeHtml(
                  personName(
                    request.studentId
                  )
                )}
                ·
                ${escapeHtml(
                  request.subject ||
                    '—'
                )}
              </b>

              <span>
                ${escapeHtml(
                  request.description ||
                    ''
                )}
              </span>

              <small>
                ${
                  request.grade
                    ? `Khối ${escapeHtml(
                        request.grade
                      )} · `
                    : ''
                }

                ${
                  request.budget != null
                    ? formatMoney(
                        request.budget
                      )
                    : ''
                }
              </small>
            </div>

            <div class="request-actions">
              <button
                data-accept="${escapeHtml(
                  personName(
                    request.studentId
                  )
                )}"
                data-request-id="${escapeHtml(
                  request._id ||
                    request.id ||
                    ''
                )}"
              >
                Nhận lớp
              </button>
            </div>
          </div>
        `
      )
      .join('');

  const transactions =
    state.data.transactions || [];

  const income =
    transactions.reduce(
      (sum, item) =>
        sum +
        (
          Number(item.amount) ||
          0
        ),
      0
    );

  return `
    <div class="welcome">
      <div>
        <p class="eyebrow">
          DỮ LIỆU TỪ API
        </p>

        <h1>
          Chào
          ${escapeHtml(
            state.currentUser?.name ||
              ''
          )}
          !
        </h1>

        <p>
          Tổng quan gia sư từ backend.
        </p>
      </div>
    </div>

    ${apiErrorState('dashboard')}

    <div class="tutor-grid">

      <div>

        <div class="metric-grid">

          <article class="card metric-card">
            <p>
              Yêu cầu học
            </p>

            <h3>
              ${requests.length}
            </h3>

            <small>
              Từ Tutor Request API
            </small>
          </article>

          <article class="card metric-card">
            <p>
              Buổi học
            </p>

            <h3>
              ${appointments.length}
            </h3>

            <small>
              Từ Appointment API
            </small>
          </article>

          <article class="card metric-card">
            <p>
              Giao dịch
            </p>

            <h3>
              ${formatMoney(
                income
              )}
            </h3>

            <small>
              Từ Transaction API
            </small>
          </article>

        </div>


        <article class="card">
          <div class="card-heading">
            <h2>
              Yêu cầu học mới
            </h2>
          </div>

          <div class="student-request-list">
            ${
              requestsHtml ||
              emptyState(
                'Chưa có yêu cầu',
                'Backend chưa trả về yêu cầu nào.'
              )
            }
          </div>
        </article>

      </div>


      <div class="right-column">

        <article class="card">
          <div class="card-heading">
            <h2>
              Lịch giảng dạy
            </h2>

            <button
              class="text-action"
              data-go="calendar"
            >
              Mở lịch →
            </button>
          </div>

          ${
            appointments.length
              ? appointments
                  .slice(0, 5)
                  .map(
                    (appointment) => `
                      <div class="timeline-item">
                        <b>
                          ${formatDateTime(
                            appointment.startTime
                          )}
                        </b>

                        <p>
                          ${escapeHtml(
                            appointment.subject ||
                              'Buổi học'
                          )}

                          ·

                          ${escapeHtml(
                            personName(
                              appointment.studentId
                            )
                          )}
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
  const users =
    state.data.adminUsers || [];

  const stats =
    state.data.adminStats;

  const pendingTutors =
    users.filter(
      (user) =>
        user.role === 'tutor' &&
        !user.verified
    );

  return `
    <div class="welcome">
      <div>
        <p class="eyebrow">
          DỮ LIỆU TỪ ADMIN API
        </p>

        <h1>
          Xin chào
          ${escapeHtml(
            state.currentUser?.name ||
              ''
          )}
          !
        </h1>

        <p>
          Không sử dụng số liệu quản trị giả.
        </p>
      </div>

      <button
        class="heading-action"
        data-go="admin-review"
      >
        Duyệt gia sư →
      </button>
    </div>

    ${apiErrorState('dashboard')}

    <div class="admin-metrics">

      <article class="card admin-metric">
        <p>
          Người dùng
        </p>

        <h2>
          ${
            stats?.totalUsers ??
            users.length
          }
        </h2>

        <small>
          Admin API
        </small>
      </article>

      <article class="card admin-metric">
        <p>
          Gia sư chờ duyệt
        </p>

        <h2>
          ${pendingTutors.length}
        </h2>

        <small>
          Từ User API
        </small>
      </article>

      <article class="card admin-metric">
        <p>
          Buổi học
        </p>

        <h2>
          ${
            stats?.totalAppointments ??
            '—'
          }
        </h2>

        <small>
          Admin Stats API
        </small>
      </article>

      <article class="card admin-metric">
        <p>
          Doanh thu
        </p>

        <h2>
          ${
            stats?.revenue != null
              ? formatMoney(
                  stats.revenue
                )
              : '—'
          }
        </h2>

        <small>
          Admin Stats API
        </small>
      </article>

    </div>
  `;
}


/* =========================================================
   EXPLORE
========================================================= */

function studentExplore() {
  const tutors =
    state.data.tutors || [];

  const query =
    $('#mapSearch')?.value
      ?.trim() || '';

  const filtered =
    query
      ? tutors.filter(
          (tutor) =>
            `${tutor.name || ''} ${
              Array.isArray(
                tutor.subjects
              )
                ? tutor.subjects.join(
                    ' '
                  )
                : ''
            }`
              .toLowerCase()
              .includes(
                query.toLowerCase()
              )
        )
      : tutors;

  const cards =
    filtered
      .map(
        (tutor) => `
          <div class="mini-tutor">

            <div class="mini-tutor-top">
              ${avatar(
                tutor.name
              )}

              <div>
                <h3>
                  ${escapeHtml(
                    tutor.name ||
                      ''
                  )}
                </h3>

                <p>
                  ${escapeHtml(
                    Array.isArray(
                      tutor.subjects
                    )
                      ? tutor.subjects.join(
                          ', '
                        )
                      : '—'
                  )}
                </p>
              </div>
            </div>

            <div class="rating">
              ${
                tutor.rating != null
                  ? `★ ${Number(
                      tutor.rating
                    ).toFixed(1)}`
                  : 'Chưa có rating'
              }

              ${
                tutor.hourlyRate != null
                  ? ` · ${formatMoney(
                      tutor.hourlyRate
                    )}/giờ`
                  : ''
              }
            </div>

            <button
              data-open="booking"
              data-tutor-id="${escapeHtml(
                tutor._id ||
                  tutor.id ||
                  ''
              )}"
              data-tutor-name="${escapeHtml(
                tutor.name ||
                  ''
              )}"
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
        <p class="eyebrow">
          DỮ LIỆU TỪ USER API
        </p>

        <h1>
          Tìm gia sư
        </h1>

        <p>
          Hồ sơ được lấy trực tiếp từ backend.
        </p>
      </div>

      <button
        class="heading-action"
        data-open="post-request"
      >
        ＋ Đăng nhu cầu học
      </button>
    </div>

    ${apiErrorState('explore')}

    <div class="explore-layout">

      <aside class="card filter-panel">

        <div class="filter-title">
          <h2>
            Bộ lọc
          </h2>

          <button
            data-reset-filter
          >
            Đặt lại
          </button>
        </div>

        <div class="filter-group">
          <h3>
            Tìm kiếm
          </h3>

          <input
            id="mapSearch"
            placeholder="Tên hoặc môn học..."
            value="${escapeHtml(
              query
            )}"
          />
        </div>

        <div class="filter-group">
          <h3>
            Đánh giá tối thiểu
          </h3>

          <select id="minRatingFilter">
            <option value="0">
              Tất cả
            </option>

            <option value="4">
              4.0+
            </option>

            <option value="4.5">
              4.5+
            </option>
          </select>
        </div>

      </aside>


      <section class="card map-section">

        <div class="search-on-map">
          <button
            id="mapSearchButton"
          >
            Tìm
          </button>
        </div>

        <div class="teacher-scroll">
          ${
            cards ||
            emptyState(
              'Không có gia sư',
              'Backend không có kết quả phù hợp.'
            )
          }
        </div>

      </section>

    </div>
  `;
}

function tutorExplore() {
  const requests =
    state.data.tutorRequests || [];

  const cards =
    requests
      .map(
        (request) => `
          <div class="student-request">

            ${avatar(
              personName(
                request.studentId
              )
            )}

            <div class="request-copy">

              <b>
                ${escapeHtml(
                  personName(
                    request.studentId
                  )
                )}

                ·

                ${escapeHtml(
                  request.subject ||
                    '—'
                )}
              </b>

              <span>
                ${escapeHtml(
                  request.description ||
                    ''
                )}
              </span>

              <small>
                ${
                  request.grade
                    ? `Khối ${escapeHtml(
                        request.grade
                      )}`
                    : ''
                }

                ${
                  request.budget != null
                    ? ` · ${formatMoney(
                        request.budget
                      )}`
                    : ''
                }
              </small>
            </div>

            <div class="request-actions">
              <button
                data-accept="${escapeHtml(
                  personName(
                    request.studentId
                  )
                )}"
                data-request-id="${escapeHtml(
                  request._id ||
                    request.id ||
                    ''
                )}"
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
        <p class="eyebrow">
          DỮ LIỆU TỪ TUTOR REQUEST API
        </p>

        <h1>
          Học sinh đang tìm gia sư
        </h1>

        <p>
          Không hiển thị yêu cầu giả.
        </p>
      </div>
    </div>

    ${apiErrorState('explore')}

    <section class="card">
      <div class="student-request-list">
        ${
          cards ||
          emptyState(
            'Chưa có yêu cầu',
            'Backend chưa trả về yêu cầu học.'
          )
        }
      </div>
    </section>
  `;
}


/* =========================================================
   CALENDAR
========================================================= */

function calendarView() {
  const appointments = [
    ...(state.data.appointments || [])
  ]
    .filter(
      (item) =>
        item.status !== 'cancelled'
    )
    .sort(
      (a, b) =>
        new Date(
          a.startTime
        ) -
        new Date(
          b.startTime
        )
    );

  return `
    <div class="page-heading">

      <div>
        <p class="eyebrow">
          DỮ LIỆU TỪ APPOINTMENT API
        </p>

        <h1>
          ${
            state.role === 'tutor'
              ? 'Lịch giảng dạy'
              : state.role === 'admin'
              ? 'Lịch hệ thống'
              : 'Lịch học'
          }
        </h1>

        <p>
          ${appointments.length}
          lịch trong dữ liệu hiện tại.
        </p>
      </div>

      ${
        state.role !== 'admin'
          ? `
            <button
              class="heading-action"
              data-open="booking"
            >
              ＋ Tạo lịch
            </button>
          `
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
                    data-calendar-event="${escapeHtml(
                      appointment._id ||
                        appointment.id ||
                        ''
                    )}"
                  >
                    <div class="upcoming-date">
                      <b>
                        ${new Date(
                          appointment.startTime
                        ).getDate()}
                      </b>

                      THG
                      ${
                        new Date(
                          appointment.startTime
                        ).getMonth() + 1
                      }
                    </div>

                    <div>
                      <h4>
                        ${escapeHtml(
                          appointment.subject ||
                            'Buổi học'
                        )}
                      </h4>

                      <p>
                        ${formatDateTime(
                          appointment.startTime
                        )}

                        ·

                        ${escapeHtml(
                          state.role === 'tutor'
                            ? personName(
                                appointment.studentId
                              )
                            : personName(
                                appointment.tutorId
                              )
                        )}
                      </p>

                      <small>
                        ${escapeHtml(
                          formatStatus(
                            appointment.status
                          )
                        )}
                      </small>
                    </div>
                  </div>
                `
              )
              .join('')
          : emptyState(
              'Chưa có lịch',
              'Backend chưa trả về appointment nào.'
            )
      }

    </div>
  `;
}


/* =========================================================
   MESSAGES
========================================================= */

function messagesView() {
  const conversations =
    state.data.conversations || [];

  const current =
    state.data.currentChatPartner;

  const messages =
    state.data.messages || [];

  const conversationHtml =
    conversations
      .map(
        (conversation) => `
          <button
            class="conversation ${
              String(
                conversation.id
              ) ===
              String(
                state.selectedConversationId
              )
                ? 'active'
                : ''
            }"
            data-conversation-id="${escapeHtml(
              conversation.id
            )}"
          >
            ${avatar(
              conversation.name
            )}

            <div class="conversation-body">
              <div class="conversation-name">
                <b>
                  ${escapeHtml(
                    conversation.name
                  )}
                </b>
              </div>

              <p>
                Tin nhắn từ API
              </p>
            </div>
          </button>
        `
      )
      .join('');

  const messageHtml =
    messages
      .map(
        (message) => {
          const senderId =
            message.senderId?._id ||
            message.senderId?.id ||
            message.senderId;

          const myId =
            state.currentUser?.id ||
            state.currentUser?._id;

          const mine =
            String(senderId) ===
            String(myId);

          return `
            <div
              class="message ${
                mine ? 'mine' : ''
              }"
            >
              ${
                mine
                  ? avatar(
                      state.currentUser?.name
                    )
                  : avatar(
                      personName(
                        message.senderId
                      )
                    )
              }

              <div>
                <div class="bubble">
                  ${escapeHtml(
                    message.content ||
                      ''
                  )}
                </div>

                <span class="message-time">
                  ${formatDateTime(
                    message.createdAt
                  )}
                </span>
              </div>
            </div>
          `;
        }
      )
      .join('');

  return `
    <div class="page-heading">
      <div>
        <p class="eyebrow">
          DỮ LIỆU TỪ MESSAGE API
        </p>

        <h1>
          Tin nhắn
        </h1>

        <p>
          Cuộc trò chuyện lấy từ dữ liệu thực.
        </p>
      </div>
    </div>

    ${apiErrorState('messages')}

    <section class="card messages-layout">

      <aside class="inbox-column">

        <div class="inbox-heading">
          <h2>
            Hộp thư
          </h2>
        </div>

        ${
          conversationHtml ||
          emptyState(
            'Chưa có cuộc trò chuyện',
            'Cần có dữ liệu lịch học để xác định đối tác.'
          )
        }

      </aside>


      <section class="chat-column">

        <header class="chat-header">

          <div class="chat-person">
            ${avatar(
              current?.name
            )}

            <div>
              <h3>
                ${escapeHtml(
                  current?.name ||
                    'Chưa chọn cuộc trò chuyện'
                )}
              </h3>

              <p>
                API
              </p>
            </div>
          </div>

        </header>


        <div
          class="chat-thread"
          id="chatThread"
        >
          ${
            messageHtml ||
            emptyState(
              'Chưa có tin nhắn',
              'Chưa có dữ liệu message.'
            )
          }
        </div>


        <form
          class="chat-composer"
          id="messageForm"
        >
          <input
            id="messageInput"
            ${
              current
                ? ''
                : 'disabled'
            }
            placeholder="${
              current
                ? 'Viết tin nhắn...'
                : 'Chọn người nhận'
            }"
            autocomplete="off"
          />

          <button
            class="send-message"
            ${
              current
                ? ''
                : 'disabled'
            }
          >
            ↑
          </button>
        </form>

      </section>

    </section>
  `;
}


/* =========================================================
   FINANCE
========================================================= */

function financeView() {
  const transactions =
    state.data.transactions || [];

  const total =
    transactions.reduce(
      (sum, transaction) =>
        sum +
        (
          Number(
            transaction.amount
          ) || 0
        ),
      0
    );

  const completed =
    transactions.filter(
      (transaction) =>
        transaction.status ===
        'completed'
    ).length;

  const pending =
    transactions.filter(
      (transaction) =>
        transaction.status ===
        'pending'
    ).length;

  return `
    <div class="page-heading">
      <div>
        <p class="eyebrow">
          DỮ LIỆU TỪ TRANSACTION API
        </p>

        <h1>
          ${
            state.role === 'tutor'
              ? 'Thu nhập'
              : state.role === 'admin'
              ? 'Tài chính'
              : 'Thanh toán'
          }
        </h1>

        <p>
          Không có số dư hard-code.
        </p>
      </div>
    </div>

    ${apiErrorState('finance')}

    <div class="finance-grid">

      <article class="card finance-summary">
        <p>
          Tổng giao dịch
        </p>

        <h2>
          ${formatMoney(total)}
        </h2>

        <small>
          ${transactions.length}
          giao dịch
        </small>
      </article>

      <article class="card finance-summary">
        <p>
          Hoàn tất
        </p>

        <h2>
          ${completed}
        </h2>
      </article>

      <article class="card finance-summary">
        <p>
          Đang chờ
        </p>

        <h2>
          ${pending}
        </h2>
      </article>

    </div>


    <article class="card payout-card">

      <div class="card-heading">
        <h2>
          Giao dịch
        </h2>
      </div>

      ${
        transactions.length
          ? transactions
              .map(
                (transaction) => `
                  <div class="payout-row">

                    <span>
                      <b>
                        ${
                          escapeHtml(
                            transaction
                              .appointmentId
                              ?.subject ||
                            'Giao dịch'
                          )
                        }
                      </b>

                      <br />

                      <small>
                        ${escapeHtml(
                          transaction.paymentMethod ||
                            ''
                        )}
                      </small>
                    </span>

                    <span>
                      ${formatDateTime(
                        transaction.createdAt
                      )}
                    </span>

                    <span>
                      <b>
                        ${formatMoney(
                          transaction.amount
                        )}
                      </b>
                    </span>

                    <span>
                      ${escapeHtml(
                        formatStatus(
                          transaction.status
                        )
                      )}
                    </span>

                  </div>
                `
              )
              .join('')
          : emptyState(
              'Chưa có giao dịch',
              'Backend chưa trả về transaction nào.'
            )
      }

    </article>
  `;
}


/* =========================================================
   ADMIN REVIEW
========================================================= */

function adminReviewView() {
  const users =
    state.data.adminUsers || [];

  const pending =
    users.filter(
      (user) =>
        user.role === 'tutor' &&
        !user.verified
    );

  const rows =
    pending
      .map(
        (user) => `
          <tr>

            <td>
              <div class="table-person">

                ${avatar(
                  user.name
                )}

                <div>
                  <b>
                    ${escapeHtml(
                      user.name ||
                        ''
                    )}
                  </b>

                  <span>
                    ${escapeHtml(
                      user.email ||
                        ''
                    )}
                  </span>
                </div>

              </div>
            </td>

            <td>
              ${escapeHtml(
                Array.isArray(
                  user.subjects
                )
                  ? user.subjects.join(
                      ', '
                    )
                  : '—'
              )}
            </td>

            <td>
              Chờ xác minh
            </td>

            <td>
              <button
                class="table-action"
                data-review
                data-user-id="${escapeHtml(
                  user._id ||
                    user.id ||
                    ''
                )}"
                data-review-name="${escapeHtml(
                  user.name ||
                    ''
                )}"
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
        <p class="eyebrow">
          DỮ LIỆU TỪ ADMIN USERS API
        </p>

        <h1>
          Duyệt gia sư
        </h1>

        <p>
          ${pending.length}
          hồ sơ chờ xác minh.
        </p>
      </div>

    </div>

    ${apiErrorState(
      'admin-review'
    )}

    <article class="card admin-table-card">

      <table class="review-table">

        <thead>
          <tr>
            <th>
              GIA SƯ
            </th>

            <th>
              CHUYÊN MÔN
            </th>

            <th>
              TRẠNG THÁI
            </th>

            <th></th>
          </tr>
        </thead>

        <tbody>
          ${
            rows ||
            `
              <tr>
                <td colspan="4">
                  Không có hồ sơ chờ duyệt.
                </td>
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

function unsupportedView(
  title,
  description
) {
  return `
    <div class="page-heading">
      <div>

        <p class="eyebrow">
          CHƯA CÓ API
        </p>

        <h1>
          ${escapeHtml(title)}
        </h1>

        <p>
          ${escapeHtml(
            description
          )}
        </p>

      </div>
    </div>

    <div class="card api-empty-state">

      <h3>
        Frontend không tạo dữ liệu giả
      </h3>

      <p>
        Tính năng này chỉ hiển thị dữ liệu
        khi backend có endpoint tương ứng.
      </p>

    </div>
  `;
}

function classroomView() {
  return unsupportedView(
    state.role === 'admin'
      ? 'Giám sát lớp học'
      : 'Lớp học số',

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
   RENDER
========================================================= */

function renderAllViews() {
  const dashboard =
    $('#view-dashboard');

  if (dashboard) {
    dashboard.innerHTML =
      state.role === 'student'
        ? studentDashboard()
        : state.role === 'tutor'
        ? tutorDashboard()
        : adminDashboard();
  }

  const explore =
    $('#view-explore');

  if (explore) {
    explore.innerHTML =
      state.role === 'tutor'
        ? tutorExplore()
        : studentExplore();
  }

  const calendar =
    $('#view-calendar');

  if (calendar) {
    calendar.innerHTML =
      calendarView();
  }

  const messages =
    $('#view-messages');

  if (messages) {
    messages.innerHTML =
      messagesView();
  }

  const classroom =
    $('#view-classroom');

  if (classroom) {
    classroom.innerHTML =
      classroomView();
  }

  const coach =
    $('#view-coach');

  if (coach) {
    coach.innerHTML =
      coachView();
  }

  const documents =
    $('#view-documents');

  if (documents) {
    documents.innerHTML =
      documentsView();
  }

  const finance =
    $('#view-finance');

  if (finance) {
    finance.innerHTML =
      financeView();
  }

  const adminReview =
    $('#view-admin-review');

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

  /*
   * Navigation
   */
  $$('[data-go]').forEach(
    (element) => {
      element.addEventListener(
        'click',
        () =>
          navigate(
            element.dataset.go
          )
      );
    }
  );


  /*
   * Modals
   */
  $$('[data-open]').forEach(
    (element) => {
      element.addEventListener(
        'click',
        () => {

          state.selectedTutorId =
            element.dataset.tutorId ||
            state.selectedTutorId;

          state.selectedTutor =
            element.dataset.tutorName ||
            state.selectedTutor;

          openModal(
            element.dataset.open,
            {
              userId:
                element.dataset.userId,

              name:
                element.dataset.reviewName,

              feature:
                element.dataset.feature
            }
          );
        }
      );
    }
  );


  /*
   * Retry API
   */
  $$('[data-retry-view]').forEach(
    (element) => {
      element.addEventListener(
        'click',
        async () => {

          state.currentView =
            element.dataset.retryView;

          await fetchViewData();

          renderAllViews();

          navigateWithoutFetch(
            state.currentView
          );
        }
      );
    }
  );


  /*
   * Accept tutor request
   */
  $$('[data-accept]').forEach(
    (element) => {

      element.addEventListener(
        'click',
        async () => {

          const requestId =
            element.dataset.requestId;

          if (!requestId) {
            showToast(
              'Không có request ID từ API.'
            );

            return;
          }

          try {
            await updateTutorRequest(
              requestId,
              'matched'
            );

            showToast(
              'Đã nhận lớp.'
            );

            await fetchViewData();

            renderAllViews();

          } catch (error) {
            showToast(
              `Nhận lớp thất bại: ${error.message}`
            );
          }
        }
      );

    }
  );


  /*
   * Calendar event
   */
  $$('[data-calendar-event]').forEach(
    (element) => {

      element.addEventListener(
        'click',
        () => {

          const id =
            element.dataset.calendarEvent;

          const appointment =
            state.data.appointments.find(
              (item) =>
                String(
                  item._id ||
                    item.id
                ) === String(id)
            );

          if (appointment) {
            openModal(
              'event',
              appointment
            );
          }

        }
      );

    }
  );


  /*
   * Messages
   */
  $$('[data-conversation-id]').forEach(
    (element) => {

      element.addEventListener(
        'click',
        () =>
          selectConversation(
            element.dataset
              .conversationId
          )
      );

    }
  );


  $('#messageForm')
    ?.addEventListener(
      'submit',
      handleSendMessage
    );


  /*
   * Search
   */
  $('#mapSearchButton')
    ?.addEventListener(
      'click',
      () => renderAllViews()
    );


  $('#mapSearch')
    ?.addEventListener(
      'keydown',
      (event) => {

        if (event.key === 'Enter') {
          event.preventDefault();

          renderAllViews();
        }

      }
    );


  /*
   * Rating
   */
  $('#minRatingFilter')
    ?.addEventListener(
      'change',
      async (event) => {

        try {
          state.data.tutors =
            await searchTutors(
              '',
              Number(
                event.target.value
              ) || 0
            );

          clearApiError(
            'explore'
          );

        } catch (error) {
          recordApiError(
            'explore',
            error
          );
        }

        renderAllViews();
      }
    );


  /*
   * Reset filters
   */
  $('[data-reset-filter]')
    ?.addEventListener(
      'click',
      async () => {

        const search =
          $('#mapSearch');

        if (search) {
          search.value = '';
        }

        const rating =
          $('#minRatingFilter');

        if (rating) {
          rating.value = '0';
        }

        try {
          state.data.tutors =
            await searchTutors();

          clearApiError(
            'explore'
          );

        } catch (error) {
          recordApiError(
            'explore',
            error
          );
        }

        renderAllViews();
      }
    );
}


/* =========================================================
   MESSAGES ACTIONS
========================================================= */

async function selectConversation(
  conversationId
) {
  state.selectedConversationId =
    conversationId;

  state.data.currentChatPartner =
    state.data.conversations.find(
      (conversation) =>
        String(
          conversation.id
        ) === String(conversationId)
    ) || null;

  state.data.messages = [];

  if (
    !state.data.currentChatPartner
  ) {
    renderAllViews();
    return;
  }

  try {

    state.data.messages =
      await getMessages(
        state.data.currentChatPartner.id
      );

    const currentUserId =
      String(
        state.currentUser?.id ||
        state.currentUser?._id ||
        ''
      );

    const unread =
      state.data.messages.filter(
        (message) => {

          const receiverId =
            message.receiverId?._id ||
            message.receiverId;

          return (
            !message.read &&
            String(receiverId) ===
              currentUserId
          );
        }
      );

    for (const message of unread) {

      const id =
        message._id ||
        message.id;

      if (!id) {
        continue;
      }

      try {
        await markMessageRead(id);
      } catch {
        // Không chặn việc hiển thị tin nhắn.
      }

    }

  } catch (error) {

    recordApiError(
      'messages',
      error
    );

  }

  renderAllViews();
}

async function handleSendMessage(
  event
) {
  event.preventDefault();

  const input =
    $('#messageInput');

  const content =
    input?.value.trim();

  const partner =
    state.data.currentChatPartner;

  if (!content || !partner?.id) {
    return;
  }

  try {

    await sendMessage(
      partner.id,
      content
    );

    input.value = '';

    state.data.messages =
      await getMessages(
        partner.id
      );

    renderAllViews();

  } catch (error) {

    showToast(
      `Gửi tin nhắn thất bại: ${error.message}`
    );

  }
}


/* =========================================================
   MODALS
========================================================= */

function parseGrade(subject) {
  const match =
    String(subject || '')
      .match(
        /(?:lớp|khối)\s*(\d{1,2})/i
      );

  return match
    ? match[1]
    : '';
}

function toIsoFromDateTimeLocal(
  value
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      'Thời gian không hợp lệ.'
    );
  }

  return date.toISOString();
}

function modalTemplate(
  type,
  data = {}
) {

  if (type === 'booking') {
    return `
      <h2>
        Đặt lịch học
        ${
          state.selectedTutor
            ? `· ${escapeHtml(
                state.selectedTutor
              )}`
            : ''
        }
      </h2>

      <p>
        Dữ liệu sẽ gửi trực tiếp tới
        POST /appointments.
      </p>

      <div class="form-group">
        <label>
          Môn học
        </label>

        <input
          id="bookingSubject"
          placeholder="Ví dụ: Toán 12"
        />
      </div>

      <div class="form-group">
        <label>
          Bắt đầu
        </label>

        <input
          id="bookingStart"
          type="datetime-local"
        />
      </div>

      <div class="form-group">
        <label>
          Kết thúc
        </label>

        <input
          id="bookingEnd"
          type="datetime-local"
        />
      </div>

      <div class="form-group">
        <label>
          Ghi chú
        </label>

        <textarea
          id="bookingNotes"
          placeholder="Ghi chú..."
        ></textarea>
      </div>

      <div class="modal-actions">

        <button
          class="cancel-button"
          data-close
        >
          Hủy
        </button>

        <button
          class="primary-button"
          id="submitBookingBtn"
        >
          Gửi API
        </button>

      </div>
    `;
  }


  if (type === 'post-request') {
    return `
      <h2>
        Đăng nhu cầu học
      </h2>

      <p>
        Dữ liệu gửi tới
        POST /tutor-requests.
      </p>

      <div class="form-group">
        <label>
          Môn học
        </label>

        <input
          id="reqSubject"
          placeholder="Ví dụ: Toán"
        />
      </div>

      <div class="form-group">
        <label>
          Khối lớp
        </label>

        <input
          id="reqGrade"
          placeholder="12"
        />
      </div>

      <div class="form-group">
        <label>
          Ngân sách
        </label>

        <input
          id="reqBudget"
          type="number"
          min="0"
        />
      </div>

      <div class="form-group">
        <label>
          Mô tả
        </label>

        <textarea
          id="reqDesc"
          placeholder="Nhu cầu học..."
        ></textarea>
      </div>

      <div class="modal-actions">

        <button
          class="cancel-button"
          data-close
        >
          Hủy
        </button>

        <button
          class="primary-button"
          id="submitPostReqBtn"
        >
          Gửi API
        </button>

      </div>
    `;
  }


  if (type === 'event') {
    const id =
      data._id ||
      data.id;

    return `
      <h2>
        Chi tiết lịch
      </h2>

      <p>
        <b>
          ${escapeHtml(
            data.subject ||
              'Buổi học'
          )}
        </b>
      </p>

      <p>
        Bắt đầu:
        ${formatDateTime(
          data.startTime
        )}
      </p>

      <p>
        Kết thúc:
        ${formatDateTime(
          data.endTime
        )}
      </p>

      <p>
        Trạng thái:
        ${escapeHtml(
          formatStatus(
            data.status
          )
        )}
      </p>

      <div class="modal-actions">

        <button
          class="cancel-button"
          data-close
        >
          Đóng
        </button>

        ${
          id
            ? `
              <button
                class="primary-button"
                id="completeAppointmentBtn"
                data-id="${escapeHtml(
                  id
                )}"
              >
                Đánh dấu hoàn thành
              </button>
            `
            : ''
        }

      </div>
    `;
  }


  if (type === 'review') {
    return `
      <h2>
        Duyệt gia sư
      </h2>

      <p>
        Hành động gọi:
        PUT /admin/users/:id/verify
      </p>

      <div class="modal-actions">

        <button
          class="cancel-button"
          data-close
        >
          Hủy
        </button>

        <button
          class="primary-button"
          id="confirmVerifyTutorBtn"
          data-user-id="${escapeHtml(
            data.userId || ''
          )}"
        >
          Duyệt
        </button>

      </div>
    `;
  }


  return `
    <h2>
      ${escapeHtml(
        data.feature ||
          'Tính năng'
      )}
    </h2>

    <p>
      Tính năng này chưa có endpoint
      trong backend hiện tại.
    </p>

    <div class="modal-actions">
      <button
        class="cancel-button"
        data-close
      >
        Đóng
      </button>
    </div>
  `;
}

function openModal(
  type,
  data = {}
) {
  const modalContent =
    $('#modalContent');

  const modalBackdrop =
    $('#modalBackdrop');

  if (modalContent) {
    modalContent.innerHTML =
      modalTemplate(
        type,
        data
      );
  }

  modalBackdrop?.classList.add(
    'open'
  );

  modalBackdrop?.setAttribute(
    'aria-hidden',
    'false'
  );

  $('[data-close]')
    ?.addEventListener(
      'click',
      closeModal
    );


  /*
   * Booking
   */
  $('#submitBookingBtn')
    ?.addEventListener(
      'click',
      async () => {

        const tutorId =
          state.selectedTutorId;

        const subject =
          $('#bookingSubject')
            ?.value.trim();

        const start =
          $('#bookingStart')
            ?.value;

        const end =
          $('#bookingEnd')
            ?.value;

        const notes =
          $('#bookingNotes')
            ?.value.trim() ||
          '';

        if (!tutorId) {
          showToast(
            'Chưa có tutorId từ API.'
          );

          return;
        }

        if (
          !subject ||
          !start ||
          !end
        ) {
          showToast(
            'Vui lòng nhập đủ dữ liệu.'
          );

          return;
        }

        if (
          new Date(end) <=
          new Date(start)
        ) {
          showToast(
            'Thời gian kết thúc phải sau thời gian bắt đầu.'
          );

          return;
        }

        try {

          await createAppointment(
            tutorId,
            subject,
            toIsoFromDateTimeLocal(
              start
            ),
            toIsoFromDateTimeLocal(
              end
            ),
            notes
          );

          closeModal();

          showToast(
            'Tạo lịch thành công.'
          );

          await fetchViewData();

          renderAllViews();

        } catch (error) {

          showToast(
            `Tạo lịch thất bại: ${error.message}`
          );

        }
      }
    );


  /*
   * Tutor request
   */
  $('#submitPostReqBtn')
    ?.addEventListener(
      'click',
      async () => {

        const subject =
          $('#reqSubject')
            ?.value.trim();

        const grade =
          $('#reqGrade')
            ?.value.trim() ||
          parseGrade(
            subject
          );

        const budget =
          Number(
            $('#reqBudget')
              ?.value || 0
          );

        const description =
          $('#reqDesc')
            ?.value.trim() ||
          '';

        if (
          !subject ||
          !grade ||
          !budget
        ) {
          showToast(
            'Vui lòng nhập đủ thông tin.'
          );

          return;
        }

        try {

          await createTutorRequest(
            subject,
            grade,
            description,
            budget
          );

          closeModal();

          showToast(
            'Đã tạo yêu cầu học.'
          );

          await fetchViewData();

          renderAllViews();

        } catch (error) {

          showToast(
            `Tạo yêu cầu thất bại: ${error.message}`
          );

        }
      }
    );


  /*
   * Verify tutor
   */
  $('#confirmVerifyTutorBtn')
    ?.addEventListener(
      'click',
      async (event) => {

        const userId =
          event.currentTarget
            .dataset.userId;

        if (!userId) {
          showToast(
            'Không có userId.'
          );

          return;
        }

        try {

          await verifyTutor(
            userId
          );

          closeModal();

          showToast(
            'Đã xác minh gia sư.'
          );

          await fetchViewData();

          renderAllViews();

        } catch (error) {

          showToast(
            `Xác minh thất bại: ${error.message}`
          );

        }
      }
    );


  /*
   * Complete appointment
   */
  $('#completeAppointmentBtn')
    ?.addEventListener(
      'click',
      async (event) => {

        const id =
          event.currentTarget
            .dataset.id;

        try {

          await updateAppointment(
            id,
            'completed'
          );

          closeModal();

          showToast(
            'Đã hoàn thành buổi học.'
          );

          await fetchViewData();

          renderAllViews();

        } catch (error) {

          showToast(
            `Cập nhật thất bại: ${error.message}`
          );

        }
      }
    );
}

function closeModal() {
  const modal =
    $('#modalBackdrop');

  if (!modal) {
    return;
  }

  modal.classList.remove(
    'open'
  );

  modal.setAttribute(
    'aria-hidden',
    'true'
  );
}


/* =========================================================
   AUTH UI
========================================================= */

async function startLogin(
  email,
  password
) {
  if (!email || !password) {
    showToast(
      'Vui lòng nhập email và mật khẩu.'
    );

    return;
  }

  try {

    const user =
      await login(
        email,
        password
      );

    if (!user?.role) {
      throw new Error(
        'Backend không trả về role.'
      );
    }

    state.currentUser =
      user;

    state.role =
      user.role;

    showAuthScreen(
      false
    );

    applyIdentity();

    renderNav();

    await fetchViewData();

    renderAllViews();

    navigateWithoutFetch(
      'dashboard'
    );

    showToast(
      `Đăng nhập thành công: ${
        user.name ||
        user.email
      }`
    );

  } catch (error) {

    clearToken();

    state.currentUser =
      null;

    showToast(
      `Đăng nhập thất bại: ${error.message}`
    );
  }
}

$('#loginForm')
  ?.addEventListener(
    'submit',
    async (event) => {

      event.preventDefault();

      const email =
        $('#loginForm input[type="text"]')
          ?.value.trim() ||
        '';

      const password =
        $('#loginForm input[type="password"]')
          ?.value ||
        '';

      await startLogin(
        email,
        password
      );
    }
  );


/* =========================================================
   ROLE MENU
========================================================= */

$('#roleMenuButton')
  ?.addEventListener(
    'click',
    () => {

      const menu =
        $('#roleMenu');

      if (!menu) {
        return;
      }

      menu.classList.toggle(
        'open'
      );

      $('#roleMenuButton')
        ?.setAttribute(
          'aria-expanded',
          menu.classList.contains(
            'open'
          )
            ? 'true'
            : 'false'
        );
    }
  );

$$('#roleMenu button')
  .forEach(
    (button) => {

      button.addEventListener(
        'click',
        async () => {

          const role =
            button.dataset.role;

          if (
            !state.currentUser
          ) {
            showToast(
              'Hãy đăng nhập trước.'
            );

            return;
          }

          if (
            role !==
            state.currentUser.role
          ) {
            showToast(
              `Tài khoản hiện tại là ${
                state.currentUser.role
              }. Không thể đổi role giả lập.`
            );

            return;
          }

          state.role =
            role;

          state.currentView =
            'dashboard';

          applyIdentity();

          renderNav();

          await fetchViewData();

          renderAllViews();

          navigateWithoutFetch(
            'dashboard'
          );
        }
      );

    }
  );


/* =========================================================
   OTHER GLOBAL EVENTS
========================================================= */

$('#mobileMenu')
  ?.addEventListener(
    'click',
    () =>
      $('.sidebar')
        ?.classList.toggle(
          'open'
        )
  );

$('#closeModal')
  ?.addEventListener(
    'click',
    closeModal
  );

$('#modalBackdrop')
  ?.addEventListener(
    'click',
    (event) => {
      if (
        event.target ===
        $('#modalBackdrop')
      ) {
        closeModal();
      }
    }
  );

$('#searchBtn')
  ?.addEventListener(
    'click',
    async () => {

      await navigate(
        'explore'
      );

      setTimeout(
        () =>
          $('#mapSearch')
            ?.focus(),
        50
      );
    }
  );

$('#helpBtn')
  ?.addEventListener(
    'click',
    () =>
      openModal(
        'unsupported',
        {
          feature:
            'Trung tâm hỗ trợ'
        }
      )
  );

$('#notificationBtn')
  ?.addEventListener(
    'click',
    () =>
      showToast(
        'Backend hiện chưa có Notification API.'
      )
  );

$('#profileBtn')
  ?.addEventListener(
    'click',
    () =>
      openModal(
        'unsupported',
        {
          feature:
            'Hồ sơ cá nhân'
        }
      )
  );

document.addEventListener(
  'keydown',
  (event) => {

    if (
      event.key === 'Escape'
    ) {
      closeModal();
    }

  }
);


/* =========================================================
   BOOTSTRAP
========================================================= */

async function bootstrap() {
  loadCurrentUser();

  const token =
    getToken();

  /*
   * Không có token:
   * -> bắt buộc login thật.
   */
  if (
    !token ||
    !state.currentUser
  ) {
    showAuthScreen(
      true
    );

    renderNav();
    renderAllViews();

    return;
  }


  /*
   * Có token:
   * -> dùng user lưu trong localStorage,
   * -> gọi API protected.
   */
  state.role =
    state.currentUser.role ||
    'student';

  showAuthScreen(
    false
  );

  applyIdentity();

  renderNav();

  await fetchViewData();

  renderAllViews();

  navigateWithoutFetch(
    'dashboard'
  );
}

bootstrap();


/* =========================================================
   EXPORT FOR TESTING
========================================================= */

if (
  typeof module !==
  'undefined' &&
  module.exports
) {
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

    getTutorRequests,
    createTutorRequest,
    updateTutorRequest,

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
    getAdminStats
  };
}