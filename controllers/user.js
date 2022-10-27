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
    const { url, public_id } = await uploadImageToCloudinary(req.file?.path);
    existedUser.image = { url, public_id };

    await existedUser.save();

    return res.status(200).json({
      success: true,
      data: existedUser,
    });
  } else {
    const { url, public_id } = await uploadImageToCloudinary(req.file?.path);
    existedUser.image = { url, public_id };

    await existedUser.save();

    return res.status(200).json({
      success: true,
      data: existedUser,
    });
  }
});
