const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');
const User = require('./User');
const Event = require('./Event');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'PAID', 'CANCELLED', 'COMPLETED'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  totalAmount: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  ticketPdfPath: {
    type: DataTypes.STRING,
  },
  qrCodePath: {
    type: DataTypes.STRING,
  },
  paymentTime: {
    type: DataTypes.DATE,
  },
  checkInTime: {
    type: DataTypes.DATE,
  },
  stripeSessionId: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'orders',
  timestamps: true,
});

Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Order.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

module.exports = Order;
