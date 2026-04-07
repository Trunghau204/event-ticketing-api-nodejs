const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');
const Venue = require('./Venue');

const Seat = sequelize.define('Seat', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  rowLabel: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  colNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  seatType: {
    type: DataTypes.STRING, // VIP, STANDARD, ECONOMY
  },
}, {
  tableName: 'seats',
  timestamps: true,
});

Seat.belongsTo(Venue, { foreignKey: 'venue_id', as: 'venue' });
Venue.hasMany(Seat, { foreignKey: 'venue_id', as: 'seats' });

module.exports = Seat;
