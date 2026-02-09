const mongoose = require('mongoose');
const Category = require('./models/Category');
const Task = require('./models/Task');
require('dotenv').config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/assignment4_db');
        console.log('Connected to DB');

        // 0. Cleanup
        await Category.deleteOne({ name: 'Test Cascade' });

        // 1. Create Category
        const cat = await Category.create({ name: 'Test Cascade', description: 'Temp' });
        console.log(`Created Category: ${cat._id}`);

        // 2. Create Tasks
        const task1 = await Task.create({ name: 'Task 1', category: cat._id });
        const task2 = await Task.create({ name: 'Task 2', category: cat._id });
        console.log(`Created Tasks: ${task1._id}, ${task2._id}`);

        // 3. Delete Category
        console.log('Deleting Category...');
        // We must use the document's remove/deleteOne method to trigger the hook, OR findByIdAndDelete if the hook is on Query (but we put it on Document)
        // The controller uses: const category = await Category.findById(req.params.id); await category.deleteOne();
        // So we simulate that:
        const catToDelete = await Category.findById(cat._id);
        await catToDelete.deleteOne();

        // 4. Verify Tasks are gone
        const tasks = await Task.find({ category: cat._id });
        console.log(`Remaining Tasks: ${tasks.length}`);

        if (tasks.length === 0) {
            console.log('SUCCESS: Cascading delete worked!');
        } else {
            console.log('FAILURE: Tasks still exist.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
};

verify();
