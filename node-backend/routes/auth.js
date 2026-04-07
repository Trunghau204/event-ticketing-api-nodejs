const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');
const { protect } = require('../utils/authHandler');
const { validate, userValidationRules } = require('../utils/validator');

router.post('/register', userValidationRules(), validate, async (req, res) => {
  try {
    const result = await authController.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const result = await authController.login(req.body);
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get('/userinfo', protect, async (req, res) => {
  try {
    const result = await authController.getMe(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post('/logout', protect, (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const result = authController.logout(token);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

module.exports = router;
