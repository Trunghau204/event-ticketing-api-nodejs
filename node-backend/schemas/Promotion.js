const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');

const Promotion = sequelize.define('Promotion', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
  },
  discountType: {
    type: DataTypes.ENUM('PERCENTAGE', 'FIXED_AMOUNT'),
    allowNull: false,
  },
  discountValue: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  minOrderValue: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
  maxDiscount: {
    type: DataTypes.DOUBLE,
    comment: 'Maximum discount amount (for PERCENTAGE type)',
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  usageLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '0 means unlimited usage',
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'promotions',
  timestamps: true,
});

module.exports = Promotion;
