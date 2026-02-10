const Note = require('../models/Note');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get notes for a task
// @route   GET /api/tasks/:taskId/notes
// @access  Private
exports.getNotes = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId);
        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }

        // Only owner or admin can see notes
        if (task.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        const notes = await Note.find({ task: req.params.taskId })
            .populate('user', 'username')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: notes.length,
            data: notes
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Add a note to a task
// @route   POST /api/tasks/:taskId/notes
// @access  Private
exports.createNote = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId);
        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }

        if (task.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        const note = await Note.create({
            text: req.body.text,
            task: req.params.taskId,
            user: req.user.id
        });

        const populated = await note.populate('user', 'username');

        await ActivityLog.logActivity('created', 'note', `Note on "${task.name}"`, req.user.id);

        res.status(201).json({ success: true, data: populated });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message || 'Could not create note'
        });
    }
};

// @desc    Delete a note
// @route   DELETE /api/tasks/:taskId/notes/:id
// @access  Private
exports.deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) {
            return res.status(404).json({ success: false, error: 'Note not found' });
        }

        if (note.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        await note.remove();

        await ActivityLog.logActivity('deleted', 'note', 'Note deleted', req.user.id);

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
