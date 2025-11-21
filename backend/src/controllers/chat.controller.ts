import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// 1. GET MESSAGES (Salons)
export const getChannelMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { channelId } = req.params;
    const cursor = req.query.cursor as string | undefined;

    if (!userId) return res.status(401).json({ error: "Non authentifié" });

    const limit = 50;
    const messages = await prisma.message.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where: { channelId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, discriminator: true, avatarUrl: true } },
        replyTo: { 
          include: { 
            user: { 
              select: { id: true, username: true, avatarUrl: true } 
            } 
          } 
        }
      }
    });

    res.json(messages);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur chargement messages' });
  }
};

// 2. GET MESSAGES (DMs)
export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { conversationId } = req.params;
    const cursor = req.query.cursor as string | undefined;

    if (!userId) return res.status(401).json({ error: "Non authentifié" });
    
    const messages = await prisma.message.findMany({
      take: 50,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, discriminator: true, avatarUrl: true } },
        replyTo: { 
          include: { 
            user: { 
              select: { id: true, username: true, avatarUrl: true } 
            } 
          } 
        }
      }
    });
    res.json(messages);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Erreur chargement messages privés' });
  }
};

// 3. UPDATE MESSAGE
export const updateMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId;

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: "Message introuvable" });
    if (message.userId !== userId) return res.status(403).json({ error: "Interdit" });

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { content },
      include: {
        user: { select: { id: true, username: true, discriminator: true, avatarUrl: true } },
        replyTo: { 
          include: { 
            user: { 
              select: { id: true, username: true, avatarUrl: true } 
            } 
          } 
        }
      }
    });

    const io = req.app.get('io');
    const room = message.channelId ? message.channelId : `conversation_${message.conversationId}`;
    io.to(room).emit('message_updated', updatedMessage);

    res.json(updatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur modification" });
  }
};

// 4. DELETE MESSAGE
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.userId;

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: "Introuvable" });
    if (message.userId !== userId) return res.status(403).json({ error: "Interdit" });

    await prisma.message.delete({ where: { id: messageId } });

    const io = req.app.get('io');
    const room = message.channelId ? message.channelId : `conversation_${message.conversationId}`;
    
    io.to(room).emit('message_deleted', { 
        id: messageId, 
        channelId: message.channelId, 
        conversationId: message.conversationId 
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur suppression" });
  }
};

// --- 5. NOUVEAU : UPLOAD DE FICHIER & CRÉATION MESSAGE ---
// Cette fonction remplace l'ancienne logique socket 'send_message' pour gérer les fichiers
export const uploadFile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { content, channelId, conversationId, replyToId } = req.body;
    const file = req.file; // Récupéré via Multer

    if (!userId) return res.status(401).json({ error: "Non autorisé" });
    
    // On doit avoir au moins du contenu OU un fichier
    if (!file && (!content || content.trim() === "")) {
        return res.status(400).json({ error: "Message vide" });
    }

    // Construction de l'URL du fichier
    let fileUrl = null;
    if (file) {
      // L'URL sera accessible via http://localhost:4000/uploads/nomdufichier.png
      // On utilise req.protocol et req.get('host') pour construire l'URL complète
      fileUrl = file.path;
    }

    // Vérification des droits (Sommaire)
    if (channelId) {
        const member = await prisma.member.findFirst({
            where: { userId, server: { categories: { some: { channels: { some: { id: channelId } } } } } }
        });
        if (!member) return res.status(403).json({ error: "Non membre" });
    } else if (conversationId) {
        const participant = await prisma.conversation.findFirst({
            where: { id: conversationId, users: { some: { id: userId } } }
        });
        if (!participant) return res.status(403).json({ error: "Non participant" });
    } else {
        return res.status(400).json({ error: "Cible manquante (channelId ou conversationId)" });
    }

    // Création du message en BDD
    const message = await prisma.message.create({
      data: {
        content: content || "", // Le contenu peut être vide si y'a une image
        fileUrl: fileUrl,
        userId,
        channelId: channelId || null,
        conversationId: conversationId || null,
        replyToId: replyToId || null
      },
      include: {
        user: { select: { id: true, username: true, discriminator: true, avatarUrl: true } },
        replyTo: { 
            include: { 
              user: { 
                select: { id: true, username: true, avatarUrl: true } 
              } 
            } 
        }
      }
    });

    // Notification Socket Temps Réel
    const io = req.app.get('io');
    const room = channelId ? channelId : `conversation_${conversationId}`;
    
    // On utilise le même event que pour les messages textuels classiques
    // Le frontend traitera l'objet message qui contient maintenant fileUrl
    if (channelId) {
        io.to(channelId).emit('receive_message', message);
    } else {
        io.to(`conversation_${conversationId}`).emit('receive_direct_message', message);
        io.to(`conversation_${conversationId}`).emit('conversation_updated', conversationId);
    }

    res.status(201).json(message);

  } catch (error) {
    console.error("Erreur upload:", error);
    res.status(500).json({ error: "Erreur lors de l'envoi" });
  }
};