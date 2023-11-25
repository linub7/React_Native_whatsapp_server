const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    picture: {
      type: Object,
      url: String,
      public_id: String,
    },
    isGroup: {
      type: Boolean,
      required: true,
      default: false,
    },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    latestMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  }, // without toJSON: { virtuals: true }, toObject: { virtuals: true } our virtual field will now show
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

ChatSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'users',
    select: 'firstName lastName image',
  });
  this.populate({
    path: 'admin',
    select: 'firstName lastName image',
  });
  // this.populate({
  //   path: 'latestMessage',
  //   select: 'message',
  // });

  next();
});

// to prevent growing chat model because of info-message, using virtual
ChatSchema.virtual('infoMessages', {
  ref: 'InfoMessage',
  foreignField: 'chat',
  localField: '_id',
});

module.exports = mongoose.model('Chat', ChatSchema);
