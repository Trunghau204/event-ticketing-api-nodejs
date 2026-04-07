const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');
const Cart = require('./Cart');
const EventSeat = require('./EventSeat');
const Event = require('./Event');

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
}, {
  tableName: 'cart_items',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['cart_id', 'event_seat_id'],
    },
  ],
});

CartItem.belongsTo(Cart, { foreignKey: 'cart_id', as: 'cart' });
Cart.hasMany(CartItem, { foreignKey: 'cart_id', as: 'cartItems' });

CartItem.belongsTo(EventSeat, { foreignKey: 'event_seat_id', as: 'eventSeat' });
EventSeat.hasMany(CartItem, { foreignKey: 'event_seat_id', as: 'cartItems' });

CartItem.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });
Event.hasMany(CartItem, { foreignKey: 'event_id', as: 'cartItems' });

module.exports = CartItem;
