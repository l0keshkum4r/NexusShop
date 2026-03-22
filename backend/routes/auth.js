const express = require('express');
const router = express.Router();
const {
  signupController,
  loginController,
  profileController,
  updateProfileController,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { signupRules, loginRules, validate } = require('../middleware/validators');

router.post('/signup', signupRules, validate, signupController);
router.post('/login', loginRules, validate, loginController);
router.get('/profile', authenticate, profileController);
router.put('/profile', authenticate, updateProfileController);

module.exports = router;
