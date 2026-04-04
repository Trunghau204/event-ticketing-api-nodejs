const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { protect } = require('../utils/authHandler');

router.get('/profile', protect, async (req, res) => {
  try {
    const result = await userController.getProfile(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const result = await userController.updateProfile(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.put('/password', protect, async (req, res) => {
  try {
    const result = await userController.changePassword(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

module.exports = router;
