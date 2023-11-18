const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const cloudinary = require('cloudinary');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

const { isValidObjectId } = mongoose;

exports.createOrOpenChat = asyncHandler(async (req, res, next) => {
  const {
    user,
    body: { receiverId },
  } = req;
  const senderId = user.id;

  if (!receiverId)
    return next(new ErrorResponse('Please provide a receiver ID', 400));

  if (!isValidObjectId(receiverId))
    return next(new ErrorResponse('Please provide a valid receiver ID', 400));

  if (receiverId.toString() === senderId.toString())
    return next(
      new ErrorResponse('You can not create a conversation with yourself!', 400)
    );

  let isAlreadyExistedChat = await Chat.find({
    isGroup: false,
    // in users fields -> exist senderId AND($and) receiverId
    $and: [
      { users: { $elemMatch: { $eq: senderId } } },
      { users: { $elemMatch: { $eq: receiverId } } },
    ],
  });

  if (!isAlreadyExistedChat)
    return next(new ErrorResponse('OOPS! something went wrong!', 400));

  isAlreadyExistedChat = await Chat.populate(isAlreadyExistedChat, {
    path: 'latestMessage.sender',
    select: 'firstName lastName email picture status',
  });

  const chat = isAlreadyExistedChat[0];

  if (!chat) {
    const receiver = await User.findById(receiverId);
    if (!receiver) return next(new ErrorResponse('User not found!', 404));

    const newChat = await Chat.create({
      isGroup: false,
      users: [senderId, receiver._id],
    });
    if (!newChat)
      return next(new ErrorResponse('OOPS! something went wrong!', 400));

    const populatedNewChat = await Chat.findOne({
      _id: newChat._id,
    })
      .populate('users', 'firstName lastName image')
      .populate('latestMessage', 'message files sender createdAt');

    return res.json({
      status: 'success',
      data: { data: populatedNewChat },
    });
  }

  return res.json({
    status: 'success',
    data: {
      data: chat,
    },
  });
});

exports.findChat = asyncHandler(async (req, res, next) => {
  const {
    params: { selectedUserId },
    user: { id },
  } = req;

  // console.log({ selectedUserId });
  // console.log({ id });

  if (!selectedUserId) {
    return next(new ErrorResponse('Selected User id is required', 400));
  }

  if (!isValidObjectId(selectedUserId)) {
    return next(new ErrorResponse('Please provide a valid user id', 400));
  }

  const chatUserIds = [selectedUserId, id];

  const existedChat = await Chat.findOne({
    users: { $all: chatUserIds },
  }).select({ _id: 1, latestMessage: 1 });

  if (!existedChat) {
    return next(new ErrorResponse('Chat not found', 404));
  }

  const messages = await Message.find({ chat: existedChat._id })
    .populate('sender', 'firstName lastName image.url')
    .select({ content: 1, sender: 1 });

  return res.json({
    success: true,
    existedChat,
    messages,
  });
});

exports.getChats = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const chats = await Chat.find({
    users: { $elemMatch: { $eq: user._id } },
  })
    .populate('users', 'firstName lastName image')
    .populate('latestMessage', 'message files sender createdAt')
    .sort('-updatedAt');

  return res.json({
    status: 'success',
    data: { data: chats },
  });
});
