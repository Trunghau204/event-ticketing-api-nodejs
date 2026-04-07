const { Order, OrderItem, Event, Venue, EventSeat, Seat, User } = require('../schemas');
const { completeOrderAndSendTicket } = require('../utils/orderUtils');
const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');
require('dotenv').config();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const AppError = require('../utils/AppError');

const ticketsDir = path.join(__dirname, '../tickets');
if (!fs.existsSync(ticketsDir)){
    fs.mkdirSync(ticketsDir, { recursive: true });
}

// Formats DB objects into the expected OrderResponse DTO
const formatOrderResponse = async (order) => {
  const fullOrder = await Order.findByPk(order.id, {
    include: [
      { 
        model: Event, as: 'event',
        include: [{ model: Venue, as: 'venue' }] 
      },
      { 
        model: OrderItem, as: 'orderItems',
        include: [{ 
          model: EventSeat, as: 'eventSeat',
          include: [{ model: Seat, as: 'seat' }]
        }]
      }
    ]
  });

  const items = fullOrder.orderItems.map(item => ({
    id: item.id,
    seatLabel: item.eventSeat && item.eventSeat.seat ? `${item.eventSeat.seat.rowLabel}${item.eventSeat.seat.colNumber}` : item.seatNumber,
    seatType: item.eventSeat && item.eventSeat.seat ? item.eventSeat.seat.seatType : 'N/A',
    price: item.price
  }));

  let status = fullOrder.status;
  if (fullOrder.checkInTime) {
      status = 'CHECKED_IN';
  }

  return {
    id: fullOrder.id,
    eventTitle: fullOrder.event ? fullOrder.event.title : '',
    eventDate: fullOrder.event ? fullOrder.event.eventDate : null,
    venueName: fullOrder.event && fullOrder.event.venue ? fullOrder.event.venue.name : '',
    totalAmount: fullOrder.totalAmount,
    status: status,
    createdAt: fullOrder.createdAt,
    paymentTime: fullOrder.paymentTime,
    checkInTime: fullOrder.checkInTime,
    paymentUrl: null,
    items: items,
    seats: items.map(i => i.seatLabel)
  };
};

// Export formatOrderResponse so stripe route can use it
exports.formatOrderResponse = formatOrderResponse;

exports.getAllOrders = async () => {
    const orders = await Order.findAll({
        include: [
            { model: Event, as: 'event', attributes: ['title'] },
            { model: User, as: 'user', attributes: ['fullName', 'email'] },
            { model: OrderItem, as: 'orderItems', attributes: ['id', 'price'] }
        ],
        order: [['createdAt', 'DESC']]
    });

    return orders.map(o => ({
        id: o.id,
        userName: o.user ? o.user.fullName : 'Unknown',
        userEmail: o.user ? o.user.email : 'Unknown',
        eventTitle: o.event ? o.event.title : 'N/A',
        seatCount: o.orderItems ? o.orderItems.length : 0,
        amount: o.totalAmount,
        discountAmount: o.discountAmount,
        status: o.status,
        createdAt: new Date(o.createdAt).toLocaleString('vi-VN')
    }));
};

exports.reserveSeats = async (userId, body) => {
  const { sequelize, Promotion } = require('../schemas');
  const t = await sequelize.transaction();
  try {
    const { eventId, eventSeatIds, promotionCode } = body;
    console.log('[DEBUG] reserveSeats payload:', body);

    if (!eventId || !eventSeatIds || eventSeatIds.length === 0) {
      await t.rollback();
      throw new AppError('Missing eventId or eventSeatIds', 400);
    }

    const eventSeats = await EventSeat.findAll({
      where: { id: eventSeatIds },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    for (let es of eventSeats) {
      if (es.status !== 'AVAILABLE') {
        await t.rollback();
        throw new AppError('Seat is already booked or reserved', 400);
      }
    }

    let subtotal = 0;
    for (let es of eventSeats) {
        subtotal += es.price;
    }

    let discountAmount = 0;
    let promoId = null;

    if (promotionCode) {
        const promo = await Promotion.findOne({
            where: { code: promotionCode.toUpperCase(), isActive: true },
            transaction: t, lock: t.LOCK.UPDATE
        });
        if (!promo) {
            await t.rollback();
            throw new AppError('Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa', 400);
        }
        const now = new Date();
        if (now < new Date(promo.startDate) || now > new Date(promo.endDate)) {
            await t.rollback();
            throw new AppError('Mã giảm giá đã hết hạn hoặc chưa có hiệu lực', 400);
        }
        if (promo.usageLimit > 0 && promo.usageCount >= promo.usageLimit) {
            await t.rollback();
            throw new AppError('Mã giảm giá đã hết lượt sử dụng', 400);
        }
        if (subtotal < promo.minOrderValue) {
            await t.rollback();
            throw new AppError(`Đơn hàng phải từ ${promo.minOrderValue.toLocaleString()} VNĐ để sử dụng mã này`, 400);
        }

        promoId = promo.id;
        if (promo.discountType === 'PERCENTAGE') {
            discountAmount = subtotal * (promo.discountValue / 100);
            if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
                discountAmount = promo.maxDiscount;
            }
        } else {
            discountAmount = promo.discountValue;
        }
        promo.usageCount += 1;
        await promo.save({ transaction: t });
    }

    let totalAmount = Math.max(0, subtotal - discountAmount);
    const orderItemsData = [];

    const order = await Order.create({
      user_id: userId,
      event_id: eventId,
      totalAmount: totalAmount,
      discountAmount: discountAmount,
      promotion_id: promoId,
      status: 'PENDING',
    }, { transaction: t });

    for (let es of eventSeats) {
      es.status = 'BOOKED';
      await es.save({ transaction: t });
      orderItemsData.push({
        order_id: order.id,
        event_seat_id: es.id,
        price: es.price,
        seatNumber: 'N/A'
      });
    }

    await OrderItem.bulkCreate(orderItemsData, { transaction: t });

    await t.commit();
    return await formatOrderResponse(order);
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    throw error;
  }
};

exports.getMyOrders = async (userId) => {
  const orders = await Order.findAll({
    where: { user_id: userId },
    order: [['createdAt', 'DESC']],
  });
  
  const responses = [];
  for (let o of orders) {
    responses.push(await formatOrderResponse(o));
  }
  return responses;
};

exports.getOrderById = async (orderId) => {
  const order = await Order.findByPk(orderId);
  if (!order) throw new AppError('Order not found', 404);
  
  return await formatOrderResponse(order);
};

exports.simulatePayment = async (orderId) => {
  const order = await Order.findByPk(orderId);
  if (!order) throw new AppError('Order not found', 404);

  if (order.status !== 'PENDING') {
    throw new AppError(`Order status is ${order.status}`, 400);
  }

  const completedOrder = await completeOrderAndSendTicket(order.id);
  return await formatOrderResponse(completedOrder);
};

exports.cancelOrder = async (orderId) => {
  const { sequelize } = require('../schemas');
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: 'orderItems' }],
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    if (!order) {
      await t.rollback();
      throw new AppError('Order not found', 404);
    }

    if (order.status !== 'PENDING') {
      await t.rollback();
      throw new AppError(`Cannot cancel order with status ${order.status}`, 400);
    }

    order.status = 'CANCELLED';
    await order.save({ transaction: t });

    if (order.orderItems) {
      for (const item of order.orderItems) {
        if (item.event_seat_id) {
          const es = await EventSeat.findByPk(item.event_seat_id, { transaction: t });
          if (es) {
            es.status = 'AVAILABLE';
            await es.save({ transaction: t });
          }
        }
      }
    }

    await t.commit();
    return await formatOrderResponse(order);
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    throw error;
  }
};

exports.getPaymentUrl = async (orderId) => {
  const { sequelize } = require('../schemas');
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(orderId, {
      include: [{ model: Event, as: 'event' }],
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    if (!order) {
      await t.rollback();
      throw new AppError('Order not found', 404);
    }

    if (!order.stripeSessionId) {
      let session;
      const baseParams = {
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment-result?session_id={CHECKOUT_SESSION_ID}&orderId=${order.id}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment-result?orderId=${order.id}`,
        metadata: { order_id: order.id.toString() },
        customer_email: order.user ? order.user.email : undefined,
      };

      try {
        console.log(`[Stripe] Attempting session creation in VND for Order #${order.id}`);
        session = await stripe.checkout.sessions.create({
          ...baseParams,
          line_items: [{
            price_data: {
              currency: 'vnd',
              product_data: { name: `Vé: ${order.event ? order.event.title : 'Sự kiện'}` },
              unit_amount: Math.round(order.totalAmount),
            },
            quantity: 1,
          }],
        });
      } catch (vndError) {
        console.warn("[Stripe] VND Session failed, trying USD fallback:", vndError.message);
        const usdAmount = Math.max(1, Math.round(order.totalAmount / 25000)); 
        session = await stripe.checkout.sessions.create({
          ...baseParams,
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: { name: `Ticket: ${order.event ? order.event.title : 'Event'}` },
              unit_amount: usdAmount * 100,
            },
            quantity: 1,
          }],
        });
      }

      order.stripeSessionId = session.id;
      await order.save({ transaction: t });
      await t.commit();
      return { url: session.url };
    }

    await t.commit();
    const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
    return { url: session.url };
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    throw error;
  }
};

exports.downloadTicket = (orderId) => {
  const pdfPath = path.join(ticketsDir, `ticket_${orderId}.pdf`);
  if (!fs.existsSync(pdfPath)) {
    throw new AppError('Ticket not found', 404);
  }
  return pdfPath;
};

exports.getQrCode = (orderId) => {
  const qrPath = path.join(ticketsDir, `qr_${orderId}.png`);
  if (!fs.existsSync(qrPath)) {
    throw new AppError('QR not found', 404);
  }
  return qrPath;
};

exports.handleWebhook = async (body) => {
  const event = body;
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata.order_id;
    const order = await Order.findByPk(orderId, { include: [{ model: User, as: 'user' }] });
    if (order && order.status === 'PENDING') {
      await completeOrderAndSendTicket(order.id);
    }
  }
  return { received: true };
};
