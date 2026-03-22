const { signup, login } = require('../services/authService');

const signupController = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const { user, token } = await signup({ name, email, password, role });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await login({ email, password });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const profileController = async (req, res) => {
  const u = req.user.toObject ? req.user.toObject() : req.user;
  res.json({
    success: true,
    user: { ...u, id: u._id || u.id },
  });
};

const updateProfileController = async (req, res, next) => {
  try {
    const { name, preferences, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (preferences) updates.preferences = preferences;
    if (avatar) updates.avatar = avatar;

    const { User } = require('../models/User');
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signupController,
  loginController,
  profileController,
  updateProfileController,
};
