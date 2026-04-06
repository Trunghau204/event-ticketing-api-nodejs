const { Order, OrderItem, Event, User, EventSeat, Seat, sequelize } = require('../schemas');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');

exports.scanQr = async (qrContent) => {
  const t = await sequelize.transaction();
  try {
    const orderIdStr = qrContent.split(':')[1] || qrContent;
    const orderId = parseInt(orderIdStr, 10);
    
    if (isNaN(orderId)) {
        await t.rollback();
        throw new AppError('Mã QR không hợp lệ', 400);
    }
    
    const order = await Order.findByPk(orderId, {
      include: [
        { model: Event, as: 'event' },
        { model: User, as: 'user' },
        { 
          model: OrderItem, as: 'orderItems',
          include: [{
            model: EventSeat, as: 'eventSeat',
            include: [{ model: Seat, as: 'seat' }]
          }]
        }
      ],
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    
    if (!order) {
      await t.rollback();
      throw new AppError('Invalid ticket / Vé không tồn tại', 404);
    }

    if (order.checkInTime) {
      await t.rollback();
      return { valid: false, message: 'Vé đã được check-in trước đó' };
    }

    order.checkInTime = new Date();
    await order.save({ transaction: t });

    let seatsString = '';
    if (order.orderItems && order.orderItems.length > 0) {
      seatsString = order.orderItems.map(item => {
        if (item.eventSeat && item.eventSeat.seat) {
          return `${item.eventSeat.seat.rowLabel}${item.eventSeat.seat.colNumber}`;
        }
        return item.seatNumber;
      }).join(', ');
    }

    await t.commit();
    return { 
      valid: true, 
      message: 'Check-in thành công!',
      eventTitle: order.event ? order.event.title : 'N/A',
      userName: order.user ? (order.user.fullName || order.user.username) : 'N/A',
      seats: seatsString || 'N/A'
    };
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    throw error;
  }
};
