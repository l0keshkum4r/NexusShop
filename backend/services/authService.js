const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const signup = async ({ name, email, password, role }) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('Email already registered');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.create({ name, email, password, role: role || 'user' });
  const token = generateToken(user._id);

  return { user, token };
};

const login = async ({ email, password }) => {
  // Include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Account is deactivated');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id);
  // Remove password from output
  user.password = undefined;

  return { user, token };
};

module.exports = { signup, login, generateToken };
