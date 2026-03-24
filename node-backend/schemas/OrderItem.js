const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');
const Order = require('./Order');
const EventSeat = require('./EventSeat');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  seatNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  order_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  event_seat_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  price: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
}, {
  tableName: 'order_items',
  timestamps: true,
});

OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'orderItems' });

OrderItem.belongsTo(EventSeat, { foreignKey: 'event_seat_id', as: 'eventSeat' });

module.exports = OrderItem;
