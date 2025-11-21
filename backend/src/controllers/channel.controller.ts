import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const ChannelController = {
  // 1. CRÉER UN SALON
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { name, categoryId } = req.body;

      if (!name || !categoryId || !userId) {
        return res.status(400).json({ error: "Données manquantes" });
      }

      // On récupère la catégorie et le serveur pour savoir où envoyer la notif
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: { server: true }
      });

      if (!category) return res.status(404).json({ error: "Catégorie introuvable" });

      // Sécurité : Owner seulement (ou Admin plus tard)
      if (category.server.ownerId !== userId) {
        return res.status(403).json({ error: "Permission refusée" });
      }

      const channel = await prisma.channel.create({
        data: { name, categoryId, type: 'text' }
      });

      // Notification Socket
      const io = req.app.get('io');
      io.to(`server_${category.server.id}`).emit('refresh_server_ui', category.server.id);

      res.status(201).json(channel);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur création salon" });
    }
  },

  // 2. MODIFIER UN SALON (Renommer)
  async update(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { channelId } = req.params;
      const { name } = req.body;

      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: { category: { include: { server: true } } }
      });

      if (!channel) return res.status(404).json({ error: "Salon introuvable" });
      if (channel.category.server.ownerId !== userId) return res.status(403).json({ error: "Interdit" });

      const updated = await prisma.channel.update({
        where: { id: channelId },
        data: { name }
      });

      // Notif Socket
      const io = req.app.get('io');
      io.to(`server_${channel.category.server.id}`).emit('refresh_server_ui', channel.category.server.id);

      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur modification" });
    }
  },

  // 3. SUPPRIMER UN SALON
  async delete(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { channelId } = req.params;

      // On doit récupérer le serveur AVANT de supprimer pour avoir son ID pour le socket
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: { category: { include: { server: true } } }
      });

      if (!channel) return res.status(404).json({ error: "Salon introuvable" });
      if (channel.category.server.ownerId !== userId) return res.status(403).json({ error: "Interdit" });

      const serverId = channel.category.server.id; // On garde l'ID au chaud

      await prisma.channel.delete({ where: { id: channelId } });

      // Notif Socket
      const io = req.app.get('io');
      io.to(`server_${serverId}`).emit('refresh_server_ui', serverId);

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur suppression" });
    }
  },

  // 4. RÉORGANISER (Drag & Drop)
  async reorder(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      // on reçoit : { activeId: "id_salon_bougé", categoryId: "id_catégorie_dest", orderedIds: ["id1", "id2"] }
      const { activeId, categoryId, orderedIds } = req.body;

      // 1. Vérif propriétaire
      // On prend un channel au hasard pour trouver le serveur et vérifier les droits
      const checkChannel = await prisma.channel.findUnique({
        where: { id: activeId },
        include: { category: { include: { server: true } } }
      });

      if (!checkChannel) return res.status(404).json({ error: "Salon introuvable" });
      if (checkChannel.category.server.ownerId !== userId) {
        return res.status(403).json({ error: "Interdit" });
      }

      const serverId = checkChannel.category.server.id;

      // 2. Transaction : On met à jour la catégorie (si changée) et l'ordre de TOUS les salons impactés
      const transaction = orderedIds.map((channelId: string, index: number) => {
        return prisma.channel.update({
          where: { id: channelId },
          data: { 
            order: index,
            categoryId: categoryId // On met à jour la catégorie (même si c'est la même, c'est pas grave)
          }
        });
      });

      await prisma.$transaction(transaction);

      // 3. Socket : On dit à tout le monde de rafraîchir l'UI du serveur
      const io = req.app.get('io');
      io.to(`server_${serverId}`).emit('refresh_server_ui', serverId);

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur réorganisation" });
    }
  }
};