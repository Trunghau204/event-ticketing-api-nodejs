const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
require('dotenv').config();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { Order, User } = require('../schemas');
const { completeOrderAndSendTicket } = require('../utils/orderUtils');
const { formatOrderResponse } = require('../controllers/OrderController');

router.get('/verify', async (req, res) => {
    try {
        const { sessionId, orderId } = req.query;
        if (!sessionId || !orderId) {
            return res.status(400).json({ message: 'Missing sessionId or orderId' });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const order = await Order.findByPk(orderId, { include: [{ model: User, as: 'user' }]});

        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (session.payment_status === 'paid' && order.status === 'PENDING') {
            await completeOrderAndSendTicket(order.id);
            order.status = 'PAID';
        }

        const fullOrderDto = await formatOrderResponse(order);
        res.json(fullOrderDto);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
