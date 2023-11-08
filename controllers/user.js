const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const cloudinary = require('cloudinary');
const { v4: uuidv4 } = require('uuid');
const {
  uploadImageToCloudinary,
  destroyImageFromCloudinary,
} = require('../utils/imageUpload');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// @desc    upload user profile
// @route   POST /api/v1/upload-profile-photo
// @access  Private
exports.uploadProfilePhoto = asyncHandler(async (req, res, next) => {
  const {
    user: { id },
  } = req;

  console.log(req.file);

  const existedUser = await User.findById(id);
  if (!existedUser) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (existedUser?.image?.public_id) {
    await destroyImageFromCloudinary(existedUser?.image?.public_id);
    const payload = await uploadImageToCloudinary(req.file?.path);
    const { url, public_id } = payload;
    existedUser.image = { url, public_id };

    await existedUser.save();

    return res.status(200).json({
      success: true,
      data: existedUser,
    });
  } else {
    const payload = await uploadImageToCloudinary(req.file?.path);
    const { url, public_id } = payload;
    existedUser.image = { url, public_id };

    await existedUser.save();

    return res.status(200).json({
      success: true,
      data: existedUser,
    });
  }
});

// @desc    search User
// @route   GET /api/v1/users/search
// @access  Private
exports.searchUser = asyncHandler(async (req, res, next) => {
  const {
    query: { name },
    user,
  } = req;

  if (!name.trim()) return next(new ErrorResponse('Invalid Request', 400));

  // const result = await Actor.find({ $text: { $search: `"${name}"` } }); // `"${name}"` : extract only query string
  const result = await User.find({
    _id: { $ne: user.id },
    firstName: { $regex: `.*${name}.*`, $options: 'i' },
  }).select('firstName lastName about image.url');

  return res.status(200).json({
    success: true,
    result,
  });
});
