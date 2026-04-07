const { User, Event, Venue, Order } = require('../schemas');
const { sequelize } = require('../utils/database');
const AppError = require('../utils/AppError');

exports.getStats = async () => {
  const { OrderItem, EventSeat, Seat } = require('../schemas');
  const { Op } = require('sequelize');

  const totalUsers = await User.count();
  const totalEvents = await Event.count();
  const allEvents = await Event.findAll();

  const allOrders = await Order.findAll({
    include: [
      { model: OrderItem, as: 'orderItems' },
      { model: User, as: 'user' },
      { model: Event, as: 'event' }
    ]
  });

  const paidOrders = allOrders.filter(o => o.status === 'PAID' || o.checkInTime !== null);
  
  const totalOrders = paidOrders.length;
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCheckedIn = allOrders.filter(o => o.checkInTime !== null).length;
  const totalTicketsSold = paidOrders.reduce((sum, o) => sum + (o.orderItems ? o.orderItems.length : 0), 0);

  const revenueByEvent = [];
  for (const event of allEvents) {
    const eventOrders = paidOrders.filter(o => o.event_id === event.id);
    const revenue = eventOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const tickets = eventOrders.reduce((sum, o) => sum + (o.orderItems ? o.orderItems.length : 0), 0);
    const checked = eventOrders.filter(o => o.checkInTime !== null).length;
    
    const totalSeats = await EventSeat.count({ where: { event_id: event.id } });

    revenueByEvent.push({
      eventTitle: event.title,
      revenue,
      ticketsSold: tickets,
      checkedIn: checked,
      totalSeats
    });
  }

  const recentOrders = allOrders
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10)
    .map(o => {
      const date = new Date(o.createdAt);
      const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      return {
        orderId: o.id,
        userName: o.user ? (o.user.fullName || o.user.username) : 'Unknown',
        eventTitle: o.event ? o.event.title : 'Unknown',
        amount: o.totalAmount,
        status: o.checkInTime ? 'CHECKED_IN' : o.status,
        createdAt: formattedDate,
        seatCount: o.orderItems ? o.orderItems.length : 0
      };
    });

  return {
    totalEvents,
    totalOrders,
    totalRevenue,
    totalCheckedIn,
    totalTicketsSold,
    totalUsers,
    revenueByEvent,
    recentOrders
  };
};

exports.getAllUsers = async () => {
  const users = await User.findAll({
    attributes: { exclude: ['password'] },
  });
  return users;
};

exports.toggleUserStatus = async (targetUsername, currentUser) => {
  const user = await User.findOne({ where: { username: targetUsername } });
  if (!user) throw new AppError('Người dùng không tồn tại', 404);

  if (user.username === currentUser.username) {
    throw new AppError('Bạn không thể tự vô hiệu hoá tài khoản của chính mình!', 400);
  }

  if (user.username === 'admin') {
    throw new AppError('Không thể vô hiệu hoá tài khoản Super Admin!', 400);
  }

  const currentState = user.isEnabled !== undefined ? user.isEnabled : true;
  
  if (user.isEnabled !== undefined) {
    user.isEnabled = !currentState;
  } else {
    user.enabled = !currentState; 
  }
  
  await user.save();
  return { message: 'Đã cập nhật trạng thái người dùng' };
};

exports.getCheckinSeats = async (eventId) => {
  const { EventSeat, Seat, OrderItem } = require('../schemas');

  const eventSeats = await EventSeat.findAll({
    where: { event_id: eventId },
    include: [{ model: Seat, as: 'seat' }]
  });

  const allEventOrders = await Order.findAll({
    where: { event_id: eventId },
    include: [
      { model: OrderItem, as: 'orderItems' },
      { model: User, as: 'user' }
    ]
  });

  const seatOrderMap = {};
  for (const order of allEventOrders) {
    if (order.status === 'PAID' || order.checkInTime !== null) {
      if (order.orderItems) {
        for (const item of order.orderItems) {
          seatOrderMap[item.event_seat_id] = order;
        }
      }
    }
  }

  return eventSeats.map(es => {
    const order = seatOrderMap[es.id];
    const result = {
      id: es.id,
      rowLabel: es.seat ? es.seat.rowLabel : '',
      colNumber: es.seat ? es.seat.colNumber : 0,
      seatType: es.seat ? es.seat.seatType : '',
      status: es.status,
      price: es.price,
      checkedIn: false
    };

    if (order && order.user) {
      result.checkedIn = order.checkInTime !== null;
      result.bookedBy = order.user.fullName || order.user.username;
      result.bookedEmail = order.user.email;
      result.bookedPhone = order.user.phone;
    }

    return result;
  });
};
