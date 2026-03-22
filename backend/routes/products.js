const express = require('express');
const router = express.Router();
const {
  getProducts, getProductById, createProduct,
  updateProduct, deleteProduct, addReview, getAdminStats,
} = require('../controllers/productController');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth');
const { createProductRules, reviewRules, paginationRules, validate } = require('../middleware/validators');

router.get('/',       paginationRules, validate, optionalAuth, getProducts);
router.get('/:id',    optionalAuth, getProductById);
router.post('/:id/reviews', authenticate, reviewRules, validate, addReview);
router.post('/',      authenticate, requireAdmin, createProductRules, validate, createProduct);
router.put('/:id',    authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);
router.get('/admin/stats', authenticate, requireAdmin, getAdminStats);

module.exports = router;
