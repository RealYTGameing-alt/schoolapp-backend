const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'edumanage/general';
    let resourceType = 'auto';

    if (req.uploadFolder === 'assignments') folder = 'edumanage/assignments';
    if (req.uploadFolder === 'materials') folder = 'edumanage/materials';

    return {
      folder,
      resource_type: resourceType,
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'mp4', 'txt'],
      public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`,
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

module.exports = { upload, cloudinary };