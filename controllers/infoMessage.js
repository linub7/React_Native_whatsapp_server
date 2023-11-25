const { isValidObjectId } = require('mongoose');

const Chat = require('../models/Chat');
const InfoMessage = require('../models/InfoMessage');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

exports.sendInfoMessage = asyncHandler(async (req, res, next) => {
  const {
    user,
    body: { chat, message },
  } = req;
  if (!chat || !message)
    return next(new ErrorResponse('Please add chat and info messages', 400));

  if (!isValidObjectId(chat))
    return next(new ErrorResponse('Please enter a valid chat', 400));

  const existedChat = await Chat.findOne({
    _id: chat,
    admin: user._id?.toString(),
    isGroup: true,
  });

  if (!existedChat) return next(new ErrorResponse('Chat not found!', 404));

  const newInfoMessage = await InfoMessage.create({
    message,
    chat: existedChat?._id,
  });

  return res.json({
    status: 'success',
    data: { data: newInfoMessage },
  });
});

exports.getChatInfoMessages = asyncHandler(async (req, res, next) => {
  const {
    user,
    params: { id },
  } = req;

  if (!id) return next(new ErrorResponse('Please add tour', 400));

  const existedChat = await Chat.findOne({
    _id: id,
    admin: user._id?.toString(),
    isGroup: true,
  });
  if (!existedChat) return next(new ErrorResponse('Chat not found!', 404));

  const infoMessages = await InfoMessage.find({ chat: existedChat?._id })
    .select('message createdAt')
    .sort('-createdAt');

  return res.json({
    status: 'success',
    data: { data: infoMessages },
  });
});
