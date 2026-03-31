const { sequelize } = require("../utils/database");
const User = require("./User");
const Venue = require("./Venue");
const Seat = require("./Seat");
const Event = require("./Event");
const EventSeat = require("./EventSeat");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Category = require("./Category");
const Review = require("./Review");
const Wishlist = require("./Wishlist");
const Notification = require("./Notification");
const Promotion = require("./Promotion");
const Cart = require("./Cart");
const CartItem = require("./CartItem");

const db = {
  sequelize,
  User,
  Venue,
  Seat,
  Event,
  EventSeat,
  Order,
  OrderItem,
  Category,
  Review,
  Wishlist,
  Notification,
  Promotion,
  Cart,
  CartItem,
};

module.exports = db;
