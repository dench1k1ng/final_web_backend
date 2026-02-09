const express = require('express');
const router = express.Router();
const {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
    .route('/')
    .get(getCategories)
    .post(protect, createCategory); // All authenticated users can create

router
    .route('/:id')
    .get(getCategory)
    .put(protect, updateCategory)    // All authenticated users can update
    .delete(protect, deleteCategory); // All authenticated users can delete

module.exports = router;
