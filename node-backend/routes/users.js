const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { protect } = require('../utils/authHandler');

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.put('/password', protect, userController.changePassword);

module.exports = router;
