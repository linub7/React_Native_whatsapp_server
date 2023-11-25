const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InfoMessageSchema = new Schema(
  {
    message: {
      type: String,
      trim: true,
    },
    chat: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
    },
  }, // without toJSON: { virtuals: true }, toObject: { virtuals: true } our virtual field will now show
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

module.exports = mongoose.model('InfoMessage', InfoMessageSchema);
