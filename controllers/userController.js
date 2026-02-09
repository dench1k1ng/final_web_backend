const User = require('../models/User');
const Task = require('../models/Task');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Get tasks for a specific user
// @route   GET /api/users/:id/tasks
// @access  Private/Admin
exports.getUserTasks = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const tasks = await Task.find({ user: req.params.id })
            .populate('category', 'name')
            .populate('user', 'username');

        res.status(200).json({
            success: true,
            count: tasks.length,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            data: tasks
        });
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};
