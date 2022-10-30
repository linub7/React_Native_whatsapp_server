const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const cloudinary = require('cloudinary');
const { v4: uuidv4 } = require('uuid');

// @desc    Create Message
// @route   POST /api/v1/create-message
// @access  Private
exports.createMessage = asyncHandler(async (req, res, next) => {
  const {
    body: { content, chatId },
    user,
  } = req;

  if (!content || !chatId) {
    return next(new ErrorResponse('content & chatId are required', 400));
  }

  const newMessageBody = {
    sender: user.id,
    content,
    chat: chatId,
  };

  const newMessage = await Message.create(newMessageBody);
  await newMessage.populate('sender');
  await newMessage.populate('chat');
  await newMessage.populate('chat.users');

  await Chat.findByIdAndUpdate(chatId, { latestMessage: newMessage });

  return res.status(201).json({
    success: true,
    data: newMessage,
  });
});
