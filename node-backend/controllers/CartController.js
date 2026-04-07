const { Cart, CartItem, EventSeat, Event, Seat, Venue, Order, OrderItem, Promotion, sequelize } = require('../schemas');
const { Op } = require('sequelize');
const { createNotification } = require('./NotificationController');
const AppError = require('../utils/AppError');

exports.getCart = async (userId) => {
  let cart = await Cart.findOne({ where: { user_id: userId } });
  if (!cart) {
    cart = await Cart.create({ user_id: userId });
  }
  const cartItems = await CartItem.findAll({
    where: { cart_id: cart.id },
    include: [
      { model: EventSeat, as: 'eventSeat', include: [{ model: Seat, as: 'seat' }] },
      { model: Event, as: 'event', include: [{ model: Venue, as: 'venue' }] },
    ],
    order: [['createdAt', 'DESC']],
  });
  const validItems = [];
  for (const item of cartItems) {
    if (item.eventSeat && item.eventSeat.status === 'AVAILABLE') {
      validItems.push(item);
    } else {
      await item.destroy();
    }
  }
  const totalAmount = validItems.reduce((sum, item) => sum + (item.eventSeat ? item.eventSeat.price : 0), 0);
  return { cartId: cart.id, items: validItems, totalItems: validItems.length, totalAmount };
};

exports.addToCart = async (userId, { eventSeatId, eventId }) => {
  if (!eventSeatId || !eventId) throw new AppError('Thiếu eventSeatId hoặc eventId', 400);
  const eventSeat = await EventSeat.findByPk(eventSeatId);
  if (!eventSeat) throw new AppError('Ghế không tồn tại', 404);
  if (eventSeat.status !== 'AVAILABLE') throw new AppError('Ghế đã được đặt hoặc đang được giữ chỗ', 400);
  let cart = await Cart.findOne({ where: { user_id: userId } });
  if (!cart) cart = await Cart.create({ user_id: userId });
  const exists = await CartItem.findOne({ where: { cart_id: cart.id, event_seat_id: eventSeatId } });
  if (exists) throw new AppError('Ghế đã có trong giỏ hàng', 400);
  return await CartItem.create({ cart_id: cart.id, event_seat_id: eventSeatId, event_id: eventId });
};

exports.removeFromCart = async (userId, itemId) => {
  const cart = await Cart.findOne({ where: { user_id: userId } });
  if (!cart) throw new AppError('Giỏ hàng trống', 404);
  const item = await CartItem.findOne({ where: { id: itemId, cart_id: cart.id } });
  if (!item) throw new AppError('Không tìm thấy item trong giỏ hàng', 404);
  await item.destroy();
  return { message: 'Đã xóa khỏi giỏ hàng' };
};

exports.clearCart = async (userId) => {
  const cart = await Cart.findOne({ where: { user_id: userId } });
  if (!cart) return { message: 'Giỏ hàng đã trống' };
  await CartItem.destroy({ where: { cart_id: cart.id } });
  return { message: 'Đã xóa toàn bộ giỏ hàng' };
};

exports.checkoutCart = async (userId, { promotionCode }) => {
  const t = await sequelize.transaction();
  try {
    const cart = await Cart.findOne({ where: { user_id: userId }, transaction: t });
    if (!cart) { await t.rollback(); throw new AppError('Giỏ hàng trống', 400); }

    const cartItems = await CartItem.findAll({
      where: { cart_id: cart.id },
      include: [
        { model: EventSeat, as: 'eventSeat', include: [{ model: Seat, as: 'seat' }] },
        { model: Event, as: 'event' },
      ],
      transaction: t,
    });
    if (cartItems.length === 0) { await t.rollback(); throw new AppError('Giỏ hàng trống', 400); }

    const seatIds = cartItems.map(item => item.event_seat_id);
    const eventSeats = await EventSeat.findAll({
      where: { id: seatIds }, transaction: t, lock: t.LOCK.UPDATE,
    });

    const unavailableSeats = [];
    for (const es of eventSeats) {
      if (es.status !== 'AVAILABLE') {
        const seat = await Seat.findByPk(es.seat_id, { transaction: t });
        unavailableSeats.push(seat ? `${seat.rowLabel}${seat.colNumber}` : `Seat #${es.id}`);
      }
    }
    if (unavailableSeats.length > 0) {
      await t.rollback();
      const err = new AppError(`Ghế ${unavailableSeats.join(', ')} đã được người khác mua. Vui lòng chọn ghế khác.`, 409);
      err.unavailableSeats = unavailableSeats;
      throw err;
    }

    const eventGroups = {};
    for (const item of cartItems) {
      const eid = item.event_id;
      if (!eventGroups[eid]) eventGroups[eid] = [];
      eventGroups[eid].push(item);
    }

    const createdOrders = [];
    for (const [eventId, items] of Object.entries(eventGroups)) {
      let totalAmount = 0;
      const orderItemsData = [];
      for (const item of items) {
        const es = eventSeats.find(s => s.id === item.event_seat_id);
        es.status = 'BOOKED';
        await es.save({ transaction: t });
        totalAmount += es.price;
      }

      let discountAmount = 0;
      let promotionId = null;
      if (promotionCode) {
        const promo = await Promotion.findOne({
          where: { code: promotionCode.toUpperCase(), isActive: true },
          transaction: t, lock: t.LOCK.UPDATE,
        });
        if (!promo) { await t.rollback(); throw new AppError('Mã giảm giá không hợp lệ hoặc đã bị vô hiệu hóa', 400); }
        const now = new Date();
        if (now < new Date(promo.startDate) || now > new Date(promo.endDate)) { await t.rollback(); throw new AppError('Mã giảm giá đã hết hạn hoặc chưa có hiệu lực', 400); }
        if (promo.usageLimit > 0 && promo.usageCount >= promo.usageLimit) { await t.rollback(); throw new AppError('Mã giảm giá đã hết lượt sử dụng', 400); }
        if (totalAmount < promo.minOrderValue) { await t.rollback(); throw new AppError(`Đơn hàng phải từ ${promo.minOrderValue.toLocaleString()} VNĐ để sử dụng mã này`, 400); }
        if (promo.discountType === 'PERCENTAGE') {
          discountAmount = totalAmount * (promo.discountValue / 100);
          if (promo.maxDiscount && discountAmount > promo.maxDiscount) discountAmount = promo.maxDiscount;
        } else {
          discountAmount = promo.discountValue;
        }
        discountAmount = Math.round(discountAmount);
        promotionId = promo.id;
        promo.usageCount += 1;
        await promo.save({ transaction: t });
      }

      const finalAmount = Math.max(0, totalAmount - discountAmount);
      const order = await Order.create({
        user_id: userId, event_id: parseInt(eventId),
        totalAmount: finalAmount, discountAmount, promotion_id: promotionId, status: 'PENDING',
      }, { transaction: t });

      for (const item of items) {
        const es = eventSeats.find(s => s.id === item.event_seat_id);
        orderItemsData.push({ order_id: order.id, event_seat_id: item.event_seat_id, price: es.price, seatNumber: 'N/A' });
      }
      await OrderItem.bulkCreate(orderItemsData, { transaction: t });
      createdOrders.push(order);
    }

    await CartItem.destroy({ where: { cart_id: cart.id }, transaction: t });
    await createNotification({
      userId, title: 'Đặt vé thành công!',
      message: `Bạn đã đặt ${seatIds.length} ghế thành công. Vui lòng thanh toán trong 5 phút.`,
      type: 'ORDER_SUCCESS', referenceId: createdOrders[0]?.id, referenceType: 'ORDER', transaction: t,
    });

    await t.commit();
    return {
      message: 'Checkout thành công!',
      orders: createdOrders.map(o => ({
        id: o.id, eventId: o.event_id, totalAmount: o.totalAmount, discountAmount: o.discountAmount, status: o.status,
      })),
    };
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    throw error;
  }
};
