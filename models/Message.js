const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    message: {
      type: String,
      trim: true,
    },
    chat: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
    },
    files: [
      {
        type: Object,
      },
    ],
    isStared: {
      type: Boolean,
      default: false,
    },
  }, // without toJSON: { virtuals: true }, toObject: { virtuals: true } our virtual field will now show
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

MessageSchema.pre('save', function (next) {
  this.populate({
    path: 'chat',
    select: 'users',
  });
  next();
});

MessageSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'sender',
    select: 'firstName lastName image',
  });

  next();
});

module.exports = mongoose.model('Message', MessageSchema);
