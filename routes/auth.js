const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
  updateUserInfo,
} = require('../controllers/auth');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);
router.put('/update-user-info', protect, updateUserInfo);

router.post('/forgot-password', forgotPassword);
router.put('/reset-password', resetPassword);

module.exports = router;
