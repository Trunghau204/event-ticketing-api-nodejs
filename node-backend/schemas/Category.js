const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
  },
  icon: {
    type: DataTypes.STRING(100),
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'categories',
  timestamps: true,
});

module.exports = Category;
