// API Configuration
const API_BASE = '/api';
const API = {
    auth: `${API_BASE}/auth`,
    categories: `${API_BASE}/categories`,
    tasks: `${API_BASE}/tasks`,
    users: `${API_BASE}/users`,
    tags: `${API_BASE}/tags`,
    activity: `${API_BASE}/activity`
};

// State
let token = localStorage.getItem('token');
let currentUser = null;
let categories = [];
let tasks = [];
let tags = [];
let selectedCategory = 'all';
let users = [];
let viewingUserId = null;

// ==================== DOM ELEMENTS ====================

const el = {
    // Auth
    authBtn: document.getElementById('authBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    userInfo: document.getElementById('userInfo'),
    userName: document.getElementById('userName'),
    userRole: document.getElementById('userRole'),
    authModal: document.getElementById('authModal'),
    authAlert: document.getElementById('authAlert'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    tabs: document.querySelectorAll('.tab'),

    // Categories
    categoryList: document.getElementById('categoryList'),
    addCategoryCard: document.getElementById('addCategoryCard'),
    categoryForm: document.getElementById('categoryForm'),

    // Task Modal
    taskModal: document.getElementById('taskModal'),
    taskModalTitle: document.getElementById('taskModalTitle'),
    taskForm: document.getElementById('taskForm'),
    taskCategory: document.getElementById('taskCategory'),
    taskSubmitBtn: document.getElementById('taskSubmitBtn'),
    editTaskId: document.getElementById('editTaskId'),
    taskDueDate: document.getElementById('taskDueDate'),
    fabAddTask: document.getElementById('fabAddTask'),

    // Task List
    taskList: document.getElementById('taskList'),

    // Toolbar
    sidebar: document.getElementById('sidebar'),
    toolbar: document.getElementById('toolbar'),
    appGrid: document.getElementById('appGrid'),
    landingPage: document.getElementById('landingPage'),
    searchInput: document.getElementById('searchInput'),
    filterPriority: document.getElementById('filterPriority'),
    filterStatus: document.getElementById('filterStatus'),
    sortBy: document.getElementById('sortBy'),

    // Stats
    statsBar: document.getElementById('statsBar'),

    // Admin Panel
    adminPanel: document.getElementById('adminPanel'),
    userSelect: document.getElementById('userSelect'),
    selectedUserInfo: document.getElementById('selectedUserInfo'),
    selectedUserName: document.getElementById('selectedUserName'),
    backToMyTasks: document.getElementById('backToMyTasks'),

    // Toast & Loading
    toastContainer: document.getElementById('toastContainer'),
    loadingOverlay: document.getElementById('loadingOverlay')
};

// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = 'success') {
    const icons = { success: '✅', error: '❌', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    el.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ==================== LOADING ====================

let loadingCount = 0;
function showLoading() {
    loadingCount++;
    el.loadingOverlay.classList.add('active');
}
function hideLoading() {
    loadingCount = Math.max(0, loadingCount - 1);
    if (loadingCount === 0) el.loadingOverlay.classList.remove('active');
}

// ==================== INIT ====================

document.addEventListener('DOMContentLoaded', init);

async function init() {
    setupEventListeners();
    await checkAuth();
    await fetchCategories();
    if (token) await fetchTasks();
    else renderTasks();
}

function setupEventListeners() {
    el.authBtn.addEventListener('click', openAuthModal);
    el.logoutBtn.addEventListener('click', logout);
    el.loginForm.addEventListener('submit', handleLogin);
    el.registerForm.addEventListener('submit', handleRegister);
    el.tabs.forEach(tab => tab.addEventListener('click', switchTab));
    el.authModal.addEventListener('click', e => { if (e.target === el.authModal) closeAuthModal(); });

    el.categoryForm.addEventListener('submit', handleAddCategory);
    el.taskForm.addEventListener('submit', handleTaskSubmit);
    el.taskModal.addEventListener('click', e => { if (e.target === el.taskModal) closeTaskModal(); });
    el.fabAddTask.addEventListener('click', openAddTaskModal);

    el.searchInput.addEventListener('input', renderTasks);
    el.filterPriority.addEventListener('change', renderTasks);
    el.filterStatus.addEventListener('change', renderTasks);
    el.sortBy.addEventListener('change', renderTasks);

    if (el.userSelect) el.userSelect.addEventListener('change', handleUserSelect);
    if (el.backToMyTasks) el.backToMyTasks.addEventListener('click', backToMyTasks);
}

// ==================== AUTH ====================

async function checkAuth() {
    if (!token) { updateUIForGuest(); return; }
    try {
        const res = await fetch(`${API.auth}/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            currentUser = data.data;
            updateUIForUser();
        } else { logout(); }
    } catch (err) { console.error('Auth check failed:', err); logout(); }
}

function updateUIForUser() {
    el.authBtn.classList.add('hidden');
    el.logoutBtn.classList.remove('hidden');
    el.userInfo.classList.remove('hidden');
    el.userName.textContent = currentUser.username;
    el.userRole.textContent = currentUser.role;
    el.userRole.className = `role-badge ${currentUser.role}`;
    el.addCategoryCard.classList.remove('hidden');
    el.fabAddTask.classList.remove('hidden');
    el.sidebar.classList.remove('hidden');
    el.toolbar.classList.remove('hidden');
    el.appGrid.classList.remove('hidden');
    el.landingPage.classList.add('hidden');

    if (currentUser.role === 'admin') {
        el.adminPanel.classList.remove('hidden');
        fetchUsers();
    } else {
        el.adminPanel.classList.add('hidden');
    }
}

function updateUIForGuest() {
    el.authBtn.classList.remove('hidden');
    el.logoutBtn.classList.add('hidden');
    el.userInfo.classList.add('hidden');
    el.addCategoryCard.classList.add('hidden');
    el.fabAddTask.classList.add('hidden');
    el.sidebar.classList.add('hidden');
    el.toolbar.classList.add('hidden');
    el.appGrid.classList.add('hidden');
    el.landingPage.classList.remove('hidden');
    el.adminPanel.classList.add('hidden');
    el.selectedUserInfo.classList.add('hidden');
    el.statsBar.classList.add('hidden');
    currentUser = null;
    users = [];
    viewingUserId = null;
}

function openAuthModal() {
    el.authModal.classList.add('active');
    el.authAlert.classList.add('hidden');
}

function closeAuthModal() {
    el.authModal.classList.remove('active');
    el.loginForm.reset();
    el.registerForm.reset();
    el.authAlert.classList.add('hidden');
}
window.closeAuthModal = closeAuthModal;

function switchTab(e) {
    const tab = e.target.dataset.tab;
    el.tabs.forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    el.loginForm.classList.toggle('hidden', tab !== 'login');
    el.registerForm.classList.toggle('hidden', tab !== 'register');
    el.authAlert.classList.add('hidden');
}

function showAuthAlert(message, type = 'error') {
    el.authAlert.textContent = message;
    el.authAlert.className = `alert ${type}`;
    el.authAlert.classList.remove('hidden');
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    showLoading();
    try {
        const res = await fetch(`${API.auth}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            currentUser = data.user;
            closeAuthModal();
            updateUIForUser();
            await fetchTasks();
            showToast(`Welcome back, ${currentUser.username}!`);
        } else {
            showAuthAlert(data.error || 'Login failed');
        }
    } catch (err) {
        showAuthAlert(`Network error: ${err.message}`);
    } finally { hideLoading(); }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    showLoading();
    try {
        const res = await fetch(`${API.auth}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (res.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            currentUser = data.user;
            closeAuthModal();
            updateUIForUser();
            await fetchTasks();
            showToast(`Welcome, ${currentUser.username}!`);
        } else {
            showAuthAlert(Array.isArray(data.error) ? data.error.join(', ') : data.error);
        }
    } catch (err) {
        showAuthAlert(`Network error: ${err.message}`);
    } finally { hideLoading(); }
}

function logout() {
    token = null;
    localStorage.removeItem('token');
    currentUser = null;
    tasks = [];
    selectedCategory = 'all';
    updateUIForGuest();
    renderTasks();
    renderCategories();
}

// ==================== CATEGORIES ====================

async function fetchCategories() {
    try {
        const res = await fetch(API.categories);
        const data = await res.json();
        if (res.ok) {
            categories = data.data;
            renderCategories();
            updateCategoryDropdown();
        }
    } catch (err) { console.error('Error fetching categories:', err); }
}

function renderCategories() {
    const allItem = `
        <li class="category-item ${selectedCategory === 'all' ? 'active' : ''}" onclick="selectCategory('all')">
            <span class="category-name">📋 All Tasks</span>
            <span class="category-count">${tasks.length}</span>
        </li>`;

    const items = categories.map(cat => {
        const count = tasks.filter(t => t.category && t.category._id === cat._id).length;
        const canDel = currentUser;
        return `
        <li class="category-item ${selectedCategory === cat._id ? 'active' : ''}" onclick="selectCategory('${cat._id}')">
            <span class="category-name">📁 ${esc(cat.name)}</span>
            <span style="display:flex;align-items:center;gap:0.4rem;">
                <span class="category-count">${count}</span>
                ${canDel ? `<button class="btn-danger" style="padding:0.15rem 0.35rem;font-size:0.65rem;" onclick="event.stopPropagation();deleteCategory('${cat._id}')" title="Delete">🗑️</button>` : ''}
            </span>
        </li>`;
    }).join('');

    el.categoryList.innerHTML = allItem + items;
}

function updateCategoryDropdown() {
    el.taskCategory.innerHTML = '<option value="">Select a category</option>' +
        categories.map(c => `<option value="${c._id}">${esc(c.name)}</option>`).join('');
}

function selectCategory(id) {
    selectedCategory = id;
    renderCategories();
    renderTasks();
}
window.selectCategory = selectCategory;

async function handleAddCategory(e) {
    e.preventDefault();
    const name = document.getElementById('categoryName').value;
    const description = document.getElementById('categoryDesc').value;

    showLoading();
    try {
        const res = await fetch(API.categories, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name, description })
        });
        const data = await res.json();
        if (res.ok) {
            el.categoryForm.reset();
            await fetchCategories();
            showToast(`Category "${name}" created!`);
        } else {
            showToast(Array.isArray(data.error) ? data.error.join(', ') : data.error, 'error');
        }
    } catch (err) { showToast('Error adding category', 'error'); }
    finally { hideLoading(); }
}

async function deleteCategory(id) {
    if (!confirm('Delete this category and all its tasks?')) return;
    showLoading();
    try {
        const res = await fetch(`${API.categories}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            if (selectedCategory === id) selectedCategory = 'all';
            await fetchCategories();
            await fetchTasks();
            showToast('Category deleted');
        } else { showToast('Failed to delete category', 'error'); }
    } catch (err) { showToast('Error deleting category', 'error'); }
    finally { hideLoading(); }
}
window.deleteCategory = deleteCategory;

// ==================== ADMIN ====================

async function fetchUsers() {
    if (!token || currentUser?.role !== 'admin') return;
    try {
        const res = await fetch(API.users, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            users = data.data;
            renderUserSelect();
        }
    } catch (err) { console.error('Error fetching users:', err); }
}

function renderUserSelect() {
    el.userSelect.innerHTML =
        '<option value="">-- My Tasks --</option>' +
        '<option value="all">-- ALL TASKS (Admin) --</option>' +
        users.map(u => `<option value="${u._id}">${esc(u.username)} (${u.role})</option>`).join('');
}

function handleUserSelect(e) {
    const val = e.target.value;
    if (val === 'all') {
        viewingUserId = 'all';
        el.selectedUserName.textContent = 'All Users';
        el.selectedUserInfo.classList.remove('hidden');
    } else if (val) {
        viewingUserId = val;
        const u = users.find(x => x._id === val);
        el.selectedUserName.textContent = u ? u.username : 'Unknown';
        el.selectedUserInfo.classList.remove('hidden');
    } else {
        viewingUserId = null;
        el.selectedUserInfo.classList.add('hidden');
    }
    fetchTasks();
}

function backToMyTasks() {
    viewingUserId = null;
    el.userSelect.value = '';
    el.selectedUserInfo.classList.add('hidden');
    fetchTasks();
}

// ==================== TASK MODAL ====================

function openAddTaskModal() {
    el.editTaskId.value = '';
    el.taskForm.reset();
    el.taskModalTitle.textContent = '✨ Add New Task';
    el.taskSubmitBtn.textContent = 'Add Task';
    el.taskModal.classList.add('active');
}

function openEditTaskModal(id) {
    const task = tasks.find(t => t._id === id);
    if (!task) return;

    el.editTaskId.value = task._id;
    document.getElementById('taskName').value = task.name;
    document.getElementById('taskDesc').value = task.description || '';
    el.taskCategory.value = task.category ? task.category._id : '';
    document.getElementById('taskPriority').value = task.priority;
    el.taskDueDate.value = task.dueDate ? task.dueDate.split('T')[0] : '';

    el.taskModalTitle.textContent = '✏️ Edit Task';
    el.taskSubmitBtn.textContent = 'Save Changes';
    el.taskModal.classList.add('active');
}
window.openEditTaskModal = openEditTaskModal;

function closeTaskModal() {
    el.taskModal.classList.remove('active');
    el.taskForm.reset();
    el.editTaskId.value = '';
}
window.closeTaskModal = closeTaskModal;

// ==================== TASKS ====================

async function fetchTasks() {
    if (!token) { tasks = []; renderCategories(); renderTasks(); return; }
    showLoading();
    try {
        let url;
        const headers = { 'Authorization': `Bearer ${token}` };

        if (currentUser?.role === 'admin') {
            if (viewingUserId === 'all') url = `${API.tasks}?all=true`;
            else if (viewingUserId) url = `${API.users}/${viewingUserId}/tasks`;
            else url = API.tasks;
        } else { url = API.tasks; }

        const res = await fetch(url, { headers });
        if (res.ok) {
            const data = await res.json();
            tasks = data.data;
            renderCategories();
            renderTasks();
            renderStats();
        } else if (res.status === 401) { logout(); }
        else { tasks = []; renderTasks(); }
    } catch (err) { console.error('Error fetching tasks:', err); tasks = []; renderTasks(); }
    finally { hideLoading(); }
}

function renderStats() {
    if (!currentUser || tasks.length === 0) { el.statsBar.classList.add('hidden'); return; }
    const total = tasks.length;
    const done = tasks.filter(t => t.completed).length;
    const pending = total - done;
    const overdue = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
    const high = tasks.filter(t => !t.completed && t.priority === 'high').length;

    el.statsBar.classList.remove('hidden');
    el.statsBar.innerHTML = `
        <div class="stat"><strong>${total}</strong> Total</div>
        <div class="stat"><strong>${done}</strong> Done</div>
        <div class="stat"><strong>${pending}</strong> Pending</div>
        ${high > 0 ? `<div class="stat" style="border-color:var(--danger)"><strong>${high}</strong> High Priority</div>` : ''}
        ${overdue > 0 ? `<div class="stat" style="border-color:var(--danger);color:var(--danger)"><strong>${overdue}</strong> Overdue</div>` : ''}
    `;
}

function renderTasks() {
    if (!currentUser) { el.taskList.innerHTML = ''; return; }

    let filtered = [...tasks];

    // Search
    const search = el.searchInput.value.toLowerCase().trim();
    if (search) {
        filtered = filtered.filter(t =>
            t.name.toLowerCase().includes(search) ||
            (t.description && t.description.toLowerCase().includes(search))
        );
    }

    // Category filter
    if (selectedCategory !== 'all') {
        filtered = filtered.filter(t => t.category && t.category._id === selectedCategory);
    }

    // Priority filter
    const priority = el.filterPriority.value;
    if (priority) filtered = filtered.filter(t => t.priority === priority);

    // Status filter
    const status = el.filterStatus.value;
    if (status !== '') filtered = filtered.filter(t => t.completed === (status === 'true'));

    // Sort
    const sortBy = el.sortBy.value;
    const pw = { high: 3, medium: 2, low: 1 };
    switch (sortBy) {
        case 'newest': filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
        case 'oldest': filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
        case 'priority': filtered.sort((a, b) => (pw[b.priority] || 0) - (pw[a.priority] || 0)); break;
        case 'due-date': filtered.sort((a, b) => {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        }); break;
        case 'name': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
    }

    if (filtered.length === 0) {
        el.taskList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <p>No tasks found</p>
                <p style="font-size:0.875rem;">Click the ＋ button to add a task!</p>
            </div>`;
        return;
    }

    el.taskList.innerHTML = filtered.map(task => {
        const taskUserId = typeof task.user === 'string' ? task.user : task.user?._id;
        const myId = currentUser ? (currentUser.id || currentUser._id) : null;
        const canManage = currentUser && (
            (taskUserId && myId && taskUserId.toString() === myId.toString()) ||
            currentUser.role === 'admin'
        );

        // Due date badge
        let dueBadge = '';
        let isOverdue = false;
        if (task.dueDate) {
            const due = new Date(task.dueDate);
            const diff = Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24));
            const fmt = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            if (!task.completed && diff < 0) { dueBadge = `<span class="badge overdue">⏰ Overdue (${fmt})</span>`; isOverdue = true; }
            else if (!task.completed && diff <= 2) { dueBadge = `<span class="badge due-soon">📅 Due soon (${fmt})</span>`; }
            else { dueBadge = `<span class="badge due-date">📅 ${fmt}</span>`; }
        }

        // Tags
        const tagBadges = (task.tags || []).map(t =>
            `<span class="badge" style="background:${t.color || '#6366f1'};color:white;">🏷️ ${esc(t.name)}</span>`
        ).join('');

        // Owner badge (admin viewing all)
        const ownerBadge = (viewingUserId === 'all' && task.user) ?
            `<span class="badge" style="background:var(--card-border);color:var(--text-secondary)">👤 ${esc(typeof task.user === 'string' ? task.user : task.user.username || 'Unknown')}</span>` : '';

        return `
        <div class="task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
            <div class="task-info">
                <div class="task-title">${esc(task.name)}</div>
                ${task.description ? `<div class="task-desc">${esc(task.description)}</div>` : ''}
                <div class="task-meta">
                    <span class="badge ${task.priority}">${task.priority}</span>
                    <span class="badge ${task.completed ? 'completed' : 'pending'}">${task.completed ? 'Done' : 'Pending'}</span>
                    ${task.category ? `<span class="badge category">${esc(task.category.name)}</span>` : ''}
                    ${dueBadge}
                    ${tagBadges}
                    ${ownerBadge}
                </div>
            </div>
            ${canManage ? `
                <div class="actions">
                    <button class="btn-success" onclick="toggleTask('${task._id}', ${!task.completed})" title="${task.completed ? 'Mark pending' : 'Mark done'}">
                        ${task.completed ? '↩️' : '✓'}
                    </button>
                    <button class="btn-warning" onclick="openEditTaskModal('${task._id}')" title="Edit task">✏️</button>
                    <button class="btn-danger" onclick="deleteTask('${task._id}')" title="Delete task">🗑️</button>
                </div>
            ` : ''}
        </div>`;
    }).join('');
}

// ==================== TASK CRUD ====================

async function handleTaskSubmit(e) {
    e.preventDefault();
    const editId = el.editTaskId.value;
    const body = {
        name: document.getElementById('taskName').value,
        description: document.getElementById('taskDesc').value,
        category: el.taskCategory.value,
        priority: document.getElementById('taskPriority').value,
        dueDate: el.taskDueDate.value || null
    };

    showLoading();
    try {
        const method = editId ? 'PUT' : 'POST';
        const url = editId ? `${API.tasks}/${editId}` : API.tasks;
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (res.ok) {
            closeTaskModal();
            await fetchTasks();
            showToast(editId ? 'Task updated!' : 'Task created!');
        } else {
            showToast(Array.isArray(data.error) ? data.error.join(', ') : data.error, 'error');
        }
    } catch (err) { showToast('Error saving task', 'error'); }
    finally { hideLoading(); }
}

async function toggleTask(id, completed) {
    showLoading();
    try {
        const res = await fetch(`${API.tasks}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ completed })
        });
        if (res.ok) { await fetchTasks(); showToast(completed ? 'Task completed! 🎉' : 'Task reopened'); }
        else { showToast('Failed to update task', 'error'); }
    } catch (err) { showToast('Error updating task', 'error'); }
    finally { hideLoading(); }
}
window.toggleTask = toggleTask;

async function deleteTask(id) {
    // Show a confirmation toast with buttons
    const toast = document.createElement('div');
    toast.className = 'toast toast-warning';
    toast.style.animation = 'slideIn 0.3s ease';
    toast.innerHTML = `
        <span>⚠️ Delete this task?</span>
        <button onclick="confirmDelete('${id}', this)" style="padding:0.3rem 0.8rem;background:var(--danger);color:white;border:none;border-radius:6px;cursor:pointer;font-size:0.8rem;">Yes</button>
        <button onclick="this.closest('.toast').remove()" style="padding:0.3rem 0.8rem;background:var(--card-border);color:var(--text-main);border:none;border-radius:6px;cursor:pointer;font-size:0.8rem;">Cancel</button>
    `;
    el.toastContainer.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 8000);
}
window.deleteTask = deleteTask;

async function confirmDelete(id, btn) {
    btn.closest('.toast').remove();
    showLoading();
    try {
        const res = await fetch(`${API.tasks}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) { await fetchTasks(); showToast('Task deleted'); }
        else { showToast('Failed to delete task', 'error'); }
    } catch (err) { showToast('Error deleting task', 'error'); }
    finally { hideLoading(); }
}
window.confirmDelete = confirmDelete;



function esc(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
