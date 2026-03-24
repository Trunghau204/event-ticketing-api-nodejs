const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');
const Event = require('./Event');
const Seat = require('./Seat');

const EventSeat = sequelize.define('EventSeat', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  status: {
    type: DataTypes.STRING, // AVAILABLE, BOOKED, RESERVED
    allowNull: false,
    defaultValue: 'AVAILABLE',
  },
  price: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
}, {
  tableName: 'event_seats',
  timestamps: true,
});

EventSeat.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });
EventSeat.belongsTo(Seat, { foreignKey: 'seat_id', as: 'seat' });
Event.hasMany(EventSeat, { foreignKey: 'event_id', as: 'eventSeats' });

module.exports = EventSeat;
