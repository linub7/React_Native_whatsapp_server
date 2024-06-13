const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema(
  {
    userTo: { type: Schema.Types.ObjectId, ref: 'User' },
    userFrom: { type: Schema.Types.ObjectId, ref: 'User' },
    notificationType: String,
    opened: { type: Boolean, default: false },
    entityId: Schema.Types.ObjectId,
    // because of entityId could be many things like User or Message or Chat, we don't add ref for it
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

NotificationSchema.statics.insertNotification = async (
  userTo,
  userFrom,
  notificationType,
  entityId
) => {
  const data = {
    userTo,
    userFrom,
    notificationType,
    entityId,
  };
  try {
    await Notification.deleteOne(data);
    return Notification.create(data);
  } catch (error) {
    console.log(error);
  }
};

const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification;
