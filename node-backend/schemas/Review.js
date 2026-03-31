const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/database');
const User = require('./User');
const Event = require('./Event');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  },
  comment: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'reviews',
  timestamps: true,
});

Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });

Review.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });
Event.hasMany(Review, { foreignKey: 'event_id', as: 'reviews' });

module.exports = Review;
