const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/CheckinController');
const { protect, restrictTo } = require('../utils/authHandler');

router.post('/scan', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await checkinController.scanQr(req.body.qrContent);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ valid: false, message: error.message });
  }
});

module.exports = router;
