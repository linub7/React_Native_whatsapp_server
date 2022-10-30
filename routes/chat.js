const express = require('express');
const {
  createChat,
  findChat,
  findLoggedInUserChats,
} = require('../controllers/chat');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.post('/create-chat', protect, createChat);
router.get('/find-chat-with-ids/:selectedUserId', protect, findChat);
router.get('/find-logged-in-users-chats', protect, findLoggedInUserChats);

module.exports = router;
