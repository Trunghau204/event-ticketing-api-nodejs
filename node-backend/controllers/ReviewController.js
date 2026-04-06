const { Review, User, Event, Order, sequelize } = require('../schemas');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');

exports.getReviewsByEvent = async (eventId) => {
  const reviews = await Review.findAll({
    where: { event_id: eventId },
    include: [{ model: User, as: 'user', attributes: ['id', 'username', 'fullName'] }],
    order: [['createdAt', 'DESC']],
  });

  const avg = await Review.findOne({
    where: { event_id: eventId },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews'],
    ],
    raw: true,
  });

  return {
    reviews,
    averageRating: avg.averageRating ? parseFloat(avg.averageRating).toFixed(1) : 0,
    totalReviews: parseInt(avg.totalReviews) || 0,
  };
};

exports.createReview = async (userId, { eventId, rating, comment }) => {
  if (!rating || rating < 1 || rating > 5) {
    throw new AppError('Rating phải từ 1 đến 5 sao', 400);
  }

  const hasPaidOrder = await Order.findOne({
    where: { user_id: userId, event_id: eventId, status: 'PAID' },
  });
  if (!hasPaidOrder) {
    throw new AppError('Bạn phải mua vé và tham gia sự kiện trước khi đánh giá', 403);
  }

  const existing = await Review.findOne({ where: { user_id: userId, event_id: eventId } });
  if (existing) {
    throw new AppError('Bạn đã đánh giá sự kiện này rồi', 400);
  }

  const review = await Review.create({ user_id: userId, event_id: eventId, rating, comment });
  return review;
};

exports.deleteReview = async (reviewId, currentUser) => {
  const review = await Review.findByPk(reviewId);
  if (!review) throw new AppError('Review not found', 404);

  if (review.user_id !== currentUser.id && currentUser.role !== 'ADMIN') {
    throw new AppError('Không có quyền xóa đánh giá này', 403);
  }

  await review.destroy();
  return { message: 'Đã xóa đánh giá' };
};
