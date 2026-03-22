const { recordInteraction, getUserInteractions, getInteractionStats } = require('../services/interactionService');
const { getRecommendations, getTrendingProducts } = require('../services/recommendationService');
const { User } = require('../models/User');
const { delCache } = require('../config/redis');

// POST /interactions
const createInteraction = async (req, res, next) => {
  try {
    const { productId, action, metadata } = req.body;
    const userId = req.user._id;

    const interaction = await recordInteraction(userId, productId, action, metadata);

    // Invalidate user's recommendation cache on meaningful actions
    if (['purchase', 'cart', 'wishlist'].includes(action)) {
      await delCache(`rec:${userId}`);
    }

    res.status(201).json({ success: true, interaction });
  } catch (error) {
    next(error);
  }
};

// GET /recommendations/:userId
const getRecommendationsForUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    // Only allow users to get their own recommendations (or admin any)
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const recommendations = await getRecommendations(userId, parseInt(limit) || 12);
    res.json({ success: true, recommendations });
  } catch (error) {
    next(error);
  }
};

// GET /trending
const getTrending = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const trending = await getTrendingProducts(parseInt(limit) || 12);
    res.json({ success: true, trending });
  } catch (error) {
    next(error);
  }
};

// GET /users/:userId/interactions
const getUserHistory = async (req, res, next) => {
  try {
    const interactions = await getUserInteractions(req.user._id);
    res.json({ success: true, interactions });
  } catch (error) {
    next(error);
  }
};

// Cart operations
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const existingItem = user.cart.find((item) => item.productId.toString() === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ productId, quantity });
    }
    await user.save();

    // Record interaction
    recordInteraction(userId, productId, 'cart').catch(() => {});

    res.json({ success: true, cart: user.cart });
  } catch (error) {
    next(error);
  }
};

// PATCH /cart/:productId — set quantity absolutely (replaces delta approach)
const updateCartQty = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const user = await User.findById(req.user._id);

    if (quantity <= 0) {
      // Remove item
      user.cart = user.cart.filter((item) => item.productId.toString() !== productId);
    } else {
      const item = user.cart.find((item) => item.productId.toString() === productId);
      if (item) {
        item.quantity = quantity;
      } else {
        user.cart.push({ productId, quantity });
      }
    }
    await user.save();
    res.json({ success: true, cart: user.cart });
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter((item) => item.productId.toString() !== productId);
    await user.save();
    res.json({ success: true, cart: user.cart });
  } catch (error) {
    next(error);
  }
};

const getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('cart.productId', 'name price thumbnail images stats discount')
      .lean();
    res.json({ success: true, cart: user.cart });
  } catch (error) {
    next(error);
  }
};

// Wishlist operations
const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user._id);
    const isWishlisted = user.wishlist.some((id) => id.toString() === productId);

    if (isWishlisted) {
      user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
    } else {
      user.wishlist.push(productId);
      recordInteraction(req.user._id, productId, 'wishlist').catch(() => {});
    }
    await user.save();

    res.json({ success: true, wishlisted: !isWishlisted, wishlist: user.wishlist });
  } catch (error) {
    next(error);
  }
};

const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('wishlist', 'name price thumbnail images stats discount category')
      .lean();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    next(error);
  }
};

// Admin stats
const getAdminInteractionStats = async (req, res, next) => {
  try {
    const { days } = req.query;
    const stats = await getInteractionStats(parseInt(days) || 30);
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

// Search history
const addSearchHistory = async (req, res, next) => {
  try {
    const { query } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        searchHistory: {
          $each: [{ query, searchedAt: new Date() }],
          $position: 0,
          $slice: 20,
        },
      },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInteraction,
  getRecommendationsForUser,
  getTrending,
  getUserHistory,
  addToCart,
  updateCartQty,
  removeFromCart,
  getCart,
  toggleWishlist,
  getWishlist,
  getAdminInteractionStats,
  addSearchHistory,
};
