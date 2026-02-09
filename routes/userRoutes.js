const express = require('express');
const router = express.Router();
const { getUsers, getUserTasks } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require admin access
router.use(protect);
router.use(authorize('admin'));

router.route('/').get(getUsers);
router.route('/:id/tasks').get(getUserTasks);

module.exports = router;
