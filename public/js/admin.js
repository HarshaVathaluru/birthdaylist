document.addEventListener('DOMContentLoaded', () => {
  let birthdays = [];
  let circleMessages = [];
  let circleMembers = [];
  let memoriesList = [];
  let currentFilter = 'all';
  let currentSort = 'days_asc';
  let searchTerm = '';

  // Auth State
  let token = localStorage.getItem('zenitude_admin_token');

  // DOM Elements
  const loginView = document.getElementById('login-view');
  const dashboardView = document.getElementById('dashboard-view');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const loginBtn = document.getElementById('login-btn');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const logoutBtn = document.getElementById('logout-btn');
  const adminThemeToggle = document.getElementById('admin-theme-toggle');
  const themeBtnIcon = document.getElementById('theme-btn-icon');
  const adminUserDisplay = document.getElementById('admin-user-display');

  // Sidebar & Topbar
  const sidebar = document.getElementById('sidebar');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  const contentSections = document.querySelectorAll('.content-section');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');
  const searchInput = document.getElementById('search-input');
  const birthdayActionButtons = document.getElementById('birthday-action-buttons');
  const searchContainer = document.getElementById('search-container');

  // Badges & Stats
  const badgeBirthdaysCount = document.getElementById('badge-birthdays-count');
  const badgeMessagesCount = document.getElementById('badge-messages-count');
  const badgeCircleCount = document.getElementById('badge-circle-count');
  const badgeMemoriesCount = document.getElementById('badge-memories-count');
  const totalMemoriesCount = document.getElementById('total-memories-count');
  const memoriesTableBody = document.getElementById('memories-table-body');
  const memoriesEmptyState = document.getElementById('memories-empty-state');
  const statTotal = document.getElementById('stat-total');
  const statUpcoming = document.getElementById('stat-upcoming');
  const statReminders = document.getElementById('stat-reminders');
  const statRecipients = document.getElementById('stat-recipients');

  // Birthday List & Filters
  const birthdaysTableBody = document.getElementById('birthdays-table-body');
  const tableEmptyState = document.getElementById('table-empty-state');
  const filterPills = document.querySelectorAll('.filter-pill');
  const sortSelect = document.getElementById('sort-select');
  const addBirthdayBtn = document.getElementById('add-birthday-btn');
  const emptyAddBtn = document.getElementById('empty-add-btn');

  // Circle Directory
  const circleMemberForm = document.getElementById('circle-member-form');
  const circleTableBody = document.getElementById('circle-table-body');
  const circleEmptyState = document.getElementById('circle-empty-state');
  const saveBatchMembersBtn = document.getElementById('save-batch-members-btn');
  const memberRawText = document.getElementById('member_raw_text');

  // Import / Export
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const importBtn = document.getElementById('import-btn');
  const importModal = document.getElementById('import-modal');
  const importModalClose = document.getElementById('import-modal-close');
  const importCancelBtn = document.getElementById('import-cancel-btn');
  const fileDropzone = document.getElementById('file-dropzone');
  const csvFileInput = document.getElementById('csv-file-input');
  const importText = document.getElementById('import-text');
  const executeImportBtn = document.getElementById('execute-import-btn');

  // Circle Moderation
  const messagesTableBody = document.getElementById('messages-table-body');
  const messagesEmptyState = document.getElementById('messages-empty-state');
  const clearAllMessagesBtn = document.getElementById('clear-all-messages-btn');

  // Settings
  const settingsForm = document.getElementById('settings-form');
  const sendTestEmailBtn = document.getElementById('send-test-email-btn');
  const testEmailTarget = document.getElementById('test-email-target');

  // Birthday Modal
  const birthdayModal = document.getElementById('birthday-modal');
  const birthdayModalClose = document.getElementById('modal-close');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const birthdayForm = document.getElementById('birthday-form');
  const modalTitle = document.getElementById('modal-title');
  const birthdayIdInput = document.getElementById('birthday-id');
  const photoInput = document.getElementById('photo-input');
  const choosePhotoBtn = document.getElementById('choose-photo-btn');
  const removePhotoBtn = document.getElementById('remove-photo-btn');
  const photoPreview = document.getElementById('photo-preview');

  // Vibrant Gradient Palette for Avatars
  const AVATAR_GRADIENTS = [
    'linear-gradient(135deg, #FF6B6B, #FF8E53)',
    'linear-gradient(135deg, #4ECDC4, #2C3E50)',
    'linear-gradient(135deg, #A78BFA, #F472B6)',
    'linear-gradient(135deg, #F59E0B, #EF4444)',
    'linear-gradient(135deg, #10B981, #059669)',
    'linear-gradient(135deg, #6366F1, #8B5CF6)',
    'linear-gradient(135deg, #EC4899, #8B5CF6)',
    'linear-gradient(135deg, #06B6D4, #3B82F6)',
    'linear-gradient(135deg, #F43F5E, #FB7185)',
    'linear-gradient(135deg, #14B8A6, #0D9488)'
  ];

  function getAvatarGradient(name) {
    if (!name) return AVATAR_GRADIENTS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
    return AVATAR_GRADIENTS[index];
  }

  function getInitials(name) {
    if (!name) return '🎂';
    const parts = name.trim().split(' ').filter(n => n.length > 0);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Theme Management
  const savedTheme = localStorage.getItem('zenitude_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (adminThemeToggle) {
    adminThemeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('zenitude_theme', next);
      updateThemeIcon(next);
    });
  }

  function updateThemeIcon(theme) {
    if (themeBtnIcon) themeBtnIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  // Check initial authentication
  if (token) {
    showDashboard();
  } else {
    showLogin();
  }

  // Toggle password visibility
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const passField = document.getElementById('password');
      if (passField.type === 'password') {
        passField.type = 'text';
        togglePasswordBtn.innerHTML = `
          <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        `;
      } else {
        passField.type = 'password';
        togglePasswordBtn.innerHTML = `
          <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        `;
      }
    });
  }

  // Login Form Submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    loginError.classList.add('hidden');
    loginBtn.disabled = true;
    loginBtn.querySelector('.spinner').classList.remove('hidden');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok && data.token) {
        token = data.token;
        localStorage.setItem('zenitude_admin_token', token);
        if (adminUserDisplay) adminUserDisplay.textContent = username;
        showDashboard();
        showToast('Authenticated successfully!', 'success');
      } else {
        loginError.textContent = data.error || 'Invalid credentials.';
        loginError.classList.remove('hidden');
      }
    } catch (err) {
      loginError.textContent = 'Network error. Please try again.';
      loginError.classList.remove('hidden');
    } finally {
      loginBtn.disabled = false;
      loginBtn.querySelector('.spinner').classList.add('hidden');
    }
  });

  // Logout Action
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      token = null;
      localStorage.removeItem('zenitude_admin_token');
      showLogin();
      showToast('Logged out.', 'info');
    });
  }

  // Mobile Sidebar Drawer Toggle & Backdrop Overlay
  let sidebarOverlay = document.getElementById('sidebar-overlay');
  if (!sidebarOverlay) {
    sidebarOverlay = document.createElement('div');
    sidebarOverlay.id = 'sidebar-overlay';
    sidebarOverlay.className = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlay);
  }

  function setSidebarState(open) {
    if (!sidebar) return;
    const shouldOpen = open !== undefined ? open : !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', shouldOpen);
    if (sidebarOverlay) {
      sidebarOverlay.classList.toggle('active', shouldOpen);
    }
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setSidebarState();
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      setSidebarState(false);
    });
  }

  // Sidebar Tab Navigation
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetView = item.dataset.view;
      if (!targetView) return;

      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      contentSections.forEach(section => {
        section.classList.toggle('hidden', section.id !== targetView);
      });

      // Update Topbar
      if (targetView === 'birthdays-section') {
        pageTitle.textContent = 'Birthdays';
        pageSubtitle.textContent = 'Manage celebrations, notifications, and contacts';
        searchContainer.classList.remove('hidden');
        birthdayActionButtons.classList.remove('hidden');
      } else if (targetView === 'circle-section') {
        pageTitle.textContent = 'Auto-Trigger Directory';
        pageSubtitle.textContent = 'Manage circle members who automatically receive celebration emails';
        searchContainer.classList.add('hidden');
        birthdayActionButtons.classList.add('hidden');
        fetchCircleMembers();
      } else if (targetView === 'messages-section') {
        pageTitle.textContent = 'Circle Messages';
        pageSubtitle.textContent = 'Moderate community notes and shared circle wishes';
        searchContainer.classList.add('hidden');
        birthdayActionButtons.classList.add('hidden');
        fetchCircleMessages();
      } else if (targetView === 'memories-section') {
        pageTitle.textContent = 'Workspace Memories';
        pageSubtitle.textContent = 'Review, preview, and moderate team milestone photos and stories';
        searchContainer.classList.add('hidden');
        birthdayActionButtons.classList.add('hidden');
        fetchMemoriesList();
      } else if (targetView === 'settings-section') {
        pageTitle.textContent = 'Email & SMTP';
        pageSubtitle.textContent = 'Outbound mail server configuration and diagnostics';
        searchContainer.classList.add('hidden');
        birthdayActionButtons.classList.add('hidden');
        loadSettings();
      }

      setSidebarState(false);
    });
  });

  function showLogin() {
    if (loginForm) loginForm.reset();
    const u = document.getElementById('username');
    const p = document.getElementById('password');
    if (u) u.value = '';
    if (p) p.value = '';
    loginView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
  }

  function showDashboard() {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    fetchBirthdays();
    fetchCircleMembers();
    fetchCircleMessages();
    fetchMemoriesList();
  }

  // ===== BIRTHDAYS DATA & CRUD =====
  async function fetchBirthdays() {
    try {
      const res = await fetch('/api/birthdays', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        logoutBtn.click();
        return;
      }
      birthdays = await res.json();
      updateStats();
      renderBirthdaysTable();
    } catch (err) {
      showToast('Could not fetch birthdays', 'error');
    }
  }

  function updateStats() {
    const total = birthdays.length;
    const upcoming = birthdays.filter(b => b.days_until >= 0 && b.days_until <= 7).length;
    const activeReminders = birthdays.filter(b => b.reminder_enabled === 1 || b.reminder_enabled === true).length;

    if (statTotal) statTotal.textContent = total;
    if (statUpcoming) statUpcoming.textContent = upcoming;
    if (statReminders) statReminders.textContent = activeReminders;
    if (statRecipients) statRecipients.textContent = circleMembers.length;
    if (badgeBirthdaysCount) badgeBirthdaysCount.textContent = total;
  }

  // Filter Pills & Search
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.dataset.filter;
      renderBirthdaysTable();
    });
  });

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentSort = sortSelect.value;
      renderBirthdaysTable();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchTerm = searchInput.value.toLowerCase().trim();
      renderBirthdaysTable();
    });
  }

  function renderBirthdaysTable() {
    birthdaysTableBody.innerHTML = '';

    // Apply Filter
    let filtered = birthdays.filter(b => {
      const matchesSearch = !searchTerm || 
        b.name.toLowerCase().includes(searchTerm) || 
        b.date.includes(searchTerm);
      if (!matchesSearch) return false;

      if (currentFilter === 'today') return b.days_until === 0;
      if (currentFilter === 'week') return b.days_until >= 0 && b.days_until <= 7;
      if (currentFilter === 'month') {
        const [m] = b.date.split('-').map(Number);
        const currentMonth = new Date().getMonth() + 1;
        return m === currentMonth;
      }
      return true;
    });

    // Apply Sort
    filtered.sort((a, b) => {
      if (currentSort === 'days_asc') return a.days_until - b.days_until;
      if (currentSort === 'name_asc') return a.name.localeCompare(b.name);
      if (currentSort === 'name_desc') return b.name.localeCompare(a.name);
      if (currentSort === 'date_asc') {
        const [am, ad] = a.date.split('-').map(Number);
        const [bm, bd] = b.date.split('-').map(Number);
        return (am * 100 + ad) - (bm * 100 + bd);
      }
      return 0;
    });

    if (filtered.length === 0) {
      tableEmptyState.classList.remove('hidden');
      return;
    }

    tableEmptyState.classList.add('hidden');

    filtered.forEach(bday => {
      const tr = document.createElement('tr');

      // Avatar
      const avatarGrad = getAvatarGradient(bday.name);
      const avatarHtml = bday.photo
        ? `<div class="user-avatar-cell"><img src="${bday.photo}" alt="${bday.name}"></div>`
        : `<div class="user-avatar-cell" style="background: ${avatarGrad};">${getInitials(bday.name)}</div>`;

      // Countdown Badge
      let countdownBadge = '';
      if (bday.days_until === 0) {
        countdownBadge = `<span class="countdown-badge badge-is-today">🎂 Today!</span>`;
      } else if (bday.days_until <= 7) {
        countdownBadge = `<span class="countdown-badge badge-is-soon">⏳ In ${bday.days_until} days</span>`;
      } else {
        countdownBadge = `<span class="countdown-badge badge-is-normal">${bday.days_until} days</span>`;
      }

      // Reminder Status
      const statusBadge = (bday.reminder_enabled === 1 || bday.reminder_enabled === true)
        ? `<span style="color: #10B981; font-weight: 700; font-size: 0.8rem;">● Auto-Alert Active</span>`
        : `<span style="color: #94A3B8; font-size: 0.8rem;">○ Paused</span>`;

      tr.innerHTML = `
        <td style="width: 50px;">${avatarHtml}</td>
        <td>
          <div class="celebrant-name-box">
            <span class="celebrant-name">${escapeHtml(bday.name)}</span>
            ${bday.email ? `<span style="font-size: 0.78rem; color: #EA580C; font-weight: 600; display: block; margin-top: 2px;">✉️ ${escapeHtml(bday.email)}</span>` : ''}
            ${bday.notes ? `<span class="celebrant-notes">${escapeHtml(bday.notes)}</span>` : ''}
          </div>
        </td>
        <td><strong>🗓️ ${formatDate(bday.date)}</strong></td>
        <td>${countdownBadge}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="table-actions">
            <button type="button" class="btn-action-icon btn-edit" title="Edit Celebrant" data-id="${bday.id}">
              ✏️
            </button>
            <button type="button" class="btn-action-icon btn-delete" title="Delete Celebrant" data-id="${bday.id}">
              🗑️
            </button>
          </div>
        </td>
      `;

      // Event Listeners
      tr.querySelector('.btn-edit').addEventListener('click', () => openBirthdayModal(bday));
      tr.querySelector('.btn-delete').addEventListener('click', () => deleteBirthday(bday.id));

      birthdaysTableBody.appendChild(tr);
    });
  }

  // Instant email trigger
  function sendInstantEmail(bday) {
    window.showZenitudeConfirm({
      title: 'Dispatch Email?',
      message: `Dispatch automated celebration email for ${bday.name} to the entire Circle Directory now?`,
      icon: '📨',
      confirmText: 'Dispatch Email',
      confirmColor: 'linear-gradient(135deg, #EA580C, #F59E0B)',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/birthdays/${bday.id}/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
          const data = await res.json();
          if (res.ok) {
            showToast(data.message || 'Celebration email dispatched to circle!', 'success');
          } else {
            showToast(data.error || 'Failed to dispatch email.', 'error');
          }
        } catch (err) {
          showToast('Error connecting to email service.', 'error');
        }
      }
    });
  }

  // Delete Birthday
  function deleteBirthday(id) {
    window.showZenitudeConfirm({
      title: 'Delete Celebrant?',
      message: 'Are you sure you want to delete this celebrant from the workspace?',
      icon: '🗑️',
      confirmText: 'Delete Celebrant',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/birthdays/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            showToast('Birthday deleted.', 'success');
            fetchBirthdays();
          } else {
            showToast('Failed to delete birthday.', 'error');
          }
        } catch (err) {
          showToast('Network error.', 'error');
        }
      }
    });
  }

  // Add / Edit Birthday Modal (Clean & Simple)
  if (addBirthdayBtn) addBirthdayBtn.addEventListener('click', () => openBirthdayModal());
  if (emptyAddBtn) emptyAddBtn.addEventListener('click', () => openBirthdayModal());
  if (birthdayModalClose) birthdayModalClose.addEventListener('click', closeBirthdayModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeBirthdayModal);

  // ============================================================================
  // CUSTOM CELEBRATION CALENDAR PICKER ENGINE (Month & Year Enabled)
  // ============================================================================
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  let calCurrentMonth = new Date().getMonth();
  let calCurrentYear = new Date().getFullYear();
  let calSelectedYear = calCurrentYear;
  let calSelectedMonth = calCurrentMonth;
  let calSelectedDay = new Date().getDate();

  const calTrigger = document.getElementById('date_display');
  const calHiddenInput = document.getElementById('date');
  const calPopover = document.getElementById('celebration-cal-popover');
  const calMonthSelect = document.getElementById('cal-month-select');
  const calYearSelect = document.getElementById('cal-year-select');
  const calDaysGrid = document.getElementById('cal-days-grid');
  const calPrevBtn = document.getElementById('cal-prev-btn');
  const calNextBtn = document.getElementById('cal-next-btn');
  const calTodayBtn = document.getElementById('cal-today-btn');
  const calDoneBtn = document.getElementById('cal-done-btn');

  function populateYearSelect() {
    if (!calYearSelect) return;
    calYearSelect.innerHTML = '';
    const nowY = new Date().getFullYear();
    for (let y = nowY + 5; y >= 1950; y--) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === calCurrentYear) opt.selected = true;
      calYearSelect.appendChild(opt);
    }
  }
  populateYearSelect();

  function setDateSelection(y, m, d) {
    calCurrentYear = y;
    calSelectedYear = y;
    calSelectedMonth = m;
    calSelectedDay = d;
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    if (calHiddenInput) calHiddenInput.value = `${y}-${mm}-${dd}`;
    if (calTrigger) calTrigger.value = `${MONTH_NAMES[m]} ${d}, ${y}`;
  }

  function renderCelebrationCalendar() {
    if (!calDaysGrid) return;

    if (calMonthSelect) calMonthSelect.value = calCurrentMonth;
    if (calYearSelect) calYearSelect.value = calCurrentYear;

    calDaysGrid.innerHTML = '';

    const firstDayIndex = new Date(calCurrentYear, calCurrentMonth, 1).getDay();
    const daysInMonth = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();
    const today = new Date();

    // Empty lead cells
    for (let i = 0; i < firstDayIndex; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'cal-day-cell empty';
      calDaysGrid.appendChild(emptyCell);
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = document.createElement('button');
      dayCell.type = 'button';
      dayCell.className = 'cal-day-cell';
      dayCell.textContent = day;

      const isSelected = (calCurrentYear === calSelectedYear && calCurrentMonth === calSelectedMonth && day === calSelectedDay);
      const isToday = (today.getFullYear() === calCurrentYear && today.getMonth() === calCurrentMonth && today.getDate() === day);

      if (isSelected) dayCell.classList.add('selected');
      if (isToday) dayCell.classList.add('is-today');

      dayCell.addEventListener('click', (e) => {
        e.stopPropagation();
        setDateSelection(calCurrentYear, calCurrentMonth, day);
        renderCelebrationCalendar();
        if (typeof confetti === 'function') {
          confetti({ particleCount: 20, spread: 50, origin: { y: 0.6 } });
        }
        setTimeout(closeCalendarPopover, 160);
      });

      calDaysGrid.appendChild(dayCell);
    }
  }

  function openCalendarPopover() {
    if (!calPopover) return;
    calCurrentMonth = calSelectedMonth;
    calCurrentYear = calSelectedYear;
    renderCelebrationCalendar();
    calPopover.classList.remove('hidden');
    if (calTrigger) calTrigger.classList.add('active');
  }

  function closeCalendarPopover() {
    if (!calPopover) return;
    calPopover.classList.add('hidden');
    if (calTrigger) calTrigger.classList.remove('active');
  }

  if (calTrigger) {
    calTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (calPopover && calPopover.classList.contains('hidden')) {
        openCalendarPopover();
      } else {
        closeCalendarPopover();
      }
    });
  }

  if (calMonthSelect) {
    calMonthSelect.addEventListener('change', (e) => {
      e.stopPropagation();
      calCurrentMonth = parseInt(calMonthSelect.value, 10);
      renderCelebrationCalendar();
    });
  }

  if (calYearSelect) {
    calYearSelect.addEventListener('change', (e) => {
      e.stopPropagation();
      calCurrentYear = parseInt(calYearSelect.value, 10);
      renderCelebrationCalendar();
    });
  }

  if (calPrevBtn) {
    calPrevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (calCurrentMonth === 0) {
        calCurrentMonth = 11;
        calCurrentYear--;
      } else {
        calCurrentMonth--;
      }
      renderCelebrationCalendar();
    });
  }

  if (calNextBtn) {
    calNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (calCurrentMonth === 11) {
        calCurrentMonth = 0;
        calCurrentYear++;
      } else {
        calCurrentMonth++;
      }
      renderCelebrationCalendar();
    });
  }

  if (calTodayBtn) {
    calTodayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const t = new Date();
      setDateSelection(t.getFullYear(), t.getMonth(), t.getDate());
      renderCelebrationCalendar();
      closeCalendarPopover();
    });
  }

  if (calDoneBtn) {
    calDoneBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeCalendarPopover();
    });
  }

  // Click outside to close calendar
  document.addEventListener('click', (e) => {
    if (calPopover && !calPopover.classList.contains('hidden')) {
      if (!calPopover.contains(e.target) && e.target !== calTrigger) {
        closeCalendarPopover();
      }
    }
  });

  function openBirthdayModal(bday = null) {
    birthdayForm.reset();
    photoPreview.innerHTML = '<span>📷</span>';
    removePhotoBtn.classList.add('hidden');
    closeCalendarPopover();

    if (bday) {
      modalTitle.textContent = 'Edit Celebrant';
      birthdayIdInput.value = bday.id;
      document.getElementById('name').value = bday.name || '';
      document.getElementById('email').value = bday.email || '';
      
      // Parse date with year if present
      if (bday.date) {
        const parts = bday.date.split(/[-/.]/).map(Number);
        let y = new Date().getFullYear(), m = 0, d = 1;
        if (parts.length === 3) {
          if (parts[0] > 1000) {
            y = parts[0];
            m = parts[1] - 1;
            d = parts[2];
          } else if (parts[2] > 1000) {
            y = parts[2];
            m = parts[0] - 1;
            d = parts[1];
          }
        } else if (parts.length === 2) {
          m = parts[0] - 1;
          d = parts[1];
        }
        setDateSelection(y, m, d);
      } else {
        const t = new Date();
        setDateSelection(t.getFullYear(), t.getMonth(), t.getDate());
      }
      
      document.getElementById('remind_days_before').value = bday.remind_days_before || 2;
      document.getElementById('notes').value = bday.notes || '';
      document.getElementById('is_active').checked = bday.reminder_enabled === 1 || bday.reminder_enabled === true;

      if (bday.photo) {
        photoPreview.innerHTML = `<img src="${bday.photo}" alt="${bday.name}">`;
        removePhotoBtn.classList.remove('hidden');
      }
    } else {
      modalTitle.textContent = 'Add Celebrant';
      birthdayIdInput.value = '';
      document.getElementById('email').value = '';
      const today = new Date();
      setDateSelection(today.getFullYear(), today.getMonth(), today.getDate());
      document.getElementById('remind_days_before').value = 2;
      document.getElementById('is_active').checked = true;
    }

    birthdayModal.classList.remove('hidden');
  }

  function closeBirthdayModal() {
    closeCalendarPopover();
    birthdayModal.classList.add('hidden');
  }

  // Photo Choose / Remove
  if (choosePhotoBtn) {
    choosePhotoBtn.addEventListener('click', () => photoInput.click());
  }
  if (photoInput) {
    photoInput.addEventListener('change', () => {
      const file = photoInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          photoPreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
          removePhotoBtn.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });
  }
  if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', () => {
      photoInput.value = '';
      photoPreview.innerHTML = '<span>📷</span>';
      removePhotoBtn.classList.add('hidden');
    });
  }

  function normalizeDateInput(str) {
    if (!str) return '';
    const parts = str.trim().split(/[-/.]/).map(Number);
    if (parts.length === 3) {
      let m = parts[1];
      let d = parts[2];
      if (parts[0] > 1000) {
        m = parts[1];
        d = parts[2];
      } else if (parts[2] > 1000) {
        d = parts[0];
        m = parts[1];
      }
      return `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    } else if (parts.length === 2) {
      let m = parts[0];
      let d = parts[1];
      return `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return str.trim();
  }

  // Birthday Form Submit
  birthdayForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = birthdayIdInput.value;
    const isEdit = !!id;

    const rawDate = document.getElementById('date').value.trim();
    const normalizedDate = normalizeDateInput(rawDate);

    const formData = new FormData();
    formData.append('name', document.getElementById('name').value.trim());
    formData.append('email', document.getElementById('email').value.trim());
    formData.append('date', normalizedDate);
    formData.append('remind_days_before', document.getElementById('remind_days_before').value);
    formData.append('notes', document.getElementById('notes').value.trim());
    formData.append('reminder_enabled', document.getElementById('is_active').checked ? '1' : '0');

    if (photoInput.files[0]) {
      formData.append('photo', photoInput.files[0]);
    }

    try {
      const url = isEdit ? `/api/birthdays/${id}` : '/api/birthdays';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        showToast(isEdit ? 'Celebrant updated!' : 'Celebrant added!', 'success');
        closeBirthdayModal();
        fetchBirthdays();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save birthday.', 'error');
      }
    } catch (err) {
      showToast('Network error.', 'error');
    }
  });

  // ===== AUTO-TRIGGER CIRCLE MEMBERS DIRECTORY =====
  async function fetchCircleMembers() {
    try {
      const res = await fetch('/api/circle-members');
      if (res.ok) {
        circleMembers = await res.json();
        if (badgeCircleCount) badgeCircleCount.textContent = circleMembers.length;
        if (statRecipients) statRecipients.textContent = circleMembers.length;
        renderCircleMembersTable();
      }
    } catch (err) {
      console.warn('Could not fetch circle members', err);
    }
  }

  function renderCircleMembersTable() {
    circleTableBody.innerHTML = '';

    if (circleMembers.length === 0) {
      circleEmptyState.classList.remove('hidden');
      return;
    }

    circleEmptyState.classList.add('hidden');

    circleMembers.forEach(member => {
      const tr = document.createElement('tr');
      const avatarGrad = getAvatarGradient(member.name || member.email);

      tr.innerHTML = `
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="user-avatar-cell" style="background: ${avatarGrad}; width: 34px; height: 34px; font-size: 0.75rem;">
              ${getInitials(member.name || member.email)}
            </div>
            <strong>${escapeHtml(member.name || 'Circle Member')}</strong>
          </div>
        </td>
        <td><span style="color: var(--dark-soft); font-weight: 600;">${escapeHtml(member.email)}</span></td>
        <td style="text-align: right;">
          <button type="button" class="btn-action-icon btn-delete" title="Delete Member" data-id="${member.id}">
            🗑️
          </button>
        </td>
      `;

      tr.querySelector('.btn-delete').addEventListener('click', () => {
        window.showZenitudeConfirm({
          title: 'Remove Member?',
          message: `Remove ${member.name || member.email} from circle auto-trigger list?`,
          icon: '🗑️',
          confirmText: 'Remove Member',
          onConfirm: async () => {
            try {
              const res = await fetch(`/api/circle-members/${member.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                showToast('Member removed from directory.', 'success');
                fetchCircleMembers();
              }
            } catch (e) {
              showToast('Error removing member.', 'error');
            }
          }
        });
      });

      circleTableBody.appendChild(tr);
    });
  }

  if (circleMemberForm) {
    circleMemberForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('member_name').value.trim();
      const email = document.getElementById('member_email').value.trim();

      if (!email) return;

      try {
        const res = await fetch('/api/circle-members', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name, email })
        });

        const data = await res.json();
        if (res.ok) {
          showToast('Circle member added!', 'success');
          circleMemberForm.reset();
          fetchCircleMembers();
        } else {
          showToast(data.error || 'Failed to add member.', 'error');
        }
      } catch (e) {
        showToast('Network error.', 'error');
      }
    });
  }

  if (saveBatchMembersBtn) {
    saveBatchMembersBtn.addEventListener('click', async () => {
      const raw = memberRawText.value.trim();
      if (!raw) {
        showToast('Paste member names and emails first.', 'error');
        return;
      }

      try {
        const res = await fetch('/api/circle-members', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ raw_text: raw })
        });

        const data = await res.json();
        if (res.ok) {
          showToast(data.message || 'Circle members ingested!', 'success');
          memberRawText.value = '';
          fetchCircleMembers();
        } else {
          showToast(data.error || 'Failed to ingest members.', 'error');
        }
      } catch (e) {
        showToast('Network error.', 'error');
      }
    });
  }

  // ===== CSV EXPORT & IMPORT =====
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', async () => {
      const activeToken = token || localStorage.getItem('zenitude_admin_token');

      const downloadCsvBlob = (csvString, filename) => {
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (a.parentNode) a.parentNode.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 300);
      };

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `Zenitude_Birthdays_${dateStr}.csv`;

      // 1. Try server endpoint first
      try {
        if (activeToken) {
          const res = await fetch(`/api/birthdays/export/csv?token=${encodeURIComponent(activeToken)}`, {
            headers: { 'Authorization': `Bearer ${activeToken}` }
          });
          if (res.ok) {
            const csvText = await res.text();
            downloadCsvBlob(csvText, filename);
            showToast('CSV Export downloaded successfully!', 'success');
            return;
          }
        }
      } catch (err) {
        console.warn('Server CSV export failed, falling back to local dataset...', err);
      }

      // 2. Resilient Client-side dataset fallback
      try {
        if (birthdays && birthdays.length > 0) {
          const rows = [['Name', 'Email', 'Date', 'AdvanceAlertDays', 'Notes', 'ReminderEnabled']];
          for (const b of birthdays) {
            const escapedName = `"${(b.name || '').replace(/"/g, '""')}"`;
            const escapedEmail = `"${(b.email || '').replace(/"/g, '""')}"`;
            const escapedNotes = `"${(b.notes || '').replace(/"/g, '""')}"`;
            const alertDays = b.remind_days_before || 2;
            rows.push([escapedName, escapedEmail, b.date || '', alertDays, escapedNotes, b.reminder_enabled ?? 1].join(','));
          }
          downloadCsvBlob(rows.join('\n'), filename);
          showToast('CSV Export downloaded successfully!', 'success');
        } else {
          showToast('No birthday records available to export.', 'info');
        }
      } catch (fallbackErr) {
        console.error('CSV export fallback error:', fallbackErr);
        showToast('Error downloading CSV export.', 'error');
      }
    });
  }

  if (importBtn) {
    importBtn.addEventListener('click', () => {
      importText.value = '';
      csvFileInput.value = '';
      importModal.classList.remove('hidden');
    });
  }

  if (importModalClose) importModalClose.addEventListener('click', () => importModal.classList.add('hidden'));
  if (importCancelBtn) importCancelBtn.addEventListener('click', () => importModal.classList.add('hidden'));

  if (fileDropzone) {
    fileDropzone.addEventListener('click', () => csvFileInput.click());
    csvFileInput.addEventListener('change', () => {
      const file = csvFileInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          importText.value = e.target.result;
          showToast(`Loaded ${file.name}`, 'info');
        };
        reader.readAsText(file);
      }
    });
  }

  if (executeImportBtn) {
    executeImportBtn.addEventListener('click', async () => {
      const raw = importText.value.trim();
      if (!raw) {
        showToast('Please paste CSV rows or choose a file first.', 'error');
        return;
      }

      const parsedBirthdays = parseCsvData(raw);
      if (parsedBirthdays.length === 0) {
        showToast('Could not parse any valid rows. Please check format.', 'error');
        return;
      }

      try {
        const res = await fetch('/api/birthdays/bulk-import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ birthdays: parsedBirthdays })
        });

        const data = await res.json();
        if (res.ok) {
          showToast(data.message || 'Import completed!', 'success');
          importModal.classList.add('hidden');
          fetchBirthdays();
        } else {
          showToast(data.error || 'Import failed.', 'error');
        }
      } catch (err) {
        showToast('Network error during import.', 'error');
      }
    });
  }

  function parseCsvData(csvString) {
    const lines = csvString.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (i === 0 && line.toLowerCase().includes('name') && line.toLowerCase().includes('date')) {
        continue;
      }

      const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 2) {
        const name = parts[0];
        let date = parts[1];
        if (date.length === 4 && !date.includes('-')) {
          date = date.substring(0, 2) + '-' + date.substring(2, 4);
        }
        const notes = parts[2] || '';

        if (name && date) {
          parsed.push({ name, date, notes, is_active: 1, remind_days_before: 3 });
        }
      }
    }
    return parsed;
  }

  // ===== CIRCLE CHAT MODERATION =====
  async function fetchCircleMessages() {
    try {
      const res = await fetch('/api/messages');
      if (res.ok) {
        circleMessages = await res.json();
        if (badgeMessagesCount) badgeMessagesCount.textContent = circleMessages.length;
        renderMessagesTable();
      }
    } catch (err) {
      console.warn('Could not fetch circle messages', err);
    }
  }

  function renderMessagesTable() {
    messagesTableBody.innerHTML = '';

    if (circleMessages.length === 0) {
      messagesEmptyState.classList.remove('hidden');
      return;
    }

    messagesEmptyState.classList.add('hidden');
    const sorted = [...circleMessages].reverse();

    sorted.forEach(msg => {
      const tr = document.createElement('tr');
      const timeStr = new Date(msg.created_at).toLocaleString();
      const replyInfo = msg.reply_to_name ? `↩ Replying to @${escapeHtml(msg.reply_to_name)}` : '<span style="color:#94A3B8;">Top-level</span>';

      tr.innerHTML = `
        <td><strong>${escapeHtml(msg.sender_name)}</strong></td>
        <td><div style="max-width: 380px; word-break: break-word;">${escapeHtml(msg.message_text)}</div></td>
        <td><span style="font-size: 0.8rem; color: var(--purple); font-weight: 600;">${replyInfo}</span></td>
        <td><span style="font-size: 0.8rem; color: var(--gray);">⏳ ${timeStr}</span></td>
        <td style="text-align: right;">
          <button type="button" class="btn-action-icon btn-delete" title="Delete Message" data-id="${msg.id}">
            🗑️
          </button>
        </td>
      `;

      tr.querySelector('.btn-delete').addEventListener('click', () => {
        window.showZenitudeConfirm({
          title: 'Delete Message?',
          message: 'Delete this message from circle chat feed?',
          icon: '🗑️',
          confirmText: 'Delete Message',
          onConfirm: async () => {
            try {
              const r = await fetch(`/api/messages/${msg.id}`, { method: 'DELETE' });
              if (r.ok) {
                showToast('Message deleted.', 'success');
                fetchCircleMessages();
              }
            } catch (e) {
              showToast('Error deleting message.', 'error');
            }
          }
        });
      });

      messagesTableBody.appendChild(tr);
    });
  }

  if (clearAllMessagesBtn) {
    clearAllMessagesBtn.addEventListener('click', () => {
      window.showZenitudeConfirm({
        title: 'Clear All Messages?',
        message: 'Are you sure you want to delete ALL active circle chat messages? This cannot be undone.',
        icon: '🧹',
        confirmText: 'Clear All Notes',
        onConfirm: async () => {
          try {
            const res = await fetch('/api/messages', { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) {
              showToast(data.message || 'All messages cleared.', 'success');
              fetchCircleMessages();
            }
          } catch (e) {
            showToast('Error clearing messages.', 'error');
          }
        }
      });
    });
  }

  // ===== WORKSPACE MEMORIES MODERATION =====
  async function fetchMemoriesList() {
    try {
      const res = await fetch('/api/memories');
      if (res.ok) {
        memoriesList = await res.json();
        if (badgeMemoriesCount) badgeMemoriesCount.textContent = memoriesList.length;
        if (totalMemoriesCount) totalMemoriesCount.textContent = `${memoriesList.length} Total`;
        renderMemoriesTable();
      }
    } catch (err) {
      console.warn('Could not fetch memories', err);
    }
  }

  function renderMemoriesTable() {
    if (!memoriesTableBody) return;
    memoriesTableBody.innerHTML = '';

    if (memoriesList.length === 0) {
      if (memoriesEmptyState) memoriesEmptyState.classList.remove('hidden');
      return;
    }

    if (memoriesEmptyState) memoriesEmptyState.classList.add('hidden');

    memoriesList.forEach(m => {
      const tr = document.createElement('tr');
      const photoHtml = m.photo_data 
        ? `<img src="${m.photo_data}" alt="Memory" style="width: 46px; height: 46px; border-radius: 10px; object-fit: cover; border: 1px solid var(--border-color);">` 
        : `<div style="width: 46px; height: 46px; border-radius: 10px; background: rgba(234, 88, 12, 0.1); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">📸</div>`;

      tr.innerHTML = `
        <td>${photoHtml}</td>
        <td>
          <strong>${escapeHtml(m.title)}</strong>
          <div style="font-size: 0.75rem; color: var(--primary); font-weight: 700; margin-top: 2px;">${escapeHtml(m.badge_tag || 'TEAM HIGHLIGHT')}</div>
        </td>
        <td><span class="badge-category" style="padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; background: rgba(78, 205, 196, 0.15); color: #0D9488;">${escapeHtml(m.category || 'celebrations')}</span></td>
        <td>${escapeHtml(m.author_name || 'Circle Member')}</td>
        <td><span style="font-size: 0.8rem; color: var(--gray);">${escapeHtml(m.date_str || 'Today')}</span></td>
        <td><div style="max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.85rem; color: var(--text-muted);">${escapeHtml(m.caption || '')}</div></td>
        <td style="text-align: right;">
          <button type="button" class="btn-action-icon btn-delete" title="Delete Memory" data-id="${m.id}">
            🗑️
          </button>
        </td>
      `;

      tr.querySelector('.btn-delete').addEventListener('click', () => {
        window.showZenitudeConfirm({
          title: 'Delete Memory?',
          message: `Are you sure you want to delete memory "${m.title}"?`,
          icon: '🗑️',
          confirmText: 'Delete Memory',
          onConfirm: async () => {
            try {
              const r = await fetch(`/api/memories/${m.id}`, { method: 'DELETE' });
              if (r.ok) {
                showToast('Memory deleted successfully.', 'success');
                fetchMemoriesList();
              } else {
                showToast('Failed to delete memory.', 'error');
              }
            } catch (e) {
              showToast('Network error deleting memory.', 'error');
            }
          }
        });
      });

      memoriesTableBody.appendChild(tr);
    });
  }

  // Purge Old Memories Button Handler
  const purgeMemoriesSelect = document.getElementById('purge-memories-select');
  const executePurgeMemoriesBtn = document.getElementById('execute-purge-memories-btn');

  if (executePurgeMemoriesBtn && purgeMemoriesSelect) {
    executePurgeMemoriesBtn.addEventListener('click', () => {
      const selectedVal = purgeMemoriesSelect.value;
      const isAll = selectedVal === 'all';
      const promptMsg = isAll 
        ? 'Are you sure you want to permanently delete ALL memories from the workspace? This cannot be undone.' 
        : `Are you sure you want to permanently delete all memories older than ${selectedVal} days?`;

      window.showZenitudeConfirm({
        title: 'Purge Memories?',
        message: promptMsg,
        icon: '🧹',
        confirmText: 'Purge Memories',
        onConfirm: async () => {
          try {
            const endpoint = isAll ? '/api/memories/purge/all' : `/api/memories/purge/older-than?days=${selectedVal}`;
            const res = await fetch(endpoint, { method: 'DELETE' });
            const data = await res.json();

            if (res.ok) {
              showToast(data.message || 'Old memories purged successfully.', 'success');
              fetchMemoriesList();
            } else {
              showToast(data.error || 'Failed to purge memories.', 'error');
            }
          } catch (err) {
            showToast('Network error purging memories.', 'error');
          }
        }
      });
    });
  }

  // Helper for resilient token retrieval across devices & page reloads
  function getActiveToken() {
    return token || localStorage.getItem('zenitude_admin_token') || '';
  }

  // ===== SETTINGS & SMTP DIAGNOSTICS =====
  async function loadSettings() {
    const activeToken = getActiveToken();
    try {
      const res = await fetch(`/api/settings?token=${encodeURIComponent(activeToken)}`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        for (const [key, value] of Object.entries(data)) {
          const input = settingsForm.elements[key];
          if (input) {
            input.value = value;
          }
        }
      }
    } catch (err) {
      console.warn('Could not load email settings:', err);
    }
  }

  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const activeToken = getActiveToken();
    const formData = new FormData(settingsForm);
    const updates = {};
    formData.forEach((val, key) => { updates[key] = val; });

    const saveBtn = document.getElementById('save-settings-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span>Saving...</span>';
    }

    try {
      const res = await fetch(`/api/settings?token=${encodeURIComponent(activeToken)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify(updates)
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showToast(data.message || 'Email & Resend configuration saved successfully!', 'success');
      } else if (res.status === 401 || res.status === 403) {
        showToast('Your session has expired. Please sign in again.', 'error');
        setTimeout(() => logoutBtn && logoutBtn.click(), 1800);
      } else {
        showToast(data.error || 'Failed to save settings.', 'error');
      }
    } catch (err) {
      showToast('Network error saving settings. Please try again.', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span>Save Email Configuration</span>';
      }
    }
  });

  if (sendTestEmailBtn) {
    sendTestEmailBtn.addEventListener('click', async () => {
      const activeToken = getActiveToken();
      const targetEmail = testEmailTarget.value.trim();
      if (!targetEmail) {
        showToast('Enter a recipient email to receive the test message.', 'error');
        return;
      }

      sendTestEmailBtn.disabled = true;
      sendTestEmailBtn.innerHTML = '<span>Sending...</span>';

      try {
        const res = await fetch(`/api/settings/test-email?token=${encodeURIComponent(activeToken)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify({ target_email: targetEmail })
        });

        const data = await res.json();
        if (res.ok) {
          showToast(data.message || 'Test email dispatched successfully!', 'success');
        } else {
          showToast(data.error || 'Failed to dispatch test email.', 'error');
        }
      } catch (err) {
        showToast('Could not connect to SMTP service.', 'error');
      } finally {
        sendTestEmailBtn.disabled = false;
        sendTestEmailBtn.innerHTML = '<span>📨 Dispatch Test Email</span>';
      }
    });
  }

  // Utilities
  function formatDate(dateStr) {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [m, d] = dateStr.split('-');
    const date = new Date(2000, parseInt(m, 10) - 1, parseInt(d, 10));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showToast(message, type = 'info') {
    if (window.showZenitudeNotification) {
      const isSuccess = type === 'success';
      const isError = type === 'error';
      window.showZenitudeNotification({
        title: isSuccess ? 'Success!' : (isError ? 'Notice' : 'Admin Update'),
        message: message,
        icon: isSuccess ? '✨' : (isError ? '⚠️' : '🔔'),
        type: isSuccess ? 'success' : (isError ? 'warning' : 'info')
      });
      return;
    }

    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
});
