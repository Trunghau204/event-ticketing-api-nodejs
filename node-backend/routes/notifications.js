const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/NotificationController');
const { protect } = require('../utils/authHandler');

router.get('/', protect, async (req, res) => {
    try {
        const result = await notificationController.getUserNotifications(req.user.id);
        res.json(result);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
});

router.put('/:id/read', protect, async (req, res) => {
    try {
        const result = await notificationController.markAsRead(req.params.id, req.user.id);
        res.json(result);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
});

router.put('/read-all', protect, async (req, res) => {
    try {
        const result = await notificationController.markAllAsRead(req.user.id);
        res.json(result);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
});

module.exports = router;
