const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const Venue = sequelize.define('Venue', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING(500),
  },
  totalRows: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  totalColumns: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'venues',
  timestamps: true,
});

module.exports = Venue;
