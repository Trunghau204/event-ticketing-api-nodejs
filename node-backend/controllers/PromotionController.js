const { Promotion, sequelize } = require('../schemas');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');

exports.getActivePromotions = async () => {
  const now = new Date();
  return await Promotion.findAll({
    where: { isActive: true, startDate: { [Op.lte]: now }, endDate: { [Op.gte]: now } },
    attributes: ['id', 'code', 'description', 'discountType', 'discountValue', 'minOrderValue', 'maxDiscount', 'startDate', 'endDate'],
    order: [['createdAt', 'DESC']],
  });
};

exports.getPromotions = async () => {
  return await Promotion.findAll({ order: [['createdAt', 'DESC']] });
};

exports.createPromotion = async (body) => {
  const { code, description, discountType, discountValue, minOrderValue, maxDiscount, startDate, endDate, usageLimit } = body;
  if (!code || !discountType || !discountValue || !startDate || !endDate) {
    throw new AppError('Thiếu thông tin bắt buộc (code, discountType, discountValue, startDate, endDate)', 400);
  }
  const exists = await Promotion.findOne({ where: { code: code.toUpperCase() } });
  if (exists) throw new AppError('Mã giảm giá đã tồn tại', 400);
  return await Promotion.create({
    code: code.toUpperCase(), description, discountType, discountValue,
    minOrderValue: minOrderValue || 0, maxDiscount, startDate, endDate, usageLimit: usageLimit || 0,
  });
};

exports.updatePromotion = async (promoId, body) => {
  const promo = await Promotion.findByPk(promoId);
  if (!promo) throw new AppError('Promotion not found', 404);
  await promo.update(body);
  return promo;
};

exports.deletePromotion = async (promoId) => {
  const promo = await Promotion.findByPk(promoId);
  if (!promo) throw new AppError('Promotion not found', 404);
  await promo.destroy();
  return { message: 'Đã xóa mã giảm giá' };
};

exports.validatePromoCode = async ({ code, orderTotal }) => {
  if (!code) throw new AppError('Vui lòng nhập mã giảm giá', 400);
  const promo = await Promotion.findOne({ where: { code: code.toUpperCase(), isActive: true } });
  if (!promo) throw new AppError('Mã giảm giá không tồn tại hoặc đã hết hạn', 404);
  const now = new Date();
  if (now < new Date(promo.startDate) || now > new Date(promo.endDate)) {
    throw new AppError('Mã giảm giá đã hết hạn hoặc chưa có hiệu lực', 400);
  }
  if (promo.usageLimit > 0 && promo.usageCount >= promo.usageLimit) {
    throw new AppError('Mã giảm giá đã hết lượt sử dụng', 400);
  }
  if (orderTotal && orderTotal < promo.minOrderValue) {
    throw new AppError(`Đơn hàng tối thiểu ${promo.minOrderValue.toLocaleString()} VNĐ để áp dụng mã này`, 400);
  }
  let discountAmount = 0;
  if (promo.discountType === 'PERCENTAGE') {
    discountAmount = (orderTotal || 0) * (promo.discountValue / 100);
    if (promo.maxDiscount && discountAmount > promo.maxDiscount) discountAmount = promo.maxDiscount;
  } else {
    discountAmount = promo.discountValue;
  }
  return {
    valid: true, promotionId: promo.id, code: promo.code,
    discountType: promo.discountType, discountValue: promo.discountValue,
    discountAmount: Math.round(discountAmount),
    message: `Áp dụng thành công! Giảm ${Math.round(discountAmount).toLocaleString()} VNĐ`,
  };
};
