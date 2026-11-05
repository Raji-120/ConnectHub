import { uploadToCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

export const handleFileUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const { originalname, mimetype, size, filename, path: localPath } = req.file;

    let fileUrl = `/uploads/${filename}`;
    let storageType = 'local';

    // If Cloudinary configured, upload to Cloudinary
    if (isCloudinaryConfigured()) {
      try {
        const cloudRes = await uploadToCloudinary(localPath);
        if (cloudRes && cloudRes.secure_url) {
          fileUrl = cloudRes.secure_url;
          storageType = 'cloudinary';
        }
      } catch (cloudErr) {
        console.warn('[Cloudinary Warning] Upload failed, falling back to local storage:', cloudErr.message);
      }
    }

    res.status(200).json({
      success: true,
      file: {
        url: fileUrl,
        name: originalname,
        type: mimetype,
        size,
        storage: storageType,
      },
    });
  } catch (error) {
    next(error);
  }
};
