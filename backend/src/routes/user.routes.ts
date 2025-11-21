import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// GET /api/users/:userId
// Récupérer le profil public d'un utilisateur
router.get('/:userId', authenticateToken, userController.getUserProfile);

// PUT /api/users/profile
// Mise à jour du profil (Bio, Avatar, Bannière)
// Le middleware 'upload.fields' intercepte les fichiers avant le contrôleur
router.put(
  '/profile', 
  authenticateToken, 
  upload.fields([
    { name: 'avatar', maxCount: 1 }, 
    { name: 'banner', maxCount: 1 }
  ]), 
  userController.updateProfile
);

export default router;