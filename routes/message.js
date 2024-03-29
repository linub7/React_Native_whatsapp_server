const express = require('express');
const trimRequest = require('trim-request');
const { isValidObjectId } = require('mongoose');
const {
  sendMessage,
  getMessages,
  toggleStarMessage,
  sendReplyMessage,
} = require('../controllers/message');
const { protect } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');
const { uploadFile, uploadImage } = require('../middleware/multer');

const router = express.Router();

router.param('id', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return next(new ErrorResponse('Please provide a valid id', 400));
  }
  next();
});

router
  .route('/messages/:id')
  .get(trimRequest.all, protect, getMessages)
  .post(trimRequest.all, protect, uploadImage.single('files'), sendReplyMessage)
  .put(trimRequest.all, protect, toggleStarMessage);

router
  .route('/messages')
  .post(trimRequest.all, protect, uploadImage.single('files'), sendMessage);

module.exports = router;
