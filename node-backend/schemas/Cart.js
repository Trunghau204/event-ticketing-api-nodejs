const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');
const User = require('./User');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
}, {
  tableName: 'carts',
  timestamps: true,
});

Cart.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(Cart, { foreignKey: 'user_id', as: 'cart' });

module.exports = Cart;
