const express = require('express');
const { createMessage } = require('../controllers/message');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.post('/create-message', protect, createMessage);

module.exports = router;
