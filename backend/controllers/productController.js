const productService = require('../services/productService');
const { recordInteraction } = require('../services/interactionService');
const { delCache } = require('../config/redis');

const getProducts = async (req, res, next) => {
  try {
    const { page, limit, search, category, minPrice, maxPrice, sort } = req.query;
    const result = await productService.getProducts({ page, limit, search, category, minPrice, maxPrice, sort });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);

    // Record view interaction if user is authenticated
    if (req.user) {
      recordInteraction(req.user._id, product._id, 'view', {
        sessionId: req.headers['x-session-id'],
      }).catch(() => {});
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    // Invalidate cache
    await delCache(`product:${req.params.id}`);
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

const addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const product = await productService.addReview(
      req.params.id,
      req.user._id,
      req.user.name,
      rating,
      comment
    );
    // Record review interaction
    recordInteraction(req.user._id, req.params.id, 'review', { rating }).catch(() => {});
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

const getAdminStats = async (req, res, next) => {
  try {
    const stats = await productService.getAdminStats();
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  getAdminStats,
};
