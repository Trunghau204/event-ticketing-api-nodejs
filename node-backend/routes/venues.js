const express = require('express');
const router = express.Router();
const venueController = require('../controllers/VenueController');
const { protect, restrictTo } = require('../utils/authHandler');

router.get('/', async (req, res) => {
  try {
    const result = await venueController.getAllVenues();
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await venueController.getVenueById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post('/', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await venueController.createVenue(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.put('/:id', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await venueController.updateVenue(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.delete('/:id', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await venueController.deleteVenue(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

module.exports = router;
