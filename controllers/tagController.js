const Tag = require('../models/Tag');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all tags for current user
// @route   GET /api/tags
// @access  Private
exports.getTags = async (req, res) => {
    try {
        const tags = await Tag.find({ user: req.user.id });

        res.status(200).json({
            success: true,
            count: tags.length,
            data: tags
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create a tag
// @route   POST /api/tags
// @access  Private
exports.createTag = async (req, res) => {
    try {
        req.body.user = req.user.id;
        const tag = await Tag.create(req.body);

        await ActivityLog.logActivity('created', 'tag', tag.name, req.user.id);

        res.status(201).json({ success: true, data: tag });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Tag name already exists' });
        }
        res.status(400).json({
            success: false,
            error: err.message || 'Could not create tag'
        });
    }
};

// @desc    Update a tag
// @route   PUT /api/tags/:id
// @access  Private
exports.updateTag = async (req, res) => {
    try {
        let tag = await Tag.findById(req.params.id);
        if (!tag) {
            return res.status(404).json({ success: false, error: 'Tag not found' });
        }
        if (tag.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        tag = await Tag.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        await ActivityLog.logActivity('updated', 'tag', tag.name, req.user.id);

        res.status(200).json({ success: true, data: tag });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete a tag
// @route   DELETE /api/tags/:id
// @access  Private
exports.deleteTag = async (req, res) => {
    try {
        const tag = await Tag.findById(req.params.id);
        if (!tag) {
            return res.status(404).json({ success: false, error: 'Tag not found' });
        }
        if (tag.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        const tagName = tag.name;
        await tag.remove();

        await ActivityLog.logActivity('deleted', 'tag', tagName, req.user.id);

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
