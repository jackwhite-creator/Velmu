import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Mettre à jour son propre profil
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    // 1. Récupération des données textuelles
    const { bio, username } = req.body; 
    
    // 2. Récupération des fichiers (Multer via Cloudinary)
    // On caste req.files pour que TypeScript reconnaisse la structure
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const avatarFile = files?.['avatar']?.[0];
    const bannerFile = files?.['banner']?.[0];

    if (!userId) return res.status(401).json({ error: 'Non autorisé' });

    // 3. Construction dynamique de l'objet de mise à jour
    const dataToUpdate: any = {};

    // On ne met à jour que si la valeur est fournie
    if (bio !== undefined) dataToUpdate.bio = bio;
    
    // Si un fichier avatar est présent, on prend son chemin (URL Cloudinary)
    if (avatarFile) {
      dataToUpdate.avatarUrl = avatarFile.path;
    }

    // Si un fichier bannière est présent
    if (bannerFile) {
      dataToUpdate.bannerUrl = bannerFile.path;
    }

    // 4. Mise à jour en base de données
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        username: true,
        discriminator: true,
        avatarUrl: true,
        bannerUrl: true,
        bio: true,
        createdAt: true
      }
    });

    res.json(updatedUser);

  } catch (error) {
    console.error("Erreur mise à jour profil:", error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
};

// Récupérer le profil public d'un autre utilisateur
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        discriminator: true,
        avatarUrl: true,
        bannerUrl: true,
        bio: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};