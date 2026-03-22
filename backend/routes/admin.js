const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getAdminStats } = require('../controllers/productController');
const { getAdminInteractionStats } = require('../controllers/interactionController');
const { User } = require('../models/User');

// All admin routes require auth + admin role
router.use(authenticate, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/interactions/stats', getAdminInteractionStats);

// User management
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find().select('-password').skip(skip).limit(Number(limit)).sort('-createdAt'),
      User.countDocuments(),
    ]);
    res.json({ success: true, users, total, page: Number(page) });
  } catch (error) { next(error); }
});

router.put('/users/:id/role', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (error) { next(error); }
});

router.put('/users/:id/status', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (error) { next(error); }
});

module.exports = router;
