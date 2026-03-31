const { DataTypes } = require("sequelize");
const { sequelize } = require("../utils/database");
const User = require("./User");
const Event = require("./Event");
const Promotion = require("./Promotion");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "PAID", "CANCELLED", "COMPLETED"),
      allowNull: false,
      defaultValue: "PENDING",
    },
    totalAmount: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    ticketPdfPath: {
      type: DataTypes.STRING,
    },
    qrCodePath: {
      type: DataTypes.STRING,
    },
    paymentTime: {
      type: DataTypes.DATE,
    },
    checkInTime: {
      type: DataTypes.DATE,
    },
    stripeSessionId: {
      type: DataTypes.STRING,
    },
    discountAmount: {
      type: DataTypes.DOUBLE,
      defaultValue: 0,
    },
  },
  {
    tableName: "orders",
    timestamps: true,
  },
);

Order.belongsTo(User, { foreignKey: "user_id", as: "user" });
Order.belongsTo(Event, { foreignKey: "event_id", as: "event" });
Order.belongsTo(Promotion, { foreignKey: "promotion_id", as: "promotion" });
Promotion.hasMany(Order, { foreignKey: "promotion_id", as: "orders" });

module.exports = Order;
