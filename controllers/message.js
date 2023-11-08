const Chat = require('../models/Chat');
const Message = require('../models/Message');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

const { isValidObjectId } = require('mongoose');

exports.sendMessage = asyncHandler(async (req, res, next) => {
  const {
    user,
    body: { message, chat },
  } = req;
  if (!chat)
    return next(
      new ErrorResponse('Please provide message or files and chat id', 400)
    );

  if (!isValidObjectId(chat))
    return next(new ErrorResponse('Please provide a valid id', 400));

  const isChatExist = await Chat.findById(chat);

  if (!isChatExist) return next(new ErrorResponse('chat not found!', 404));

  if (!isChatExist.isGroup) {
    const isMeAllowedToSendMessageToThisChat = await Chat.findOne({
      _id: chat,
      users: user._id,
    });
    if (!isMeAllowedToSendMessageToThisChat) {
      return next(
        new ErrorResponse('You can not send a message to a foreign chat!', 403)
      );
    }
  }

  if (!message && req.files?.length < 1)
    return next(new ErrorResponse('Please provide a message or files!', 400));

  let files = [];
  if (req.files) {
    for (const file of req.files) {
      const payload = await uploadImageToCloudinary(file?.path);
      files.push(payload);
    }
  }

  const newMessage = await Message.create({
    sender: user.id,
    chat: isChatExist._id,
    message,
    files: files || [],
  });

  isChatExist.latestMessage = newMessage._id;

  await isChatExist.save({ validateBeforeSave: false });

  return res.json({
    status: 'success',
    data: {
      data: newMessage,
    },
  });
});

exports.getMessages = asyncHandler(async (req, res, next) => {
  const {
    user,
    params: { id: chatId },
  } = req;

  const isMeAllowedToGetThisChatMessages = await Chat.findOne({
    _id: chatId,
    users: user.id,
  });

  if (!isMeAllowedToGetThisChatMessages)
    return next(
      new ErrorResponse('You can not read this conversation messages!', 403)
    );

  const conversationMessages = await Message.find({
    chat: chatId,
  }).populate({ path: 'sender', select: 'name image' });

  return res.json({
    status: 'success',
    data: { data: conversationMessages },
  });
});