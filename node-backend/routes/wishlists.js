const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/WishlistController');
const { protect } = require('../utils/authHandler');

router.get('/', protect, async (req, res) => {
  try {
    const result = await wishlistController.getUserWishlist(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const result = await wishlistController.addToWishlist(req.user.id, req.body.eventId);
    res.status(201).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get('/check/:eventId', protect, async (req, res) => {
  try {
    const result = await wishlistController.checkWishlist(req.user.id, req.params.eventId);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.delete('/:eventId', protect, async (req, res) => {
  try {
    const result = await wishlistController.removeFromWishlist(req.user.id, req.params.eventId);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

module.exports = router;
