const bcrypt = require('bcryptjs');
const { User } = require('../schemas');
const { signToken, blacklistToken } = require('../utils/authHandler');
const AppError = require('../utils/AppError');

exports.register = async ({ username, email, password, fullName, phone }) => {
  const userExists = await User.findOne({ where: { email } });
  if (userExists) {
    throw new AppError('User already exists', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    fullName,
    phone,
    role: 'USER',
  });

  const token = signToken({ id: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
};

exports.login = async ({ email, username, password }) => {
  const identifier = email || username;

  const { Op } = require('sequelize');
  const user = await User.findOne({ 
    where: { 
      [Op.or]: [
        { email: identifier || '' },
        { username: identifier || '' }
      ] 
    } 
  });

  if (!user) {
    throw new AppError('Invalid credentials', 400);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 400);
  }

  const token = signToken({ id: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
};

exports.getMe = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
  });
  return user;
};

exports.logout = (token) => {
  blacklistToken(token);
  return { message: 'Đăng xuất thành công' };
};
