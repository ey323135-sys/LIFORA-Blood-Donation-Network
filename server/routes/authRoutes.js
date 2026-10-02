const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  googleAuth, 
  verifyEmail, 
  forgotPassword, 
  resetPassword, 
  completeProfile, 
  getMe, 
  changePassword, 
  logout 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', protect, getMe);
router.post('/complete-profile', protect, completeProfile);
router.post('/change-password', protect, changePassword);
router.post('/logout', protect, logout);

module.exports = router;
