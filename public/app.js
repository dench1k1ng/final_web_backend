// API Configuration
const API_BASE = '/api';
const API = {
    auth: `${API_BASE}/auth`,
    categories: `${API_BASE}/categories`,
    tasks: `${API_BASE}/tasks`,
    users: `${API_BASE}/users`
};

// State
let token = localStorage.getItem('token');
let currentUser = null;
let categories = [];
let tasks = [];
let selectedCategory = 'all';
let users = [];
let viewingUserId = null;

// DOM Elements
const elements = {
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

    // Tasks
    addTaskCard: document.getElementById('addTaskCard'),
    taskForm: document.getElementById('taskForm'),
    taskFormTitle: document.getElementById('taskFormTitle'),
    taskCategory: document.getElementById('taskCategory'),
    taskList: document.getElementById('taskList'),
    taskSubmitBtn: document.getElementById('taskSubmitBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    editTaskId: document.getElementById('editTaskId'),
    taskDueDate: document.getElementById('taskDueDate'),

    // Toolbar
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
    elements.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ==================== LOADING ====================

let loadingCount = 0;
function showLoading() {
    loadingCount++;
    elements.loadingOverlay.classList.add('active');
}
function hideLoading() {
    loadingCount = Math.max(0, loadingCount - 1);
    if (loadingCount === 0) {
        elements.loadingOverlay.classList.remove('active');
    }
}

// ==================== INIT ====================

document.addEventListener('DOMContentLoaded', init);

async function init() {
    setupEventListeners();
    await checkAuth();
    await fetchCategories();
    await fetchTasks();
}

function setupEventListeners() {
    // Auth
    elements.authBtn.addEventListener('click', openAuthModal);
    elements.logoutBtn.addEventListener('click', logout);
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);
    elements.tabs.forEach(tab => tab.addEventListener('click', switchTab));
    elements.authModal.addEventListener('click', (e) => {
        if (e.target === elements.authModal) closeAuthModal();
    });

    // Forms
    elements.categoryForm.addEventListener('submit', handleAddCategory);
    elements.taskForm.addEventListener('submit', handleTaskSubmit);

    // Toolbar
    elements.searchInput.addEventListener('input', renderTasks);
    elements.filterPriority.addEventListener('change', renderTasks);
    elements.filterStatus.addEventListener('change', renderTasks);
    elements.sortBy.addEventListener('change', renderTasks);

    // Admin Panel
    if (elements.userSelect) {
        elements.userSelect.addEventListener('change', handleUserSelect);
    }
    if (elements.backToMyTasks) {
        elements.backToMyTasks.addEventListener('click', backToMyTasks);
    }
}

// ==================== AUTH ====================

async function checkAuth() {
    if (!token) {
        updateUIForGuest();
        return;
    }

    try {
        const res = await fetch(`${API.auth}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            currentUser = data.data;
            updateUIForUser();
        } else {
            logout();
        }
    } catch (err) {
        console.error('Auth check failed:', err);
        logout();
    }
}

function updateUIForUser() {
    elements.authBtn.classList.add('hidden');
    elements.logoutBtn.classList.remove('hidden');
    elements.userInfo.classList.remove('hidden');
    elements.userName.textContent = currentUser.username;
    elements.userRole.textContent = currentUser.role;
    elements.userRole.className = `role-badge ${currentUser.role}`;

    elements.addTaskCard.classList.remove('hidden');
    elements.addCategoryCard.classList.remove('hidden');

    if (currentUser.role === 'admin') {
        elements.adminPanel.classList.remove('hidden');
        fetchUsers();
    } else {
        elements.adminPanel.classList.add('hidden');
    }
}

function updateUIForGuest() {
    elements.authBtn.classList.remove('hidden');
    elements.logoutBtn.classList.add('hidden');
    elements.userInfo.classList.add('hidden');
    elements.addCategoryCard.classList.add('hidden');
    elements.addTaskCard.classList.add('hidden');
    elements.adminPanel.classList.add('hidden');
    elements.selectedUserInfo.classList.add('hidden');
    elements.statsBar.classList.add('hidden');
    currentUser = null;
    users = [];
    viewingUserId = null;
}

function openAuthModal() {
    elements.authModal.classList.add('active');
    elements.authAlert.classList.add('hidden');
}

function closeAuthModal() {
    elements.authModal.classList.remove('active');
    elements.loginForm.reset();
    elements.registerForm.reset();
    elements.authAlert.classList.add('hidden');
}
window.closeAuthModal = closeAuthModal;

function switchTab(e) {
    const tab = e.target.dataset.tab;
    elements.tabs.forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');

    if (tab === 'login') {
        elements.loginForm.classList.remove('hidden');
        elements.registerForm.classList.add('hidden');
    } else {
        elements.loginForm.classList.add('hidden');
        elements.registerForm.classList.remove('hidden');
    }
    elements.authAlert.classList.add('hidden');
}

function showAuthAlert(message, type = 'error') {
    elements.authAlert.textContent = message;
    elements.authAlert.className = `alert ${type}`;
    elements.authAlert.classList.remove('hidden');
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
            fetchTasks();
            showToast(`Welcome back, ${currentUser.username}!`);
        } else {
            showAuthAlert(data.error || 'Login failed');
        }
    } catch (err) {
        console.error('Login error:', err);
        showAuthAlert(`Network error: ${err.message}. Is the server running?`);
    } finally {
        hideLoading();
    }
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
            fetchTasks();
            showToast(`Welcome, ${currentUser.username}! Account created.`);
        } else {
            showAuthAlert(Array.isArray(data.error) ? data.error.join(', ') : data.error);
        }
    } catch (err) {
        console.error('Register error:', err);
        showAuthAlert(`Network error: ${err.message}. Is the server running?`);
    } finally {
        hideLoading();
    }
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
    cancelEdit();
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
    } catch (err) {
        console.error('Error fetching categories:', err);
    }
}

function renderCategories() {
    const allTasksItem = `
        <li class="category-item ${selectedCategory === 'all' ? 'active' : ''}" data-id="all" onclick="selectCategory('all')">
            <span class="category-name">📋 All Tasks</span>
            <span class="category-count">${tasks.length}</span>
        </li>
    `;

    const categoryItems = categories.map(cat => {
        const count = tasks.filter(t => t.category && t.category._id === cat._id).length;
        const canDelete = currentUser;
        return `
            <li class="category-item ${selectedCategory === cat._id ? 'active' : ''}" 
                data-id="${cat._id}" onclick="selectCategory('${cat._id}')">
                <span class="category-name">📁 ${escapeHtml(cat.name)}</span>
                <span style="display:flex;align-items:center;gap:0.4rem;">
                    <span class="category-count">${count}</span>
                    ${canDelete ? `<button class="btn-danger" style="padding:0.15rem 0.35rem;font-size:0.65rem;" onclick="event.stopPropagation();deleteCategory('${cat._id}')" title="Delete category">🗑️</button>` : ''}
                </span>
            </li>
        `;
    }).join('');

    elements.categoryList.innerHTML = allTasksItem + categoryItems;
}

function updateCategoryDropdown() {
    elements.taskCategory.innerHTML = '<option value="">Select a category</option>' +
        categories.map(cat => `<option value="${cat._id}">${escapeHtml(cat.name)}</option>`).join('');
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
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, description })
        });

        const data = await res.json();

        if (res.ok) {
            elements.categoryForm.reset();
            await fetchCategories();
            showToast(`Category "${name}" created!`);
        } else {
            showToast(Array.isArray(data.error) ? data.error.join(', ') : data.error, 'error');
        }
    } catch (err) {
        showToast('Error adding category', 'error');
    } finally {
        hideLoading();
    }
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
        } else {
            showToast('Failed to delete category', 'error');
        }
    } catch (err) {
        showToast('Error deleting category', 'error');
    } finally {
        hideLoading();
    }
}
window.deleteCategory = deleteCategory;

// ==================== ADMIN USER MANAGEMENT ====================

async function fetchUsers() {
    if (!token || currentUser?.role !== 'admin') return;

    try {
        const res = await fetch(API.users, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            users = data.data;
            renderUserSelect();
        }
    } catch (err) {
        console.error('Error fetching users:', err);
    }
}

function renderUserSelect() {
    elements.userSelect.innerHTML =
        '<option value="">-- My Tasks --</option>' +
        '<option value="all">-- ALL TASKS (Admin) --</option>' +
        users.map(user => `<option value="${user._id}">${escapeHtml(user.username)} (${user.role})</option>`).join('');
}

function handleUserSelect(e) {
    const userId = e.target.value;

    if (userId === 'all') {
        viewingUserId = 'all';
        elements.selectedUserName.textContent = 'All Users';
        elements.selectedUserInfo.classList.remove('hidden');
    } else if (userId) {
        viewingUserId = userId;
        const selectedUser = users.find(u => u._id === userId);
        elements.selectedUserName.textContent = selectedUser ? selectedUser.username : 'Unknown';
        elements.selectedUserInfo.classList.remove('hidden');
    } else {
        viewingUserId = null;
        elements.selectedUserInfo.classList.add('hidden');
    }

    fetchTasks();
}

function backToMyTasks() {
    viewingUserId = null;
    elements.userSelect.value = '';
    elements.selectedUserInfo.classList.add('hidden');
    fetchTasks();
}

// ==================== TASKS ====================

async function fetchTasks() {
    if (!token) {
        tasks = [];
        renderCategories();
        renderTasks();
        return;
    }

    showLoading();
    try {
        let url;
        const headers = { 'Authorization': `Bearer ${token}` };

        if (currentUser?.role === 'admin') {
            if (viewingUserId === 'all') {
                url = `${API.tasks}?all=true`;
            } else if (viewingUserId) {
                url = `${API.users}/${viewingUserId}/tasks`;
            } else {
                url = API.tasks;
            }
        } else {
            url = API.tasks;
        }

        const res = await fetch(url, { headers });

        if (res.ok) {
            const data = await res.json();
            tasks = data.data;
            renderCategories();
            renderTasks();
            renderStats();
        } else if (res.status === 401) {
            logout();
        } else {
            console.error('Error fetching tasks:', res.status);
            tasks = [];
            renderTasks();
        }
    } catch (err) {
        console.error('Error fetching tasks:', err);
        tasks = [];
        renderTasks();
    } finally {
        hideLoading();
    }
}

function renderStats() {
    if (!currentUser || tasks.length === 0) {
        elements.statsBar.classList.add('hidden');
        return;
    }

    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
    const highPriority = tasks.filter(t => !t.completed && t.priority === 'high').length;

    elements.statsBar.classList.remove('hidden');
    elements.statsBar.innerHTML = `
        <div class="stat"><strong>${total}</strong> Total</div>
        <div class="stat"><strong>${completed}</strong> Done</div>
        <div class="stat"><strong>${pending}</strong> Pending</div>
        ${highPriority > 0 ? `<div class="stat" style="border-color:var(--danger)"><strong>${highPriority}</strong> High Priority</div>` : ''}
        ${overdue > 0 ? `<div class="stat" style="border-color:var(--danger);color:var(--danger)"><strong>${overdue}</strong> Overdue</div>` : ''}
    `;
}

function renderTasks() {
    let filtered = [...tasks];

    // Search filter
    const search = elements.searchInput.value.toLowerCase().trim();
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
    const priority = elements.filterPriority.value;
    if (priority) {
        filtered = filtered.filter(t => t.priority === priority);
    }

    // Status filter
    const status = elements.filterStatus.value;
    if (status !== '') {
        filtered = filtered.filter(t => t.completed === (status === 'true'));
    }

    // Sorting
    const sortBy = elements.sortBy.value;
    const priorityWeight = { high: 3, medium: 2, low: 1 };

    switch (sortBy) {
        case 'newest':
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'oldest':
            filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'priority':
            filtered.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
            break;
        case 'due-date':
            filtered.sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            });
            break;
        case 'name':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }

    if (filtered.length === 0) {
        elements.taskList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <p>No tasks found</p>
                ${currentUser ? '<p style="font-size: 0.875rem;">Add a new task above!</p>' : '<p style="font-size: 0.875rem;">Login to add tasks</p>'}
            </div>
        `;
        return;
    }

    elements.taskList.innerHTML = filtered.map(task => {
        const taskUserId = typeof task.user === 'string' ? task.user : task.user?._id;
        const currentUserId = currentUser ? (currentUser.id || currentUser._id) : null;

        const canManage = currentUser && (
            (taskUserId && currentUserId && taskUserId.toString() === currentUserId.toString()) ||
            currentUser.role === 'admin'
        );

        // Due date logic
        let dueBadge = '';
        let isOverdue = false;
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const now = new Date();
            const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
            const formattedDate = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            if (!task.completed && diffDays < 0) {
                dueBadge = `<span class="badge overdue">⏰ Overdue (${formattedDate})</span>`;
                isOverdue = true;
            } else if (!task.completed && diffDays <= 2) {
                dueBadge = `<span class="badge due-soon">📅 Due soon (${formattedDate})</span>`;
            } else {
                dueBadge = `<span class="badge due-date">📅 ${formattedDate}</span>`;
            }
        }

        // Owner badge for admin viewing all tasks
        const ownerBadge = (viewingUserId === 'all' && task.user) ?
            `<span class="badge" style="background:var(--card-border);color:var(--text-secondary)">👤 ${escapeHtml(typeof task.user === 'string' ? task.user : task.user.username || 'Unknown')}</span>` : '';

        return `
        <div class="task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
            <div class="task-info">
                <div class="task-title">${escapeHtml(task.name)}</div>
                ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    <span class="badge ${task.priority}">${task.priority}</span>
                    <span class="badge ${task.completed ? 'completed' : 'pending'}">${task.completed ? 'Done' : 'Pending'}</span>
                    ${task.category ? `<span class="badge category">${escapeHtml(task.category.name)}</span>` : ''}
                    ${dueBadge}
                    ${ownerBadge}
                </div>
            </div>
            ${canManage ? `
                <div class="actions">
                    <button class="btn-success" onclick="toggleTask('${task._id}', ${!task.completed})" title="${task.completed ? 'Mark pending' : 'Mark done'}">
                        ${task.completed ? '↩️' : '✓'}
                    </button>
                    <button class="btn-warning" onclick="editTask('${task._id}')" title="Edit task">
                        ✏️
                    </button>
                    <button class="btn-danger" onclick="deleteTask('${task._id}')" title="Delete task">
                        🗑️
                    </button>
                </div>
            ` : ''}
        </div>
    `}).join('');
}

// ==================== TASK CRUD ====================

async function handleTaskSubmit(e) {
    e.preventDefault();

    const editId = elements.editTaskId.value;

    const name = document.getElementById('taskName').value;
    const description = document.getElementById('taskDesc').value;
    const category = document.getElementById('taskCategory').value;
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value || null;

    const body = { name, description, category, priority, dueDate };

    showLoading();
    try {
        let res;
        if (editId) {
            // Update existing task
            res = await fetch(`${API.tasks}/${editId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
        } else {
            // Create new task
            res = await fetch(API.tasks, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
        }

        const data = await res.json();

        if (res.ok) {
            elements.taskForm.reset();
            elements.editTaskId.value = '';
            cancelEdit();
            await fetchTasks();
            showToast(editId ? 'Task updated!' : 'Task created!');
        } else {
            showToast(Array.isArray(data.error) ? data.error.join(', ') : data.error, 'error');
        }
    } catch (err) {
        showToast('Error saving task', 'error');
    } finally {
        hideLoading();
    }
}

function editTask(id) {
    const task = tasks.find(t => t._id === id);
    if (!task) return;

    // Populate form
    elements.editTaskId.value = task._id;
    document.getElementById('taskName').value = task.name;
    document.getElementById('taskDesc').value = task.description || '';
    document.getElementById('taskCategory').value = task.category ? task.category._id : '';
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskDueDate').value = task.dueDate ? task.dueDate.split('T')[0] : '';

    // Update UI
    elements.taskFormTitle.textContent = '✏️ Edit Task';
    elements.taskSubmitBtn.textContent = 'Update Task';
    elements.cancelEditBtn.classList.remove('hidden');

    // Scroll to form
    elements.addTaskCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.editTask = editTask;

function cancelEdit() {
    elements.editTaskId.value = '';
    elements.taskForm.reset();
    elements.taskFormTitle.textContent = '✨ Add New Task';
    elements.taskSubmitBtn.textContent = 'Add Task';
    elements.cancelEditBtn.classList.add('hidden');
}
window.cancelEdit = cancelEdit;

async function toggleTask(id, completed) {
    showLoading();
    try {
        const res = await fetch(`${API.tasks}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ completed })
        });

        if (res.ok) {
            await fetchTasks();
            showToast(completed ? 'Task completed! 🎉' : 'Task reopened');
        } else {
            showToast('Failed to update task', 'error');
        }
    } catch (err) {
        showToast('Error updating task', 'error');
    } finally {
        hideLoading();
    }
}
window.toggleTask = toggleTask;

async function deleteTask(id) {
    if (!confirm('Delete this task?')) return;

    showLoading();
    try {
        const res = await fetch(`${API.tasks}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            await fetchTasks();
            showToast('Task deleted');
        } else {
            showToast('Failed to delete task', 'error');
        }
    } catch (err) {
        showToast('Error deleting task', 'error');
    } finally {
        hideLoading();
    }
}
window.deleteTask = deleteTask;

// ==================== UTILS ====================

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
