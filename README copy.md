# Assignment 4 - Task API with MVC, JWT Auth & RBAC

A RESTful Task Management API built with Express.js, MongoDB, and JWT authentication featuring Role-Based Access Control (RBAC).

## 📁 Project Structure

```
assignment_4/
├── config/
│   └── db.js              # Database connection
├── controllers/
│   ├── authController.js  # Auth logic (register, login)
│   ├── categoryController.js
│   └── taskController.js
├── middleware/
│   └── authMiddleware.js  # JWT protection & RBAC
├── models/
│   ├── User.js            # User schema with bcrypt
│   ├── Category.js        # Category schema
│   └── Task.js            # Task schema (refs Category)
├── routes/
│   ├── authRoutes.js
│   ├── categoryRoutes.js
│   └── taskRoutes.js
├── public/
│   └── index.html         # API documentation page
├── server.js              # Entry point
├── package.json
└── .env
```

## 🚀 Setup Instructions

1. **Install dependencies:**
   ```bash
   cd assignment_4
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
   ```bash
   npm start
   ```

## 🔐 Authentication & Authorization

### User Roles
- **user**: Can view all public endpoints (GET requests)
- **admin**: Full access including POST, PUT, DELETE

### Register a User
```bash
POST /api/auth/register
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"  # or "admin"
}
```

### Login
```bash
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
# Returns: { "token": "eyJhbG..." }
```

### Using the Token
Add to request headers:
```
Authorization: Bearer <your_jwt_token>
```

## 📋 API Endpoints

### Auth Routes
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register user |
| POST | `/api/auth/login` | Public | Login, get token |
| GET | `/api/auth/me` | Protected | Get current user |

### Category Routes
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/categories` | Public | Get all categories |
| GET | `/api/categories/:id` | Public | Get single category (with tasks) |
| POST | `/api/categories` | Admin | Create category |
| PUT | `/api/categories/:id` | Admin | Update category |
| DELETE | `/api/categories/:id` | Admin | Delete category |

### Task Routes
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tasks` | Public | Get all tasks |
| GET | `/api/tasks/:id` | Public | Get single task |
| POST | `/api/tasks` | Admin | Create task |
| PUT | `/api/tasks/:id` | Admin | Update task |
| DELETE | `/api/tasks/:id` | Admin | Delete task |

**Query Parameters for Tasks:**
- `?category=<categoryId>` - Filter by category
- `?priority=low|medium|high` - Filter by priority
- `?completed=true|false` - Filter by status

## 📦 Two Related Objects

### 1. Category (Primary)
```javascript
{
  name: String (required, unique),
  description: String
}
```

### 2. Task (Secondary)
```javascript
{
  name: String (required),
  description: String,
  priority: 'low' | 'medium' | 'high',
  completed: Boolean,
  category: ObjectId (ref: Category, required),
  user: ObjectId (ref: User)
}
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure, stateless authentication
- **RBAC**: Role-based route protection
- **Input Validation**: Mongoose schema validation

## 📝 Example Workflow

1. Register an admin user
2. Login to get JWT token
3. Create categories (as admin)
4. Create tasks linked to categories (as admin)
5. Anyone can view tasks and categories

## Author
Denis - AITU Backend Assignment 4
