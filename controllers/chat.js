const User = require('../models/User');
const Chat = require('../models/Chat');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const cloudinary = require('cloudinary');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

const { isValidObjectId } = mongoose;

// @desc    Create Chat
// @route   POST /api/v1/create-chat
// @access  Private
exports.createChat = asyncHandler(async (req, res, next) => {
  const {
    body: { chatUsers },
    user: { id },
  } = req;

  if (!chatUsers || chatUsers?.length < 2) {
    return next(new ErrorResponse('Chat users must be 2', 400));
  }

  if (chatUsers[0].toString() === chatUsers[1].toString()) {
    return next(new ErrorResponse('Invalid User IDs', 400));
  }

  for (const id of chatUsers) {
    if (!isValidObjectId(id)) {
      return next(new ErrorResponse('Please send valid user IDs', 400));
    }
  }

  if (chatUsers[1].toString() !== id.toString()) {
    return next(new ErrorResponse('Invalid User IDs', 400));
  }

  const existedChat = await Chat.findOne({ users: chatUsers });
  if (existedChat) {
    return next(new ErrorResponse('Chat already existed', 400));
  }

  const newChat = await Chat.create({ users: chatUsers });

  console.log({ newChat });

  return res.status(201).json({
    success: true,
    createdChatId: newChat._id,
  });
});

// @desc    Create Chat
// @route   GET /api/v1/find-chat-with-ids/:selectedUserId
// @access  Private
exports.findChat = asyncHandler(async (req, res, next) => {
  const {
    params: { selectedUserId },
    user: { id },
  } = req;

  if (!selectedUserId) {
    return next(new ErrorResponse('Selected User id is required', 400));
  }

  if (!isValidObjectId(selectedUserId)) {
    return next(new ErrorResponse('Please provide a valid user id', 400));
  }

  const users = [selectedUserId, id];
  console.log(users);

  const existedChat = await Chat.findOne({ users });

  if (!existedChat) {
    return next(new ErrorResponse('Chat not found', 404));
  }

  return res.json({
    success: true,
    chatId: existedChat._id,
  });
});
