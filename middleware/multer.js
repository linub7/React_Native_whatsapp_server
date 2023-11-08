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

const customFileFilter = (req, file, cb) => {
  if (
    !file?.mimetype?.split('/')[0] === 'image' &&
    !file?.mimetype?.split('/')[0] === 'application' &&
    !file?.mimetype?.split('/')[0] === 'text' &&
    !file?.mimetype?.split('/')[0] === 'audio' &&
    !file?.mimetype?.split('/')[0] === 'video'
  ) {
    return cb(new Error('File type not supported'), false);
  }
  cb(null, true);
};

exports.uploadFile = multer({
  storage,
  fileFilter: customFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 2,
  },
});
