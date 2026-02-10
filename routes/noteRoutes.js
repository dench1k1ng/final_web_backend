const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :taskId
const {
    getNotes,
    createNote,
    deleteNote
} = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');

// All note routes require authentication
router.use(protect);

router
    .route('/')
    .get(getNotes)
    .post(createNote);

router
    .route('/:id')
    .delete(deleteNote);

module.exports = router;
