const express = require('express');
require('dotenv').config();
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');

// Route files
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const tagRoutes = require('./routes/tagRoutes');
const noteRoutes = require('./routes/noteRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// CORS middleware
app.use(cors());

// Body parser middleware
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/tasks/:taskId/notes', noteRoutes);
app.use('/api/activity', activityLogRoutes);

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check route
app.get('/status', (req, res) => {
    res.status(200).json({
        status: 'OK',
        uptime: process.uptime(),
        message: 'Server is healthy'
    });
});

// Error handler middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Server Error'
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('API Routes:');
    console.log('  Auth:       /api/auth');
    console.log('  Categories: /api/categories');
    console.log('  Tasks:      /api/tasks');
    console.log('  Tags:       /api/tags');
    console.log('  Notes:      /api/tasks/:taskId/notes');
    console.log('  Activity:   /api/activity');
    console.log('  Users:      /api/users (admin)');
});
