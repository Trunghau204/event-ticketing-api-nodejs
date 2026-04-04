const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/CategoryController');
const { protect, restrictTo } = require('../utils/authHandler');

// Public
router.get('/', async (req, res) => {
  try {
    const result = await categoryController.getAllCategories();
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await categoryController.getCategoryById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Admin only
router.post('/', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await categoryController.createCategory(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.put('/:id', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await categoryController.updateCategory(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.delete('/:id', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await categoryController.deleteCategory(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

module.exports = router;
