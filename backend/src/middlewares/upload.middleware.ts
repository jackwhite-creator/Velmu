import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// 1. Configuration de Cloudinary avec tes clés
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configuration du stockage Multer spécial Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'velmu-uploads', // Le nom du dossier qui sera créé dans ton Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'], // Formats autorisés
    // Tu peux ajouter transformation: [{ width: 1000, crop: "limit" }] pour redimensionner auto
  } as any,
});

// 3. Export du middleware prêt à l'emploi
export const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Limite à 5MB par fichier
});