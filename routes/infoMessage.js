const express = require('express');
const trimRequest = require('trim-request');
const { isValidObjectId } = require('mongoose');
const {
  getChatInfoMessages,
  sendInfoMessage,
} = require('../controllers/infoMessage');
const { protect } = require('../middleware/auth');
const ErrorResponse = require('../utils/errorResponse');

const router = express.Router();

router.param('id', (req, res, next, val) => {
  if (!isValidObjectId(val)) {
    return next(new ErrorResponse('Please provide a valid id', 400));
  }
  next();
});

router
  .route('/info-messages/:id')
  .get(trimRequest.all, protect, getChatInfoMessages);

router.route('/info-messages').post(trimRequest.all, protect, sendInfoMessage);

module.exports = router;
