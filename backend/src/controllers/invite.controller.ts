import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Petite fonction utilitaire pour générer un code (ex: "Ab3dE9")
const generateCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const InviteController = {
  
  // 1. CRÉER UNE INVITATION (C'est ce qui manquait)
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { serverId } = req.body; // Le frontend envoie { serverId: "..." }

      if (!userId || !serverId) {
        return res.status(400).json({ error: "Données manquantes" });
      }

      // Vérif : Est-ce que l'user est membre du serveur ?
      const member = await prisma.member.findUnique({
        where: { userId_serverId: { userId, serverId } }
      });

      if (!member) {
        return res.status(403).json({ error: "Vous n'êtes pas membre de ce serveur" });
      }

      // Génération d'un code unique
      let code = generateCode();
      // Paranoïa : On s'assure que le code n'existe pas déjà (très rare)
      let existing = await prisma.invite.findUnique({ where: { code } });
      while (existing) {
        code = generateCode();
        existing = await prisma.invite.findUnique({ where: { code } });
      }

      // Création en BDD
      const invite = await prisma.invite.create({
        data: {
          code,
          serverId,
          creatorId: userId,
          // Par défaut l'invite est infinie ou on pourrait gérer une date d'expiration ici
        }
      });

      res.status(201).json(invite);
    } catch (error) {
      console.error("Erreur création invite:", error);
      res.status(500).json({ error: "Impossible de créer l'invitation" });
    }
  },

  // 2. REJOINDRE (Déjà fait, je le remets pour être sûr)
  async join(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { code } = req.params;

      if (!userId) return res.status(401).json({ error: "Non authentifié" });

      const invite = await prisma.invite.findUnique({
        where: { code },
        include: { server: true }
      });

      if (!invite) return res.status(404).json({ error: "Invitation invalide" });

      // Vérifier si déjà membre
      const existingMember = await prisma.member.findUnique({
        where: { userId_serverId: { userId, serverId: invite.serverId } }
      });

      if (existingMember) return res.json(invite.server);

      // Transaction : Ajout membre + Incrément compteur
      await prisma.$transaction([
        prisma.member.create({
          data: { userId, serverId: invite.serverId, role: 'GUEST' }
        }),
        prisma.invite.update({
          where: { code },
          data: { uses: { increment: 1 } }
        })
      ]);

      const io = req.app.get('io');
      io.to(`server_${invite.serverId}`).emit('refresh_members');

      res.json(invite.server);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur join" });
    }
  }
};