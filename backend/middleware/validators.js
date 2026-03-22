const { body, param, query, validationResult } = require('express-validator');

// Middleware to check validation results and return 400 on failure
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Auth validators ────────────────────────────────────────────────────────────
const signupRules = [
  body('name')
    .trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name max 100 chars'),
  body('email')
    .trim().isEmail().withMessage('Valid email required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password min 6 characters'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
];

// ── Product validators ─────────────────────────────────────────────────────────
const createProductRules = [
  body('name').trim().notEmpty().withMessage('Name required')
    .isLength({ max: 200 }).withMessage('Name max 200 chars'),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('category').isIn([
    'Electronics', 'Clothing', 'Books', 'Home & Kitchen',
    'Sports', 'Beauty', 'Toys', 'Automotive', 'Food', 'Other',
  ]).withMessage('Invalid category'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount 0-100'),
];

const reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  body('comment').optional().isLength({ max: 500 }).withMessage('Comment max 500 chars'),
];

// ── Interaction validators ─────────────────────────────────────────────────────
const interactionRules = [
  body('productId').notEmpty().isMongoId().withMessage('Valid productId required'),
  body('action').isIn(['view', 'cart', 'purchase', 'wishlist', 'review', 'search_click'])
    .withMessage('Invalid action'),
];

const cartRules = [
  body('productId').notEmpty().isMongoId().withMessage('Valid productId required'),
  body('quantity').optional().isInt({ min: 1, max: 100 }).withMessage('Quantity 1-100'),
];

// ── Query validators ───────────────────────────────────────────────────────────
const paginationRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit 1-100'),
];

module.exports = {
  validate,
  signupRules,
  loginRules,
  createProductRules,
  reviewRules,
  interactionRules,
  cartRules,
  paginationRules,
};
