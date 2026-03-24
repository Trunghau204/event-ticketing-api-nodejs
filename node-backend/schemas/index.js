const { sequelize } = require('../utils/database');
const User = require('./User');
const Venue = require('./Venue');
const Seat = require('./Seat');
const Event = require('./Event');
const EventSeat = require('./EventSeat');
const Order = require('./Order');
const OrderItem = require('./OrderItem');

const db = {
  sequelize,
  User,
  Venue,
  Seat,
  Event,
  EventSeat,
  Order,
  OrderItem,
};

module.exports = db;
