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
    body: { receiverId, isGroup },
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

  if (!isGroup) {
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
  } else {
    // it's a group chat
    let existedGroupChat = await Chat.find({
      _id: receiverId,
      isGroup,
      users: user?._id,
    });

    if (!existedGroupChat)
      return next(new ErrorResponse('OOPS! something went wrong!', 400));

    existedGroupChat = await Chat.populate(existedGroupChat, {
      path: 'latestMessage.sender',
      select: 'firstName lastName image',
    });

    const chat = existedGroupChat[0];

    return res.json({
      status: 'success',
      data: { data: chat },
    });
  }
});

exports.findCommonChats = asyncHandler(async (req, res, next) => {
  const {
    user: { id },
    query: { otherUser },
  } = req;

  if (!otherUser) return next(new ErrorResponse('Please enter a user', 400));
  if (!isValidObjectId(otherUser))
    return next(new ErrorResponse('Please enter a valid user', 400));

  if (otherUser?.toString() === id?.toString())
    return next(new ErrorResponse('Please select another user', 400));

  const existedUser = await User.findById(otherUser);
  if (!existedUser) return next(new ErrorResponse('User not found', 404));

  const commonChats = await Chat.find({
    $and: [
      { users: { $elemMatch: { $eq: id } } },
      { users: { $elemMatch: { $eq: existedUser._id } } },
    ],
  })
    .populate('users', 'firstName lastName image about')
    .populate('latestMessage', 'message files sender createdAt')
    .sort('-updatedAt');

  return res.json({
    status: 'success',
    data: { data: commonChats },
  });
});

exports.getChats = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const chats = await Chat.find({
    users: { $elemMatch: { $eq: user._id } },
  })
    .populate('users', 'firstName lastName image about')
    .populate('latestMessage', 'message files sender createdAt')
    .sort('-updatedAt');

  return res.json({
    status: 'success',
    data: { data: chats },
  });
});

exports.createGroupChat = asyncHandler(async (req, res, next) => {
  const {
    user,
    body: { name, users },
  } = req;
  console.log({ users });
  if (!name || !users)
    return next(new ErrorResponse('Please fill all fields', 400));

  for (const el of users) {
    if (!isValidObjectId(el))
      return next(new ErrorResponse('Please enter a valid users', 400));
  }

  if (users?.length < 1)
    return next(new ErrorResponse('Please enter at least one user', 400));

  // add current user to users
  users?.push(user?._id);

  const newChat = await Chat.create({
    name,
    admin: user?._id,
    isGroup: true,
    users,
  });

  if (!newChat)
    return next(new ErrorResponse('OOPS! something went wrong', 400));

  const populatedNewChat = await Chat.findById(newChat?._id)
    .populate('users', 'firstName lastName image')
    .populate('latestMessage', 'message sender createdAt');

  console.log({ populatedNewChat });

  return res.json({
    status: 'success',
    data: { data: populatedNewChat },
  });
});
