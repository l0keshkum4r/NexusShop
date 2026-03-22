const express = require('express');
const router = express.Router();
const {
  createInteraction, getRecommendationsForUser, getTrending,
  getUserHistory, addToCart, updateCartQty, removeFromCart, getCart,
  toggleWishlist, getWishlist, addSearchHistory,
} = require('../controllers/interactionController');
const { authenticate } = require('../middleware/auth');
const { interactionRules, cartRules, validate } = require('../middleware/validators');
const { body } = require('express-validator');

const updateQtyRules = [
  body('quantity').isInt({ min: 0, max: 1000 }).withMessage('Quantity must be 0-1000'),
];

router.get('/trending',                    getTrending);
router.post('/',     authenticate, interactionRules, validate, createInteraction);
router.get('/history', authenticate,       getUserHistory);
router.get('/recommendations/:userId',     authenticate, getRecommendationsForUser);
router.get('/cart',   authenticate,        getCart);
router.post('/cart',  authenticate, cartRules, validate, addToCart);
router.patch('/cart/:productId', authenticate, updateQtyRules, validate, updateCartQty);
router.delete('/cart/:productId', authenticate, removeFromCart);
router.get('/wishlist',  authenticate,     getWishlist);
router.post('/wishlist', authenticate,     toggleWishlist);
router.post('/search-history', authenticate, addSearchHistory);

module.exports = router;
