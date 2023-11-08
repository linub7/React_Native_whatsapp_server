const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatSchema = new Schema(
  {
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
  // this.populate({
  //   path: 'admin',
  //   select: 'name email status picture',
  // });
  // this.populate({
  //   path: 'latestMessage',
  //   select: 'message',
  // });

  next();
});

module.exports = mongoose.model('Chat', ChatSchema);
