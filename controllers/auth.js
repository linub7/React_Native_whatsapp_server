const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { v4: uuidv4 } = require('uuid');
const sendEmail = require('../utils/sendMail');

// @desc    Register user
// @route   POST /api/v1/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  // Validate email and password
  if (!firstName || !lastName || !email || !password) {
    return next(
      new ErrorResponse(
        'Please provide firstName, lastName, email and password',
        400
      )
    );
  }

  // Create user
  const user = await User.create({
    firstName: firstName.toLowerCase(),
    lastName: lastName.toLowerCase(),
    email: email.toLowerCase(),
    password,
  });

  sendTokenResponse(user, 200, res);
});

// @desc    Login user
// @route   POST /api/v1/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  // Validate email and password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }

  // Check for user
  const user = await User.findOne({
    email,
  }).select('+password');
  if (!user) {
    return next(new ErrorResponse('Invalid Credentials', 401));
  }

  // Check if password match
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid Credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Log user out
// @route   GET /api/v1/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get current user
// @route   GET /api/v1/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user password
// @route   PUT /api/v1/update-password
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const {
    body: { password },
    user,
  } = req;
  if (!password || password.length < 6) {
    return next(
      new ErrorResponse(
        'Password is required & you have to provide at least 6 character',
        400
      )
    );
  }
  const existsUser = await User.findById(user._id);

  existsUser.password = password;

  await existsUser.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Forgot Password
// @route   POST /api/v1/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const {
    body: { email },
  } = req;
  const user = await User.findOne({
    email,
  });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  const randomCode = uuidv4();
  const resetCode = randomCode.split('-')[4];

  user.resetPasswordCode = resetCode;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  const message = `<h1>Your password reset code:</h1><h1>${resetCode}</h1>`;

  await user.save();

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message,
    });

    res.status(200).json({
      success: true,
      message:
        'Email sent. Please check your email inbox and enter your reset token below.',
    });
  } catch (err) {
    console.log(err);
    user.resetPasswordCode = undefined;
    user.resetPasswordExpire = undefined;

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/v1/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  // const resetPasswordToken = crypto
  //   .createHash('sha256')
  //   .update(req.params.resettoken)
  //   .digest('hex');
  const {
    body: { email, password, resetCode },
  } = req;

  console.log({ resetCode });

  const user = await User.findOne({
    email,
    resetPasswordCode: resetCode,
    resetPasswordExpire: {
      $gt: Date.now(),
    },
  });

  if (!password || password.length < 6) {
    return next(
      new ErrorResponse(
        'Password is required and must be at least 6 character',
        400
      )
    );
  }

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // Set new password
  user.password = password;
  user.resetPasswordCode = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Get Token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const { name } = user;

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        _id: user?._id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
      },
    });
};
