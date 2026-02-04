const express = require('express');
const router = express.Router();
const {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

/* 
   Ideally for a "To-Do List" where users have their own tasks, 
   we should protect the GET route so we know WHO is asking.
*/
router
    .route('/')
    .get(protect, getTasks)
    .post(protect, createTask);

router
    .route('/:id')
    .get(getTask)
    .put(protect, updateTask)
    .delete(protect, deleteTask);

module.exports = router;
