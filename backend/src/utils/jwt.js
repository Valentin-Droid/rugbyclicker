const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  const payload = { id: userId };
  const secret = process.env.JWT_SECRET;
  const options = { expiresIn: process.env.JWT_EXPIRES_IN || '1h' };
  return jwt.sign(payload, secret, options);
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
