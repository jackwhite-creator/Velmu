import { prisma } from '../lib/prisma';

export const ChatService = {
  // 1. CREATE MESSAGE (Compatible Channel, DM et Reply)
  async createMessage(content: string, userId: string, channelId?: string, conversationId?: string, replyToId?: string) {
    
    // Cas A : Message dans un SALON (Serveur)
    if (channelId) {
      // Vérification membre
      const channel = await prisma.channel.findUnique({
         where: { id: channelId },
         select: { category: { select: { serverId: true } } }
      });
      
      if (!channel) throw new Error("Channel introuvable");
      
      const member = await prisma.member.findUnique({
        where: { userId_serverId: { userId, serverId: channel.category.serverId } }
      });

      if (!member) throw new Error("ACCESS_DENIED: Vous n'êtes pas membre de ce serveur.");

      return await prisma.message.create({
        data: {
          content,
          userId,
          channelId,
          replyToId
        },
        include: {
          user: { select: { id: true, username: true, discriminator: true, avatarUrl: true } },
          replyTo: { 
            include: { 
              user: { 
                select: { 
                  id: true, // <--- C'EST L'AJOUT CRUCIAL POUR LE TEMPS RÉEL !
                  username: true, 
                  avatarUrl: true 
                } 
              } 
            } 
          }
        }
      });
    }

    // Cas B : Message dans une CONVERSATION (DM)
    if (conversationId) {
      const isParticipant = await prisma.conversation.findFirst({
        where: { id: conversationId, users: { some: { id: userId } } }
      });

      if (!isParticipant) throw new Error("ACCESS_DENIED_DM");

      return await prisma.message.create({
        data: {
          content,
          userId,
          conversationId,
          replyToId
        },
        include: {
          user: { select: { id: true, username: true, discriminator: true, avatarUrl: true } },
          replyTo: { 
            include: { 
              user: { 
                select: { 
                  id: true, // <--- ICI AUSSI !
                  username: true, 
                  avatarUrl: true 
                } 
              } 
            } 
          }
        }
      });
    }

    throw new Error("Invalid target");
  },

  // 2. GET MESSAGES (Utilisé par les contrôleurs)
  async getMessages(targetId: string, userId: string, cursor?: string, isDm = false) {
    // Note : Le contrôleur gère déjà la sécurité avant d'appeler ça, mais on peut double-check
    const limit = 50;
    const messages = await prisma.message.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where: isDm ? { conversationId: targetId } : { channelId: targetId },
      
      orderBy: { createdAt: 'desc' },
      
      include: {
        user: { select: { id: true, username: true, discriminator: true, avatarUrl: true } },
        replyTo: { 
          include: { 
            user: { 
              select: { 
                id: true, // Déjà présent ici normalement via le controller, mais on s'assure
                username: true, 
                avatarUrl: true 
              } 
            } 
          } 
        }
      }
    });

    return messages;
  }
};