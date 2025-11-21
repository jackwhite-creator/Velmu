import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ChatService } from './services/chat.service';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';
const onlineUsers = new Map<string, Set<string>>();

export const initializeSocket = (io: Server) => {
  
  // 1. AUTHENTIFICATION
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) return next(new Error("Authentication error"));
      (socket as any).userId = decoded.userId;
      next();
    });
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`🟢 User ${userId} connected (${socket.id})`);

    // 2. REJOINDRE SA PROPRE ROOM (CRUCIAL POUR LES NOTIFS PERSO)
    socket.join(userId); 

    // 3. GESTION PRÉSENCE
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)?.add(socket.id);

    io.emit('user_status_change', { userId, status: 'online' });
    
    const onlineUserIds = Array.from(onlineUsers.keys());
    socket.emit('initial_online_users', onlineUserIds);

    // 4. JOIN ROOMS (Chat)
    socket.on('join_channel', (channelId) => socket.join(channelId));
    socket.on('join_conversation', (conversationId) => socket.join(`conversation_${conversationId}`));
    socket.on('join_server', (serverId) => socket.join(`server_${serverId}`));

    // 5. MESSAGES (Texte seul)
    // Note: Les fichiers passent par l'API POST /chat
    socket.on('send_message', async (data) => {
      const { content, channelId, replyToId } = data;
      try {
        const message = await ChatService.createMessage(content, userId, channelId, undefined, replyToId);
        io.to(channelId).emit('receive_message', message);
      } catch (error) {
        console.error("Erreur socket send_message:", error);
      }
    });

    socket.on('send_direct_message', async (data) => {
      const { content, conversationId, replyToId } = data;
      try {
        const message = await ChatService.createMessage(content, userId, undefined, conversationId, replyToId);
        io.to(`conversation_${conversationId}`).emit('receive_direct_message', message);
        io.to(`conversation_${conversationId}`).emit('conversation_updated', conversationId);
      } catch (error) {
        console.error("Erreur socket send_direct_message:", error);
      }
    });

    // 6. TYPING INDICATOR
    socket.on('typing_start', (data) => {
        const room = data.channelId || `conversation_${data.conversationId}`;
        socket.to(room).emit('user_typing', { ...data, userId, isTyping: true });
    });
    socket.on('typing_stop', (data) => {
        const room = data.channelId || `conversation_${data.conversationId}`;
        socket.to(room).emit('user_typing', { ...data, userId, isTyping: false });
    });

    // 7. DÉCONNEXION
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_status_change', { userId, status: 'offline' });
        }
      }
      console.log(`🔴 User ${userId} disconnected`);
    });
  });
};