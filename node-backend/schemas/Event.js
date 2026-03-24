const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');
const Venue = require('./Venue');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  eventDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  price: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'UPCOMING', // UPCOMING, ONGOING, COMPLETED, CANCELLED
  },
}, {
  tableName: 'events',
  timestamps: true,
});

Event.belongsTo(Venue, { foreignKey: 'venue_id', as: 'venue' });
Venue.hasMany(Event, { foreignKey: 'venue_id', as: 'events' });

module.exports = Event;
