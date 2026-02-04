# Task Manager — Full-Stack To-Do List API

A RESTful Task Management API built with Express.js, MongoDB, and JWT authentication featuring Role-Based Access Control (RBAC), with a built-in frontend.

## 📁 Project Structure

```
final_back_end/
├── config/
│   └── db.js              # Database connection
├── controllers/
│   ├── authController.js   # Auth logic (register, login, me)
│   ├── categoryController.js
│   ├── taskController.js
│   └── userController.js   # Admin user management
├── middleware/
│   └── authMiddleware.js   # JWT protection & RBAC
├── models/
│   ├── User.js             # User schema with bcrypt
│   ├── Category.js         # Category schema (cascade delete)
│   └── Task.js             # Task schema (refs Category & User)
├── routes/
│   ├── authRoutes.js
│   ├── categoryRoutes.js
│   ├── taskRoutes.js
│   └── userRoutes.js       # Admin-only user routes
├── public/
│   ├── index.html          # Frontend UI
│   └── app.js              # Frontend logic
├── server.js               # Entry point
├── grantAdmin.js           # CLI: grant admin role to a user
├── verify_integrity.js     # Test cascade delete
├── package.json
└── .env
```

## 🚀 Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables** (`.env`):
   ```
   MONGODB_URI=mongodb://localhost:27017/assignment4_db
   PORT=3000
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRE=30d
   ```

3. **Start MongoDB** (ensure it's running locally or update URI)

4. **Run the server:**
   - **Development:** `npm run dev`
   - **Production:** `npm start`

5. **Open** `http://localhost:3000` in your browser

## 🚀 Deployment (Render)

1. Push to GitHub
2. Create Web Service on Render:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. Add environment variables: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE`

## 🔐 Authentication & Authorization

### User Roles
- **user**: Can create/manage own categories and tasks
- **admin**: Full access — can view all users, view/manage all tasks

### Grant Admin
```bash
node grantAdmin.js user@example.com
```

## 📋 API Endpoints

### Auth Routes
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register user |
| POST | `/api/auth/login` | Public | Login, get token |
| GET | `/api/auth/me` | Private | Get current user |

### Category Routes
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/categories` | Public | Get all categories |
| GET | `/api/categories/:id` | Public | Get category with tasks |
| POST | `/api/categories` | Private | Create category |
| PUT | `/api/categories/:id` | Private | Update category |
| DELETE | `/api/categories/:id` | Private | Delete category (cascades) |

### Task Routes
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tasks` | Private | Get user's tasks |
| GET | `/api/tasks?all=true` | Admin | Get all tasks |
| GET | `/api/tasks/:id` | Public | Get single task |
| POST | `/api/tasks` | Private | Create task |
| PUT | `/api/tasks/:id` | Private | Update task (owner/admin) |
| DELETE | `/api/tasks/:id` | Private | Delete task (owner/admin) |

### User Routes (Admin Only)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/users` | Admin | Get all users |
| GET | `/api/users/:id/tasks` | Admin | Get tasks for a user |

**Query Parameters for Tasks:**
- `?category=<categoryId>` — Filter by category
- `?priority=low|medium|high` — Filter by priority
- `?completed=true|false` — Filter by status
- `?all=true` — (Admin) Get all users' tasks

## 📦 Data Models

### Category
```javascript
{ name: String (required, unique), description: String }
```

### Task
```javascript
{
  name: String (required),
  description: String,
  priority: 'low' | 'medium' | 'high',
  completed: Boolean,
  dueDate: Date,
  category: ObjectId (ref: Category, required),
  user: ObjectId (ref: User)
}
```

### User
```javascript
{ username: String (required, unique), email: String (required, unique), password: String, role: 'user' | 'admin' }
```

## 🎨 Frontend Features

- **Authentication** — Login/Register modal with JWT
- **Category sidebar** — Create, select, delete categories
- **Task management** — Create, edit, toggle complete, delete tasks
- **Due dates** — Set deadlines with overdue/due-soon highlighting
- **Search** — Real-time search by task name or description
- **Filters** — Filter by priority, completion status, category
- **Sorting** — Sort by newest, oldest, priority, due date, or name
- **Stats bar** — Overview of total/done/pending/overdue/high-priority
- **Toast notifications** — Elegant notifications for all actions
- **Admin panel** — View all users, browse tasks by user
- **Responsive** — Works on mobile and desktop

## Author
Denis — AITU Backend Final Project
