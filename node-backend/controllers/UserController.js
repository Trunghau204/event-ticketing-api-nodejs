const { User } = require('../schemas');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');

exports.getProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
};

exports.updateProfile = async (userId, { fullName, phone }) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found', 404);

  await user.update({ fullName, phone });
  return user;
};

exports.changePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await User.findByPk(userId);
  
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new AppError('Current password incorrect', 400);

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await user.update({ password: hashedPassword });
  return { message: 'Password updated successfully' };
};
