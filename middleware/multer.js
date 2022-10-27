const multer = require('multer');
const storage = multer.diskStorage({});

const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image')) {
    return cb(new Error('File type not supported'), false);
  }
  cb(null, true);
};

exports.uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  //   limits: {
  //     fileSize: 1024 * 1024 * 2,
  //   },
});
