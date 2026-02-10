const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ['created', 'updated', 'completed', 'deleted']
    },
    entityType: {
        type: String,
        required: true,
        enum: ['task', 'category', 'note', 'tag']
    },
    entityName: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for efficient lookup by user + recent first
ActivityLogSchema.index({ user: 1, createdAt: -1 });

// Static helper to log an activity
ActivityLogSchema.statics.logActivity = async function (action, entityType, entityName, userId) {
    try {
        await this.create({ action, entityType, entityName, user: userId });
    } catch (err) {
        console.error('Activity log error:', err.message);
    }
};

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
