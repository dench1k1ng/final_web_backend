const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a category name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    description: {
        type: String,
        maxlength: [200, 'Description cannot exceed 200 characters']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Reverse populate with virtuals (get tasks for a category)
CategorySchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'category',
    justOne: false
});

// Cascade delete tasks when a category is deleted
CategorySchema.pre('deleteOne', { document: true, query: false }, async function () {
    console.log(`Removing tasks from category ${this._id}`);
    await this.model('Task').deleteMany({ category: this._id });
});

module.exports = mongoose.model('Category', CategorySchema);
