const express = require('express');
const router = express.Router();
const cartController = require('../controllers/CartController');
const { protect } = require('../utils/authHandler');

router.get('/', protect, async (req, res) => {
  try {
    const result = await cartController.getCart(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post('/items', protect, async (req, res) => {
  try {
    const result = await cartController.addToCart(req.user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.delete('/items/:itemId', protect, async (req, res) => {
  try {
    const result = await cartController.removeFromCart(req.user.id, req.params.itemId);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.delete('/clear', protect, async (req, res) => {
  try {
    const result = await cartController.clearCart(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post('/checkout', protect, async (req, res) => {
  try {
    const result = await cartController.checkoutCart(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const response = { message: error.message };
    if (error.unavailableSeats) response.unavailableSeats = error.unavailableSeats;
    res.status(statusCode).json(response);
  }
});

module.exports = router;
