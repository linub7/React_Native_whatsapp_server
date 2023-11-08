const express = require('express');
const trimRequest = require('trim-request');
const { createOrOpenChat, findChat, getChats } = require('../controllers/chat');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.get('/chats/:selectedUserId', protect, findChat);

router
  .route('/chats')
  .get(trimRequest.all, protect, getChats)
  .post(trimRequest.all, protect, createOrOpenChat);

module.exports = router;
