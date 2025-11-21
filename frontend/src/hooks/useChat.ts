import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocketStore } from '../store/socketStore';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

interface Message {
  id: string;
  content: string;
  fileUrl?: string; // <--- AJOUTÉ
  user: { id: string; username: string; discriminator: string; avatarUrl?: string };
  createdAt: string;
  updatedAt?: string;
  replyTo?: { id: string; content: string; user: { username: string } } | null;
}

export const useChat = (targetId: string | undefined, isDm: boolean) => {
  const { socket } = useSocketStore();
  const { user } = useAuthStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const targetIdRef = useRef(targetId);

  useEffect(() => {
    targetIdRef.current = targetId;
  }, [targetId]);

  // 1. CHARGEMENT API
  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    setMessages([]);
    setHasMore(true);

    const endpoint = isDm 
      ? `/conversations/${targetId}/messages` 
      : `/chat/${targetId}/messages`;

    api.get(endpoint)
      .then((res) => {
        setMessages(res.data.reverse());
        setHasMore(res.data.length >= 50);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

  }, [targetId, isDm]);

  // 2. SOCKET EVENTS
  useEffect(() => {
    if (!socket || !targetId) return;

    const joinEvent = isDm ? 'join_conversation' : 'join_channel';
    socket.emit(joinEvent, targetId);

    const handleNewMessage = (msg: Message) => {
      const msgTargetId = isDm ? (msg as any).conversationId : (msg as any).channelId;
      
      // On vérifie que le message est pour ICI
      if (msgTargetId === targetIdRef.current) {
        setMessages((prev) => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleMessageUpdate = (updatedMsg: Message) => {
        setMessages((prev) => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
    };

    const handleMessageDelete = (data: { id: string, channelId?: string, conversationId?: string }) => {
        const msgTargetId = isDm ? data.conversationId : data.channelId;
        if (msgTargetId === targetIdRef.current) {
            setMessages((prev) => prev.filter(m => m.id !== data.id));
        }
    };

    const eventName = isDm ? 'receive_direct_message' : 'receive_message';
    
    socket.on(eventName, handleNewMessage);
    socket.on('message_updated', handleMessageUpdate);
    socket.on('message_deleted', handleMessageDelete);

    return () => {
      socket.off(eventName, handleNewMessage);
      socket.off('message_updated', handleMessageUpdate);
      socket.off('message_deleted', handleMessageDelete);
    };
  }, [socket, targetId, isDm]);

  // 3. ENVOI TEXTE SIMPLE (Le fichier passe par l'API directement dans ChatArea)
  const sendMessage = useCallback((content: string, replyToId?: string) => {
    if (!socket || !targetId) return;

    const payload = {
      content,
      userId: user?.id,
      replyToId,
      [isDm ? 'conversationId' : 'channelId']: targetId
    };

    const emitName = isDm ? 'send_direct_message' : 'send_message';
    socket.emit(emitName, payload);
  }, [socket, targetId, isDm, user]);

  // 4. LOAD MORE
  const loadMore = useCallback(async () => {
    if (loading || !hasMore || messages.length === 0) return;
    const oldestId = messages[0].id;
    const endpoint = isDm 
        ? `/conversations/${targetId}/messages?cursor=${oldestId}`
        : `/chat/${targetId}/messages?cursor=${oldestId}`;
    
    try {
      const res = await api.get(endpoint);
      if (res.data.length < 50) setHasMore(false);
      const olderMsgs = res.data.reverse();
      setMessages((prev) => {
        const newIds = new Set(prev.map(m => m.id));
        const uniqueOlder = olderMsgs.filter((m: Message) => !newIds.has(m.id));
        return [...uniqueOlder, ...prev];
      });
    } catch (err) { console.error(err); }
  }, [targetId, isDm, loading, hasMore, messages]);

  return { messages, loading, hasMore, sendMessage, loadMore };
};