const { Venue, Seat, Event, EventSeat, sequelize } = require('../schemas');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');

const formatVenue = async (venue) => {
  const data = venue.toJSON();
  const actualSeatCount = await Seat.count({ where: { venue_id: venue.id } });
  data.totalSeats = actualSeatCount;
  return data;
};

exports.getAllVenues = async () => {
  const venues = await Venue.findAll();
  const responses = [];
  for (const v of venues) {
    responses.push(await formatVenue(v));
  }
  return responses;
};

exports.getVenueById = async (venueId) => {
  const venue = await Venue.findByPk(venueId);
  if (!venue) throw new AppError('Venue not found', 404);
  return await formatVenue(venue);
};

exports.createVenue = async (body) => {
  const { name, address, totalRows, totalColumns, seatRows } = body;
  
  const venue = await Venue.create({ 
    name, 
    address, 
    totalRows: seatRows ? seatRows.length : (totalRows || 0), 
    totalColumns: seatRows ? Math.max(...seatRows.map(r => r.seatCount || 0)) : (totalColumns || 0)
  });

  const seatsData = [];
  if (seatRows && seatRows.length > 0) {
    for (const row of seatRows) {
      for (let col = 1; col <= row.seatCount; col++) {
        seatsData.push({
          venue_id: venue.id,
          rowLabel: row.label,
          colNumber: col,
          seatType: row.seatType || 'STANDARD'
        });
      }
    }
  } else {
    for (let r = 0; r < (totalRows || 0); r++) {
      const label = String.fromCharCode(65 + r);
      for (let c = 1; c <= (totalColumns || 0); c++) {
        seatsData.push({
          venue_id: venue.id,
          rowLabel: label,
          colNumber: c,
          seatType: 'STANDARD'
        });
      }
    }
  }

  if (seatsData.length > 0) {
    await Seat.bulkCreate(seatsData);
  }

  return await formatVenue(venue);
};

exports.updateVenue = async (venueId, body) => {
  const t = await sequelize.transaction();
  try {
    const { name, address, seatRows } = body;
    const venue = await Venue.findByPk(venueId, { transaction: t });
    if (!venue) {
      await t.rollback();
      throw new AppError('Venue not found', 404);
    }

    const updateData = { name, address };
    if (seatRows) {
      updateData.totalRows = seatRows.length;
      updateData.totalColumns = Math.max(...seatRows.map(r => r.seatCount || 0));
    }
    await venue.update(updateData, { transaction: t });

    if (seatRows && seatRows.length > 0) {
      const existingSeats = await Seat.findAll({ where: { venue_id: venue.id }, transaction: t });
      const requestedLabels = seatRows.map(r => r.label);

      for (const es of existingSeats) {
        if (!requestedLabels.includes(es.rowLabel)) {
          const hasBookings = await EventSeat.count({ 
            where: { seat_id: es.id, status: { [Op.ne]: 'AVAILABLE' } },
            transaction: t
          });
          if (hasBookings === 0) {
            await EventSeat.destroy({ where: { seat_id: es.id }, transaction: t });
            await es.destroy({ transaction: t });
          }
        }
      }

      const newSeatsForEvents = [];
      for (const config of seatRows) {
        const rowSeats = await Seat.findAll({ 
          where: { venue_id: venue.id, rowLabel: config.label },
          order: [['colNumber', 'ASC']],
          transaction: t
        });

        const existingCount = rowSeats.length;
        const wantedCount = config.seatCount;

        for (let col = existingCount + 1; col <= wantedCount; col++) {
          const newSeat = await Seat.create({
            venue_id: venue.id,
            rowLabel: config.label,
            colNumber: col,
            seatType: config.seatType
          }, { transaction: t });
          newSeatsForEvents.push(newSeat);
        }

        if (wantedCount < existingCount) {
          const extraSeats = rowSeats.filter(s => s.colNumber > wantedCount);
          for (const s of extraSeats) {
            const hasBookings = await EventSeat.count({ 
              where: { seat_id: s.id, status: { [Op.ne]: 'AVAILABLE' } },
              transaction: t
            });
            if (hasBookings === 0) {
              await EventSeat.destroy({ where: { seat_id: s.id }, transaction: t });
              await s.destroy({ transaction: t });
            }
          }
        }

        for (const s of rowSeats) {
          if (s.colNumber <= wantedCount && s.seatType !== config.seatType) {
            s.seatType = config.seatType;
            await s.save({ transaction: t });
          }
        }
      }

      if (newSeatsForEvents.length > 0) {
        const events = await Event.findAll({ where: { venue_id: venue.id }, transaction: t });
        const eventSeatsData = [];
        for (const event of events) {
          for (const ns of newSeatsForEvents) {
            eventSeatsData.push({
              event_id: event.id,
              seat_id: ns.id,
              status: 'AVAILABLE',
              price: event.price
            });
          }
        }
        if (eventSeatsData.length > 0) {
          await EventSeat.bulkCreate(eventSeatsData, { transaction: t });
        }
      }
    }

    await t.commit();
    return await formatVenue(venue);
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    throw error;
  }
};

exports.deleteVenue = async (venueId) => {
  const t = await sequelize.transaction();
  try {
    const venue = await Venue.findByPk(venueId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!venue) {
      await t.rollback();
      throw new AppError('Venue not found', 404);
    }

    const seats = await Seat.findAll({ where: { venue_id: venue.id }, transaction: t });
    const seatIds = seats.map(s => s.id);
    const hasBookings = await EventSeat.count({ 
      where: { seat_id: seatIds, status: { [Op.ne]: 'AVAILABLE' } },
      transaction: t
    });

    if (hasBookings > 0) {
      await t.rollback();
      throw new AppError('Cannot delete venue: some seats are already booked/paid in events.', 400);
    }

    await EventSeat.destroy({ where: { seat_id: seatIds }, transaction: t });
    await Seat.destroy({ where: { venue_id: venue.id }, transaction: t });
    await venue.destroy({ transaction: t });
    
    await t.commit();
    return { message: 'Venue deleted' };
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    throw error;
  }
};
