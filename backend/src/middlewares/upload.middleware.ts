import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// 👇 FIX : On utilise 'require' pour contourner le bug de compilation en prod
const { CloudinaryStorage } = require('multer-storage-cloudinary');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'velmu-uploads',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
  },
});

export const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});