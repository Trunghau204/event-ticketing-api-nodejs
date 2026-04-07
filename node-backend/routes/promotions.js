const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/PromotionController');
const { protect, restrictTo } = require('../utils/authHandler');

// Public: get active promotions
router.get('/active', async (req, res) => {
  try {
    const result = await promotionController.getActivePromotions();
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// User: validate promo code
router.post('/validate', protect, async (req, res) => {
  try {
    const result = await promotionController.validatePromoCode(req.body);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Admin CRUD
router.get('/', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await promotionController.getPromotions();
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post('/', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await promotionController.createPromotion(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.put('/:id', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await promotionController.updatePromotion(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.delete('/:id', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await promotionController.deletePromotion(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

module.exports = router;
