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
let users = []; // Admin: list of all users
let viewingUserId = null; // Admin: currently viewing tasks for this user (null = own tasks)

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
    taskCategory: document.getElementById('taskCategory'),
    taskList: document.getElementById('taskList'),

    // Filters
    filterPriority: document.getElementById('filterPriority'),
    filterStatus: document.getElementById('filterStatus'),

    // Admin Panel
    adminPanel: document.getElementById('adminPanel'),
    userSelect: document.getElementById('userSelect'),
    selectedUserInfo: document.getElementById('selectedUserInfo'),
    selectedUserName: document.getElementById('selectedUserName'),
    backToMyTasks: document.getElementById('backToMyTasks')
};

// Initialize
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
    elements.taskForm.addEventListener('submit', handleAddTask);

    // Filters
    elements.filterPriority.addEventListener('change', renderTasks);
    elements.filterStatus.addEventListener('change', renderTasks);

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

    // All logged-in users can add tasks and categories
    elements.addTaskCard.classList.remove('hidden');
    elements.addCategoryCard.classList.remove('hidden');

    if (currentUser.role === 'admin') {
        elements.adminPanel.classList.remove('hidden');
        fetchUsers(); // Load user list for admin
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
        } else {
            showAuthAlert(data.error || 'Login failed');
        }
    } catch (err) {
        console.error('Login error:', err);
        showAuthAlert(`Network error: ${err.message}. Is the server running?`);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

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
        } else {
            showAuthAlert(Array.isArray(data.error) ? data.error.join(', ') : data.error);
        }
    } catch (err) {
        console.error('Register error:', err);
        showAuthAlert(`Network error: ${err.message}. Is the server running?`);
    }
}

function logout() {
    token = null;
    localStorage.removeItem('token');
    currentUser = null;
    tasks = []; // Clear tasks data
    selectedCategory = 'all'; // Reset category
    updateUIForGuest();
    renderTasks(); // Render empty state
    renderCategories(); // Reset categories view
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
        return `
            <li class="category-item ${selectedCategory === cat._id ? 'active' : ''}" 
                data-id="${cat._id}" onclick="selectCategory('${cat._id}')">
                <span class="category-name">📁 ${escapeHtml(cat.name)}</span>
                <span class="category-count">${count}</span>
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
        } else {
            alert(Array.isArray(data.error) ? data.error.join(', ') : data.error);
        }
    } catch (err) {
        alert('Error adding category');
    }
}

async function deleteCategory(id) {
    if (!confirm('Delete this category? Tasks in this category will remain but lose their category.')) return;

    try {
        const res = await fetch(`${API.categories}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            if (selectedCategory === id) selectedCategory = 'all';
            await fetchCategories();
            await fetchTasks();
        } else {
            alert('Failed to delete category');
        }
    } catch (err) {
        alert('Error deleting category');
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
    // If not logged in, don't fetch (route is protected)
    if (!token) {
        tasks = [];
        renderCategories();
        renderTasks();
        return;
    }

    try {
        let url;
        const headers = { 'Authorization': `Bearer ${token}` };

        // Admin logic
        if (currentUser?.role === 'admin') {
            if (viewingUserId === 'all') {
                url = `${API.tasks}?all=true`;
            } else if (viewingUserId) {
                url = `${API.users}/${viewingUserId}/tasks`;
            } else {
                url = API.tasks; // Own tasks
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
        } else if (res.status === 401) {
            // Token expired or invalid
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
    }
}

function renderTasks() {
    let filtered = [...tasks];

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

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
        // Show actions if: user owns the task OR user is admin
        // Handle both cases: task.user might be a string ID or a populated object with _id
        const taskUserId = typeof task.user === 'string' ? task.user : task.user?._id;
        /* Handle currentUser inconsistent ID (id vs _id) */
        const currentUserId = currentUser.id || currentUser._id;

        const canManage = currentUser && (
            (taskUserId && taskUserId.toString() === currentUserId.toString()) ||
            currentUser.role === 'admin'
        );

        return `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <div class="task-info">
                <div class="task-title">${escapeHtml(task.name)}</div>
                ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    <span class="badge ${task.priority}">${task.priority}</span>
                    <span class="badge ${task.completed ? 'completed' : 'pending'}">${task.completed ? 'Done' : 'Pending'}</span>
                    ${task.category ? `<span class="badge category">${escapeHtml(task.category.name)}</span>` : ''}
                </div>
            </div>
            ${canManage ? `
                <div class="actions">
                    <button class="btn-success" onclick="toggleTask('${task._id}', ${!task.completed})" title="Toggle">
                        ${task.completed ? '↩️' : '✓'}
                    </button>
                    <button class="btn-danger" onclick="deleteTask('${task._id}')" title="Delete">
                        🗑️
                    </button>
                </div>
            ` : ''}
        </div>
    `}).join('');
}

async function handleAddTask(e) {
    e.preventDefault();

    const name = document.getElementById('taskName').value;
    const description = document.getElementById('taskDesc').value;
    const category = document.getElementById('taskCategory').value;
    const priority = document.getElementById('taskPriority').value;

    try {
        const res = await fetch(API.tasks, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, description, category, priority })
        });

        const data = await res.json();

        if (res.ok) {
            elements.taskForm.reset();
            await fetchTasks();
        } else {
            alert(Array.isArray(data.error) ? data.error.join(', ') : data.error);
        }
    } catch (err) {
        alert('Error adding task');
    }
}

async function toggleTask(id, completed) {
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
        } else {
            alert('Failed to update task');
        }
    } catch (err) {
        alert('Error updating task');
    }
}
window.toggleTask = toggleTask;

async function deleteTask(id) {
    if (!confirm('Delete this task?')) return;

    try {
        const res = await fetch(`${API.tasks}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            await fetchTasks();
        } else {
            alert('Failed to delete task');
        }
    } catch (err) {
        alert('Error deleting task');
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
