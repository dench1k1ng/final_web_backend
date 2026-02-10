const express = require('express');
const router = express.Router();
const { getActivityLog } = require('../controllers/activityLogController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getActivityLog);

module.exports = router;
