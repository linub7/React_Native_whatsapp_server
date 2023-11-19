const Chat = require('../models/Chat');
const Message = require('../models/Message');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

const { isValidObjectId } = require('mongoose');
const { uploadImageToCloudinary } = require('../utils/imageUpload');

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

  // if (!isChatExist.isGroup) {
  //   const isMeAllowedToSendMessageToThisChat = await Chat.findOne({
  //     _id: chat,
  //     users: user._id,
  //   });
  //   if (!isMeAllowedToSendMessageToThisChat) {
  //     return next(
  //       new ErrorResponse('You can not send a message to a foreign chat!', 403)
  //     );
  //   }
  // }

  const isMeAllowedToSendMessageToThisChat = await Chat.findOne({
    _id: chat,
    users: user._id,
  });

  if (!isMeAllowedToSendMessageToThisChat) {
    return next(
      new ErrorResponse('You can not send a message to a foreign chat!', 403)
    );
  }

  if (!message && !req.file)
    return next(new ErrorResponse('Please provide a message or files!', 400));

  let files = [];
  if (req.file) {
    const payload = await uploadImageToCloudinary(req?.file?.path);
    files.push(payload);
  }

  const newMessage = await Message.create({
    sender: user.id,
    chat: isChatExist._id,
    message,
    files: files || [],
  });

  isChatExist.latestMessage = newMessage._id;

  const populatedMessage = await Message.findById(newMessage?._id)
    .populate({
      path: 'sender',
      select: 'firstName lastName image',
    })
    .populate({
      path: 'chat',
      select: 'isGroup',
    });

  await isChatExist.save({ validateBeforeSave: false });

  return res.json({
    status: 'success',
    data: {
      data: populatedMessage,
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
  })
    .populate({ path: 'sender', select: 'firstName lastName image' })
    .populate({ path: 'chat', select: 'isGroup' });

  return res.json({
    status: 'success',
    data: { data: conversationMessages },
  });
});

exports.toggleStarMessage = asyncHandler(async (req, res, next) => {
  const {
    user,
    body: { chatId },
    params: { id: messageId },
  } = req;

  if (!messageId)
    return next(new ErrorResponse('Please insert a message id', 400));

  if (!chatId || !isValidObjectId(chatId))
    return next(new ErrorResponse('Please insert a proper chat id', 400));

  const existedChat = await Chat.findOne({ _id: chatId, users: user?._id });
  if (!existedChat) return next(new ErrorResponse('Chat not found!', 404));

  const existedMessage = await Message.findOne({
    _id: messageId,
    chat: existedChat?._id,
  })
    .populate({ path: 'sender', select: 'firstName lastName image' })
    .populate({ path: 'chat', select: 'isGroup' });

  if (!existedMessage)
    return next(new ErrorResponse('Message not found!', 404));

  if (existedMessage.isStared) {
    existedMessage.isStared = false;
  } else {
    existedMessage.isStared = true;
  }

  await existedMessage.save({ validateBeforeSave: false });

  return res.json({
    status: 'success',
    data: { data: existedMessage },
  });
});

exports.sendReplyMessage = asyncHandler(async (req, res, next) => {
  const {
    user,
    params: { id: messageId },
    body: { message, chat },
  } = req;

  if (!chat || !isValidObjectId(chat))
    return next(new ErrorResponse('Please provide a valid chat id', 400));

  const isChatExist = await Chat.findById(chat);

  if (!isChatExist) return next(new ErrorResponse('chat not found!', 404));

  // if (!isChatExist.isGroup) {
  //   const isMeAllowedToSendMessageToThisChat = await Chat.findOne({
  //     _id: chat,
  //     users: user._id,
  //   });
  //   if (!isMeAllowedToSendMessageToThisChat) {
  //     return next(
  //       new ErrorResponse('You can not send a message to a foreign chat!', 403)
  //     );
  //   }
  // }
  const isMeAllowedToSendMessageToThisChat = await Chat.findOne({
    _id: chat,
    users: user._id,
  });
  if (!isMeAllowedToSendMessageToThisChat) {
    return next(
      new ErrorResponse('You can not send a message to a foreign chat!', 403)
    );
  }

  if (!message && !req.file)
    return next(new ErrorResponse('Please provide a message or files!', 400));

  let files = [];
  if (req.file) {
    const payload = await uploadImageToCloudinary(req?.file?.path);
    files.push(payload);
  }

  const repliedMessage = await Message.findById(messageId);

  if (!repliedMessage)
    return next(new ErrorResponse('Message not found!', 404));

  const newMessage = await Message.create({
    sender: user.id,
    chat: isChatExist._id,
    message,
    files: files || [],
    isReply: true,
    replyTo: repliedMessage?._id,
  });

  isChatExist.latestMessage = newMessage._id;

  const populatedMessage = await Message.findById(newMessage?._id)
    .populate({
      path: 'replyTo',
    })
    .populate({
      path: 'sender',
      select: 'firstName lastName image',
    })
    .populate({
      path: 'chat',
      select: 'isGroup',
    });

  await isChatExist.save({ validateBeforeSave: false });

  return res.json({
    status: 'success',
    data: {
      data: populatedMessage,
    },
  });
});
