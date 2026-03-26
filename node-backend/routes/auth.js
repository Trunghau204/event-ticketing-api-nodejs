const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');
const { protect } = require('../utils/authHandler');
const { validate, userValidationRules } = require('../utils/validator');

router.post('/register', userValidationRules(), validate, authController.register);
router.post('/login', authController.login);
router.get('/userinfo', protect, authController.getMe);

module.exports = router;
