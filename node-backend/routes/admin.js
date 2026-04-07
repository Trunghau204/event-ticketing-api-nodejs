const express = require('express');
const router = express.Router();
const adminController = require('../controllers/AdminController');
const venueController = require('../controllers/VenueController');
const eventController = require('../controllers/EventController');
const { protect, restrictTo } = require('../utils/authHandler');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads/events/');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext)
  }
})
const upload = multer({ storage: storage })

// Dashboard & Users
router.get('/dashboard/stats', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await adminController.getStats();
    res.json(result);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get('/dashboard/events/:eventId/checkin-seats', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await adminController.getCheckinSeats(req.params.eventId);
    res.json(result);
  } catch (error) {
    console.error('Checkin seats error:', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get('/users', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await adminController.getAllUsers();
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.put('/users/:username/toggle-status', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await adminController.toggleUserStatus(req.params.username, req.user);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Venues Management
router.get('/venues', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await venueController.getAllVenues();
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post('/venues', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await venueController.createVenue(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.put('/venues/:id', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await venueController.updateVenue(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.delete('/venues/:id', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await venueController.deleteVenue(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Events Management
router.post('/events', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await eventController.createEvent(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.put('/events/:id', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await eventController.updateEvent(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.delete('/events/:id', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await eventController.deleteEvent(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// File Upload
router.post('/upload/event-image', protect, restrictTo('ADMIN'), upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'File trống!' });
  }
  const imageUrl = `/uploads/events/${req.file.filename}`;
  res.json({ imageUrl });
});

module.exports = router;
