const jwt = require('jsonwebtoken');
require('dotenv').config();

// In-memory token blacklist (lưu các token đã logout)
const tokenBlacklist = new Set();

const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  // Kiểm tra token đã bị logout chưa
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ message: 'Token has been invalidated (logged out)' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }

  req.user = decoded;
  next();
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
    next();
  };
};

const blacklistToken = (token) => {
  tokenBlacklist.add(token);
};

module.exports = { signToken, verifyToken, protect, restrictTo, blacklistToken };
