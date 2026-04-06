const { Wishlist, Event, Venue } = require('../schemas');
const AppError = require('../utils/AppError');

exports.getUserWishlist = async (userId) => {
  const wishlists = await Wishlist.findAll({
    where: { user_id: userId },
    include: [{
      model: Event, as: 'event',
      include: [{ model: Venue, as: 'venue' }],
    }],
    order: [['createdAt', 'DESC']],
  });
  return wishlists;
};

exports.addToWishlist = async (userId, eventId) => {
  const event = await Event.findByPk(eventId);
  if (!event) throw new AppError('Event not found', 404);

  const existing = await Wishlist.findOne({ where: { user_id: userId, event_id: eventId } });
  if (existing) throw new AppError('Sự kiện đã có trong danh sách yêu thích', 400);

  const item = await Wishlist.create({ user_id: userId, event_id: eventId });
  return item;
};

exports.removeFromWishlist = async (userId, eventId) => {
  const item = await Wishlist.findOne({
    where: { user_id: userId, event_id: eventId },
  });
  if (!item) throw new AppError('Không tìm thấy trong danh sách yêu thích', 404);

  await item.destroy();
  return { message: 'Đã xóa khỏi danh sách yêu thích' };
};

exports.checkWishlist = async (userId, eventId) => {
  const item = await Wishlist.findOne({
    where: { user_id: userId, event_id: eventId },
  });
  return { isWishlisted: !!item };
};
