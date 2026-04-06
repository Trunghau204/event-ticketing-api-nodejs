const express = require('express');
const router = express.Router();
const orderController = require('../controllers/OrderController');
const { protect, restrictTo } = require('../utils/authHandler');

router.get('/admin/all', protect, restrictTo('ADMIN'), async (req, res) => {
  try {
    const result = await orderController.getAllOrders();
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post('/reserve', protect, async (req, res) => {
  try {
    const result = await orderController.reserveSeats(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const result = await orderController.getMyOrders(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const result = await orderController.getOrderById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post('/:id/simulate-pay', protect, async (req, res) => {
  try {
    const result = await orderController.simulatePayment(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const result = await orderController.cancelOrder(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get('/:id/payment-url', protect, async (req, res) => {
  try {
    const result = await orderController.getPaymentUrl(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get('/:id/download-ticket', async (req, res) => {
  try {
    const pdfPath = orderController.downloadTicket(req.params.id);
    res.download(pdfPath, `ticket_${req.params.id}.pdf`);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.get('/:id/qrcode', async (req, res) => {
  try {
    const qrPath = orderController.getQrCode(req.params.id);
    res.sendFile(qrPath);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const result = await orderController.handleWebhook(req.body);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

module.exports = router;
