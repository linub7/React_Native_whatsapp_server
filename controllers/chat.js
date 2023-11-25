const mongoose = require('mongoose');

const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const InfoMessage = require('../models/InfoMessage');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const {
  destroyImageFromCloudinary,
  uploadImageToCloudinary,
} = require('../utils/imageUpload');

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

exports.getChat = asyncHandler(async (req, res, next) => {
  const {
    user,
    params: { id },
  } = req;
  const chat = await Chat.findOne({
    _id: id,
    users: { $elemMatch: { $eq: user._id } },
  })
    .populate('users', 'firstName lastName image about')
    .populate('latestMessage', 'message files sender createdAt')
    .sort('-updatedAt');

  return res.json({
    status: 'success',
    data: { data: chat },
  });
});

exports.createGroupChat = asyncHandler(async (req, res, next) => {
  const {
    user,
    body: { name, users },
  } = req;

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

  return res.json({
    status: 'success',
    data: { data: populatedNewChat },
  });
});

exports.updateChat = asyncHandler(async (req, res, next) => {
  const {
    user,
    params: { id },
    body: { name },
  } = req;

  if (!id) return next(new ErrorResponse('Please add chat id', 400));
  if (!req.file && !name)
    return next(new ErrorResponse('Please add picture or name', 400));

  const existedChat = await Chat.findById(id)
    .populate('users', 'firstName lastName image about')
    .populate('latestMessage', 'message files sender createdAt');

  if (!existedChat) return next(new ErrorResponse('Chat not found', 404));

  if (existedChat?.admin?._id?.toString() !== user?.id?.toString())
    return next(new ErrorResponse('Only Admin can change chat picture', 403));

  if (name) {
    existedChat.name = name;
  }

  if (req?.file) {
    if (existedChat?.picture?.public_id) {
      await destroyImageFromCloudinary(existedChat?.picture?.public_id);
      const payload = await uploadImageToCloudinary(req.file?.path);
      const { url, public_id } = payload;
      existedChat.picture = { url, public_id };
    } else {
      const payload = await uploadImageToCloudinary(req.file?.path);
      const { url, public_id } = payload;
      existedChat.picture = { url, public_id };
    }
  }

  await existedChat.save({ validateBeforeSave: false });

  return res.json({
    success: true,
    data: { data: existedChat },
  });
});

exports.removeUserFromGroupChat = asyncHandler(async (req, res, next) => {
  const {
    user,
    body: { removedUser },
    params: { id },
  } = req;

  if (!id) return next(new ErrorResponse('Please enter a chat id', 400));
  if (!removedUser)
    return next(new ErrorResponse('Please enter removed user id', 400));

  const existedUser = await User.findById(removedUser);

  if (!existedUser) return next(new ErrorResponse('User not found!', 404));

  if (user?.id?.toString() === existedUser?._id?.toString())
    return next(new ErrorResponse('Admin can not removed itself!', 404));

  const existedChat = await Chat.findOne({
    _id: id,
    $and: [
      { users: { $elemMatch: { $eq: user?.id } } },
      { users: { $elemMatch: { $eq: existedUser?._id } } },
    ],
    admin: user.id,
  })
    .populate('users', 'firstName lastName image about')
    .populate('latestMessage', 'message files sender createdAt');

  if (!existedChat) return next(new ErrorResponse('Chat not found', 404));

  let newUsers = [...existedChat?.users];

  newUsers = newUsers?.filter(
    (item) => item?._id?.toString() !== existedUser?._id?.toString()
  );

  existedChat.users = newUsers;

  const chatMessages = await Message.find({
    chat: existedChat._id.toString(),
    sender: { $ne: existedUser?._id },
  });

  const removeUserMessages = await Message.find({
    sender: existedUser._id,
    chat: existedChat._id,
  });

  for (const message of removeUserMessages) {
    if (
      existedChat.latestMessage?._id?.toString() === message?._id?.toString()
    ) {
      const newLatestMessage = chatMessages[chatMessages.length - 1];
      existedChat.latestMessage = newLatestMessage
        ? newLatestMessage._id
        : null;
    }
    if (message?.files.length > 0) {
      for (const item of message?.files) {
        await destroyImageFromCloudinary(item?.public_id);
      }
    }
    await message.remove();
  }

  await existedChat.save({ validateBeforeSave: false });

  return res.json({
    status: 'success',
    data: { data: { chat: existedChat, messages: chatMessages } },
  });
});

exports.deleteChat = asyncHandler(async (req, res, next) => {
  const {
    user,
    params: { id },
  } = req;

  if (!id) return next(new ErrorResponse('Please enter chat', 400));

  const existedChat = await Chat.findOne({
    _id: id,
    admin: user.id.toString(),
  });

  if (!existedChat) return next(new ErrorResponse('Chat not found', 404));

  if (existedChat?.picture) {
    await destroyImageFromCloudinary(existedChat?.picture?.public_id);
  }

  await existedChat.remove();

  await InfoMessage.deleteMany({ chat: existedChat._id });

  const messages = await Message.find({
    chat: existedChat._id,
  });

  for (const message of messages) {
    if (message?.files.length > 0) {
      for (const item of message?.files) {
        await destroyImageFromCloudinary(item?.public_id);
      }
    }
    await message.remove();
  }

  const remainChats = await Chat.find({
    _id: { $ne: existedChat?._id },
  })
    .populate('users', 'firstName lastName image about')
    .populate('latestMessage', 'message files sender createdAt')
    .sort('-updatedAt');

  return res.json({
    status: 'success',
    data: { data: remainChats },
  });
});

exports.leaveUserFromGroupChat = asyncHandler(async (req, res, next) => {
  const {
    user,
    params: { id },
  } = req;

  if (!id) return next(new ErrorResponse('Please enter chat', 400));

  const updatedChat = await Chat.findOneAndUpdate(
    { _id: id, users: user._id, isGroup: true, admin: { $ne: user?._id } },
    {
      $pull: {
        users: user._id,
      },
    },
    { new: true, runValidators: true }
  )
    .populate('users', 'firstName lastName image about')
    .populate('latestMessage', 'message files sender createdAt');

  if (!updatedChat)
    return next(
      new ErrorResponse(
        'Chat not found!(Admin users can not leave group, Admin only can delete chat)',
        404
      )
    );

  const chats = await Chat.find({
    users: { $elemMatch: { $eq: user._id } },
  })
    .populate('users', 'firstName lastName image about')
    .populate('latestMessage', 'message files sender createdAt')
    .sort('-updatedAt');

  const chatMessages = await Message.find({
    chat: updatedChat._id.toString(),
    sender: { $ne: user?._id },
  });

  const removeUserMessages = await Message.find({
    sender: user._id,
    chat: updatedChat._id,
  });

  for (const message of removeUserMessages) {
    if (
      updatedChat.latestMessage?._id?.toString() === message?._id?.toString()
    ) {
      const newLatestMessage = chatMessages[chatMessages.length - 1];
      updatedChat.latestMessage = newLatestMessage
        ? newLatestMessage._id
        : null;
    }
    if (message?.files.length > 0) {
      for (const item of message?.files) {
        await destroyImageFromCloudinary(item?.public_id);
      }
    }
    await message.remove();
  }

  await updatedChat.save({ validateBeforeSave: false });

  return res.json({
    status: 'success',
    data: { data: chats },
  });
});
