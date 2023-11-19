const express = require('express');
const trimRequest = require('trim-request');
const {
  createOrOpenChat,
  findChat,
  getChats,
  createGroupChat,
} = require('../controllers/chat');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.get('/chats/:selectedUserId', protect, findChat);

router
  .route('/chats')
  .get(trimRequest.all, protect, getChats)
  .post(trimRequest.all, protect, createOrOpenChat);

router.route('/chats/group').post(trimRequest.all, protect, createGroupChat);

module.exports = router;
