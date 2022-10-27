const express = require('express');
const { uploadProfilePhoto } = require('../controllers/user');

const router = express.Router();

const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/multer');

router.post(
  '/upload-profile-photo',
  protect,
  uploadImage.single('image'),
  uploadProfilePhoto
);

module.exports = router;
