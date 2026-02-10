const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a tag name'],
        unique: true,
        trim: true,
        maxlength: [30, 'Tag name cannot exceed 30 characters']
    },
    color: {
        type: String,
        default: '#6366f1',
        match: [/^#([0-9A-Fa-f]{6})$/, 'Please provide a valid hex color']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Tag', TagSchema);
