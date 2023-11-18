const cloudinary = require('../cloud');

exports.uploadImageToCloudinary = async (filePath) => {
  const { secure_url, public_id } = await cloudinary.uploader.upload(filePath, {
    resource_type: 'auto',
  });
  return { url: secure_url, public_id };
};

exports.destroyImageFromCloudinary = async (public_id) => {
  const { result } = await cloudinary.uploader.destroy(public_id);
  console.log(result);

  return result;
};
