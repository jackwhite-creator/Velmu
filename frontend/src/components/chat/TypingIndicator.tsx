import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

interface Props {
  socket: Socket | null;
  channelId?: string;
  conversationId?: string;
}

export default function TypingIndicator({ socket, channelId, conversationId }: Props) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleTyping = (data: { userId: string, username: string, isTyping: boolean, channelId?: string, conversationId?: string }) => {
      // On vérifie que l'événement concerne le salon ACTUEL
      const targetMatch = channelId 
          ? data.channelId === channelId 
          : data.conversationId === conversationId;

      if (!targetMatch) return;

      setTypingUsers((prev) => {
        if (data.isTyping) {
          // On ajoute si pas déjà présent
          return prev.includes(data.username) ? prev : [...prev, data.username];
        } else {
          // On retire
          return prev.filter(u => u !== data.username);
        }
      });
    };

    socket.on('user_typing', handleTyping);

    // Reset quand on change de salon
    setTypingUsers([]);

    return () => {
      socket.off('user_typing', handleTyping);
    };
  }, [socket, channelId, conversationId]);

  if (typingUsers.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 mb-1 ml-1 text-xs font-bold text-slate-400 animate-pulse flex items-center gap-1">
      <span className="flex gap-0.5 mr-1">
         <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-0"></span>
         <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-75"></span>
         <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-150"></span>
      </span>
      {typingUsers.join(', ')} {typingUsers.length > 1 ? 'sont en train d\'écrire...' : 'est en train d\'écrire...'}
    </div>
  );
}