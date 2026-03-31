const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');
const User = require('./User');
const Event = require('./Event');

const Wishlist = sequelize.define('Wishlist', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
}, {
  tableName: 'wishlists',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'event_id'],
    },
  ],
});

Wishlist.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Wishlist, { foreignKey: 'user_id', as: 'wishlists' });

Wishlist.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });
Event.hasMany(Wishlist, { foreignKey: 'event_id', as: 'wishlists' });

module.exports = Wishlist;
