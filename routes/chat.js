const express = require('express');
const trimRequest = require('trim-request');
const {
  createOrOpenChat,
  findCommonChats,
  getChats,
  createGroupChat,
  updateChat,
  removeUserFromGroupChat,
  deleteChat,
} = require('../controllers/chat');

const router = express.Router();

const { protect } = require('../middleware/auth');
const { isValidObjectId } = require('mongoose');
const ErrorResponse = require('../utils/errorResponse');
const { uploadImage } = require('../middleware/multer');

router.param('id', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return next(new ErrorResponse('Please provide a valid id', 400));
  }
  next();
});

router
  .route('/chats/:id')
  .put(trimRequest.all, protect, uploadImage.single('picture'), updateChat)
  .delete(trimRequest.all, protect, deleteChat);

router
  .route('/chats/users/:id')
  .put(trimRequest.all, protect, removeUserFromGroupChat);

router
  .route('/chats')
  .get(trimRequest.all, protect, getChats)
  .post(trimRequest.all, protect, createOrOpenChat);

router.route('/chats/group').post(trimRequest.all, protect, createGroupChat);
router.route('/chats/common').get(trimRequest.all, protect, findCommonChats);

module.exports = router;
