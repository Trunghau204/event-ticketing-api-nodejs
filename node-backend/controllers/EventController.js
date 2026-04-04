const { Event, Venue, EventSeat, Seat, Category, sequelize } = require('../schemas');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');

const formatEventResponse = async (event) => {
  const totalSeats = await EventSeat.count({ where: { event_id: event.id } });
  const availableSeats = await EventSeat.count({ where: { event_id: event.id, status: 'AVAILABLE' } });

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    venueId: event.venue ? event.venue.id : event.venue_id,
    venueName: event.venue ? event.venue.name : null,
    venueAddress: event.venue ? event.venue.address : null,
    eventDate: event.eventDate,
    price: event.price,
    imageUrl: event.imageUrl,
    status: event.status,
    category_id: event.category_id || null,
    categoryName: event.category ? event.category.name : null,
    totalSeats,
    availableSeats
  };
};

exports.getAllEvents = async () => {
  const events = await Event.findAll({
    include: [
      { model: Venue, as: 'venue' },
      { model: Category, as: 'category' },
    ],
    order: [['eventDate', 'ASC']],
  });
  
  const responses = [];
  for (const event of events) {
    responses.push(await formatEventResponse(event));
  }
  
  return responses;
};

exports.getEventById = async (eventId) => {
  const event = await Event.findByPk(eventId, {
    include: [
      { model: Venue, as: 'venue' },
      { model: Category, as: 'category' },
    ],
  });
  if (!event) throw new AppError('Event not found', 404);
  
  return await formatEventResponse(event);
};

const getPriceForSeatType = (seatType, body) => {
  const { priceVip, priceStandard, priceEconomy, price } = body;
  if (priceVip > 0 || priceStandard > 0 || priceEconomy > 0) {
    switch (seatType) {
      case 'VIP': return priceVip || priceStandard || price;
      case 'STANDARD': return priceStandard || price;
      case 'ECONOMY': return priceEconomy || priceStandard || price;
      default: return priceStandard || price;
    }
  }
  return price || 0;
};

exports.createEvent = async (body) => {
  const t = await sequelize.transaction();
  try {
    const { title, description, eventDate, imageUrl } = body;
    const venueId = body.venueId || body.venue_id;
    
    const priceStandard = parseFloat(body.priceStandard) || parseFloat(body.price) || 0;
    const displayPrice = priceStandard;

    const dateObj = new Date(eventDate);
    if (dateObj <= new Date()) {
      await t.rollback();
      throw new AppError('Ngày sự kiện phải sau thời điểm hiện tại!', 400);
    }

    const event = await Event.create({
      title,
      description,
      category_id: body.category_id || null,
      venue_id: venueId,
      eventDate,
      price: displayPrice,
      imageUrl,
      status: 'UPCOMING'
    }, { transaction: t });

    const seats = await Seat.findAll({ where: { venue_id: venueId }, transaction: t });
    const eventSeatsData = seats.map(s => ({
      event_id: event.id,
      seat_id: s.id,
      status: 'AVAILABLE',
      price: getPriceForSeatType(s.seatType, body)
    }));

    if (eventSeatsData.length > 0) {
      await EventSeat.bulkCreate(eventSeatsData, { transaction: t });
    }

    await t.commit();
    return await formatEventResponse(event);
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    throw error;
  }
};

exports.updateEvent = async (eventId, body) => {
  const t = await sequelize.transaction();
  try {
    const { title, description, eventDate, imageUrl } = body;
    const venueId = body.venueId || body.venue_id;
    
    const event = await Event.findByPk(eventId, { transaction: t });
    if (!event) {
      await t.rollback();
      throw new AppError('Event not found', 404);
    }

    if (eventDate) {
      const dateObj = new Date(eventDate);
      if (dateObj <= new Date()) {
        await t.rollback();
        throw new AppError('Ngày sự kiện phải sau thời điểm hiện tại!', 400);
      }
    }

    const oldVenueId = event.venue_id;
    const priceStandard = parseFloat(body.priceStandard) || parseFloat(body.price) || event.price;

    await event.update({
      title,
      description,
      category_id: body.category_id !== undefined ? body.category_id : event.category_id,
      venue_id: venueId,
      eventDate,
      price: priceStandard,
      imageUrl
    }, { transaction: t });

    if (venueId && venueId !== oldVenueId) {
      await EventSeat.destroy({ where: { event_id: event.id }, transaction: t });
      const seats = await Seat.findAll({ where: { venue_id: venueId }, transaction: t });
      const eventSeatsData = seats.map(s => ({
        event_id: event.id,
        seat_id: s.id,
        status: 'AVAILABLE',
        price: getPriceForSeatType(s.seatType, body)
      }));
      if (eventSeatsData.length > 0) {
        await EventSeat.bulkCreate(eventSeatsData, { transaction: t });
      }
    } else {
      const eventSeats = await EventSeat.findAll({ 
        where: { event_id: event.id },
        include: [{ model: Seat, as: 'seat' }],
        transaction: t
      });
      for (const es of eventSeats) {
        const newPrice = getPriceForSeatType(es.seat.seatType, body);
        if (es.price !== newPrice) {
          es.price = newPrice;
          await es.save({ transaction: t });
        }
      }
    }

    await t.commit();
    return await formatEventResponse(event);
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    throw error;
  }
};

exports.deleteEvent = async (eventId) => {
  const event = await Event.findByPk(eventId);
  if (!event) throw new AppError('Event not found', 404);

  const hasBookings = await EventSeat.count({ 
    where: { event_id: event.id, status: { [Op.ne]: 'AVAILABLE' } } 
  });
  if (hasBookings > 0) {
    throw new AppError('Không thể xóa sự kiện đã có người đặt vé!', 400);
  }

  await EventSeat.destroy({ where: { event_id: event.id } });
  await event.destroy();
  return { message: 'Event deleted' };
};

exports.getEventSeats = async (eventId) => {
  const seats = await EventSeat.findAll({
    where: { event_id: eventId },
    include: [{ model: Seat, as: 'seat' }],
    order: [
      [{ model: Seat, as: 'seat' }, 'rowLabel', 'ASC'],
      [{ model: Seat, as: 'seat' }, 'colNumber', 'ASC']
    ]
  });
  
  return seats.map(es => ({
    id: es.id,
    status: es.status,
    price: es.price,
    rowLabel: es.seat ? es.seat.rowLabel : '',
    colNumber: es.seat ? es.seat.colNumber : 0,
    seatType: es.seat ? es.seat.seatType : ''
  }));
};
