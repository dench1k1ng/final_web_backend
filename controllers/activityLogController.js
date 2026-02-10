const ActivityLog = require('../models/ActivityLog');

// @desc    Get activity log for current user (or all if admin)
// @route   GET /api/activity
// @access  Private
exports.getActivityLog = async (req, res) => {
    try {
        let filter = { user: req.user.id };

        // Admin can see all activity
        if (req.user.role === 'admin' && req.query.all === 'true') {
            filter = {};
        }

        const limit = parseInt(req.query.limit) || 50;

        const logs = await ActivityLog.find(filter)
            .populate('user', 'username')
            .sort('-createdAt')
            .limit(limit);

        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
