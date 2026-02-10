const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Please add note text'],
        trim: true,
        maxlength: [500, 'Note cannot exceed 500 characters']
    },
    task: {
        type: mongoose.Schema.ObjectId,
        ref: 'Task',
        required: [true, 'Note must belong to a task']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Note must belong to a user']
    }
}, {
    timestamps: true
});

// Index for efficient lookup of notes by task
NoteSchema.index({ task: 1, createdAt: -1 });

module.exports = mongoose.model('Note', NoteSchema);
