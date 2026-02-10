const Task = require('../models/Task');
const Category = require('../models/Category');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all tasks for current user
// @route   GET /api/tasks
// @access  Private (User sees own tasks only, Admin works via users/:id/tasks or can see all with ?all=true)
exports.getTasks = async (req, res) => {
    try {
        let filter = {};

        // If not admin OR not requesting all tasks, filter by current user
        if (req.user.role !== 'admin' || req.query.all !== 'true') {
            filter.user = req.user.id;
        }
        // If admin and ?all=true is present, filter remains empty (returns all tasks)

        // Build query
        let query = Task.find(filter)
            .populate('category', 'name')
            .populate('user', 'username')
            .populate('tags', 'name color');

        // Filter by category if provided
        if (req.query.category) {
            query = query.where('category').equals(req.query.category);
        }

        // Filter by priority
        if (req.query.priority) {
            query = query.where('priority').equals(req.query.priority);
        }

        // Filter by completed status
        if (req.query.completed !== undefined) {
            query = query.where('completed').equals(req.query.completed === 'true');
        }

        const tasks = await query;

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Public
exports.getTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate('category', 'name description').populate('tags', 'name color');

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
    try {
        // Verify the category exists
        const category = await Category.findById(req.body.category);

        if (!category) {
            return res.status(400).json({
                success: false,
                error: 'Category not found'
            });
        }

        // Add user to req.body if authenticated
        if (req.user) {
            req.body.user = req.user.id;
        }

        const task = await Task.create(req.body);
        const populatedTask = await Task.findById(task._id).populate('category', 'name').populate('tags', 'name color');

        await ActivityLog.logActivity('created', 'task', task.name, req.user.id);

        res.status(201).json({
            success: true,
            data: populatedTask
        });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                error: messages
            });
        }
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
    try {
        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        // Make sure user is task owner or admin
        if (task.user && task.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'User not authorized to update this task'
            });
        }

        // If updating category, verify it exists
        if (req.body.category) {
            const category = await Category.findById(req.body.category);
            if (!category) {
                return res.status(400).json({
                    success: false,
                    error: 'Category not found'
                });
            }
        }

        const wasCompleted = task.completed;

        task = await Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('category', 'name').populate('tags', 'name color');

        const action = (!wasCompleted && task.completed) ? 'completed' : 'updated';
        await ActivityLog.logActivity(action, 'task', task.name, req.user.id);

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        // Make sure user is task owner or admin
        if (task.user && task.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'User not authorized to delete this task'
            });
        }

        const taskName = task.name;
        await task.deleteOne();

        await ActivityLog.logActivity('deleted', 'task', taskName, req.user.id);

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};
