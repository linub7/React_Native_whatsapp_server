const express = require('express');
const trimRequest = require('trim-request');
const {
  createOrOpenChat,
  findCommonChats,
  getChats,
  createGroupChat,
} = require('../controllers/chat');

const router = express.Router();

const { protect } = require('../middleware/auth');

router
  .route('/chats')
  .get(trimRequest.all, protect, getChats)
  .post(trimRequest.all, protect, createOrOpenChat);

router.route('/chats/group').post(trimRequest.all, protect, createGroupChat);
router.route('/chats/common').get(trimRequest.all, protect, findCommonChats);

module.exports = router;
