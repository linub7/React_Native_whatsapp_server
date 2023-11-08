const cloudinary = require('../cloud');

exports.uploadImageToCloudinary = async (filePath) => {
  const payload = await cloudinary.uploader.upload(filePath, {
    resource_type: 'auto',
  });
  return payload;
};

exports.destroyImageFromCloudinary = async (public_id) => {
  const { result } = await cloudinary.uploader.destroy(public_id);
  console.log(result);

  return result;
};
