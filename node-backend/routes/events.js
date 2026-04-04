const express = require('express');
const router = express.Router();
const eventController = require('../controllers/EventController');
const { protect, restrictTo } = require('../utils/authHandler');

router.get('/', async (req, res) => {
  try {
    const result = await eventController.getAllEvents();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await eventController.getEventById(req.params.id);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get('/:id/seats', async (req, res) => {
  try {
    const result = await eventController.getEventSeats(req.params.id);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post('/', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await eventController.createEvent(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.put('/:id', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await eventController.updateEvent(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.delete('/:id', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await eventController.deleteEvent(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

module.exports = router;
