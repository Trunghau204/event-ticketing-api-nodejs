const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/ReviewController');
const { protect } = require('../utils/authHandler');

// Public
router.get('/event/:eventId', async (req, res) => {
  try {
    const result = await reviewController.getReviewsByEvent(req.params.eventId);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Authenticated users
router.post('/', protect, async (req, res) => {
  try {
    const result = await reviewController.createReview(req.user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const result = await reviewController.deleteReview(req.params.id, req.user);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

module.exports = router;
