const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');
const User = require('./User');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('ORDER_SUCCESS', 'ORDER_CANCELLED', 'EVENT_REMINDER', 'PROMOTION', 'SYSTEM'),
    allowNull: false,
    defaultValue: 'SYSTEM',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  referenceId: {
    type: DataTypes.BIGINT,
    comment: 'ID of related entity (order_id, event_id, etc.)',
  },
  referenceType: {
    type: DataTypes.STRING(50),
    comment: 'Type of related entity (ORDER, EVENT, etc.)',
  },
}, {
  tableName: 'notifications',
  timestamps: true,
});

Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

module.exports = Notification;
