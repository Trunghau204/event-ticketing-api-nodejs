const { Notification, sequelize } = require('../schemas');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');

exports.getUserNotifications = async (userId) => {
  const notifications = await Notification.findAll({
    where: { user_id: userId },
    order: [['createdAt', 'DESC']],
    limit: 50,
  });
  const unreadCount = await Notification.count({
    where: { user_id: userId, isRead: false },
  });
  return { notifications, unreadCount };
};

exports.markAsRead = async (notifId, userId) => {
  const notif = await Notification.findByPk(notifId);
  if (!notif) throw new AppError('Notification not found', 404);
  if (notif.user_id !== userId) throw new AppError('Unauthorized', 403);
  notif.isRead = true;
  await notif.save();
  return notif;
};

exports.markAllAsRead = async (userId) => {
  await Notification.update(
    { isRead: true },
    { where: { user_id: userId, isRead: false } }
  );
  return { message: 'Đã đánh dấu tất cả là đã đọc' };
};

exports.createNotification = async ({ userId, title, message, type, referenceId, referenceType, transaction }) => {
  return Notification.create({
    user_id: userId, title, message,
    type: type || 'SYSTEM', referenceId, referenceType,
  }, transaction ? { transaction } : {});
};
