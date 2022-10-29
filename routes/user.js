const express = require('express');
const { uploadProfilePhoto, searchUser } = require('../controllers/user');

const router = express.Router();

const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/multer');

router.post(
  '/upload-profile-photo',
  protect,
  uploadImage.single('image'),
  uploadProfilePhoto
);
router.get('/users/search', protect, searchUser);

module.exports = router;
