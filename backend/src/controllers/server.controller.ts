import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import { prisma } from '../lib/prisma';

export const ServerController = {
  // 1. Créer un serveur
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { name, iconUrl } = req.body;

      if (!userId || !name) {
        return res.status(400).json({ error: "Nom requis" });
      }

      const server = await prisma.server.create({
        data: {
          name,
          iconUrl,
          ownerId: userId,
          members: {
            create: { userId, role: 'OWNER' }
          },
          categories: {
            create: {
              name: 'Salons textuels',
              order: 0,
              channels: {
                create: {
                  name: 'général',
                  type: 'text',
                  order: 0
                }
              }
            }
          }
        },
        include: {
          categories: { include: { channels: true } }
        }
      });

      res.status(201).json(server);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur création serveur" });
    }
  },

  // 2. Liste des serveurs
  async getMyServers(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: "Non autorisé" });

      const memberships = await prisma.member.findMany({
        where: { userId },
        include: {
          server: true
        }
      });

      const servers = memberships.map(m => m.server);
      res.json(servers);
    } catch (error) {
      res.status(500).json({ error: "Erreur chargement serveurs" });
    }
  },

  // 3. Détails unitaire
  async getOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const server = await prisma.server.findUnique({
        where: { id },
        include: {
          categories: {
            orderBy: { order: 'asc' },
            include: {
              channels: { orderBy: { order: 'asc' } }
            }
          },
          members: { take: 10 }
        }
      });

      if (!server) return res.status(404).json({ error: "Serveur introuvable" });
      res.json(server);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // 4. Modifier
  async update(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { name, iconUrl } = req.body;

      const server = await prisma.server.findUnique({ where: { id } });
      if (!server) return res.status(404).json({ error: "Serveur introuvable" });
      if (server.ownerId !== userId) return res.status(403).json({ error: "Non autorisé" });

      const updated = await prisma.server.update({
        where: { id },
        data: { name, iconUrl }
      });
      
      // Notification temps réel
      const io = req.app.get('io');
      io.to(`server_${id}`).emit('refresh_server_ui', id);

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Erreur update" });
    }
  },

  // 5. Supprimer
  async delete(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      const server = await prisma.server.findUnique({ where: { id } });
      if (!server) return res.status(404).json({ error: "Serveur introuvable" });
      if (server.ownerId !== userId) return res.status(403).json({ error: "Seul le propriétaire peut supprimer le serveur" });

      // --- NOTIFICATION TEMPS RÉEL AVANT SUPPRESSION ---
      const io = req.app.get('io');
      io.to(`server_${id}`).emit('server_deleted', id);

      await prisma.server.delete({ where: { id } });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erreur suppression" });
    }
  },

  // 6. Quitter
  async leave(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      const server = await prisma.server.findUnique({ where: { id } });
      if (!server) return res.status(404).json({ error: "Serveur introuvable" });
      
      if (server.ownerId === userId) {
        return res.status(400).json({ error: "Le propriétaire ne peut pas quitter le serveur." });
      }

      await prisma.member.delete({
        where: { userId_serverId: { userId: userId!, serverId: id } }
      });

      // Notification temps réel
      const io = req.app.get('io');
      io.to(`server_${id}`).emit('refresh_members');
      io.to(`server_${id}`).emit('user_status_change', { userId, status: 'offline' });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors du départ" });
    }
  }
};