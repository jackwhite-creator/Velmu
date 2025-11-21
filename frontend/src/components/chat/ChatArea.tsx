import React, { useEffect, useState } from 'react';
import { Channel, useServerStore } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';
import { Socket } from 'socket.io-client';
import api from '../../lib/api';
import ConfirmModal from '../ConfirmModal';
import ImageViewerModal from '../ImageViewerModal'; // <--- IMPORT DU VISUALISEUR

// Import des sous-composants
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import MessageItem from './MessageItem';

interface Message {
  id: string;
  content: string;
  fileUrl?: string;
  user: { id: string; username: string; discriminator: string; avatarUrl?: string };
  createdAt: string;
  updatedAt?: string;
  replyTo?: { id: string; content: string; user: { username: string } } | null;
}

interface Props {
  activeChannel: Channel | null;
  messages: Message[];
  isLoadingMore: boolean;
  hasMore: boolean;
  inputValue: string;
  showMembers: boolean;
  socket: Socket | null;
  replyingTo: any;
  
  setInputValue: (val: string) => void;
  setReplyingTo: (msg: any) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onScroll: () => void;
  onUserClick: (e: React.MouseEvent, userId: string) => void;
  onToggleMembers: () => void;
  
  scrollRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export default function ChatArea({
  activeChannel, messages, isLoadingMore, hasMore, inputValue, showMembers, socket, replyingTo,
  setInputValue, setReplyingTo, onSendMessage: originalSendMessage, onScroll, onUserClick, onToggleMembers,
  scrollRef, messagesEndRef
}: Props) {
  const { user } = useAuthStore();
  const { activeServer } = useServerStore();
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  // État pour le visualiseur d'image
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const isOwner = activeServer?.ownerId === user?.id;

  useEffect(() => {
    if (messagesEndRef.current) {
        const behavior = messages.length <= 50 ? 'auto' : 'smooth';
        messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, [messages.length, activeChannel?.id]);

  const performDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/chat/${deleteId}`);
    } catch (err) {
      console.error("Erreur suppression", err);
    } finally {
      setDeleteId(null);
    }
  };

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-slate-800/80');
      setTimeout(() => element.classList.remove('bg-slate-800/80'), 1000);
    }
  };

  const handleSendMessageWithFile = async (e: React.FormEvent, file?: File | null) => {
    e.preventDefault();
    if ((!inputValue.trim() && !file)) return;

    if (!file) {
        originalSendMessage(e); 
        setInputValue('');
        setReplyingTo(null);
        return;
    }

    try {
        const formData = new FormData();
        formData.append('content', inputValue.trim() || ""); 
        if (file) formData.append('file', file);
        if (replyingTo) formData.append('replyToId', replyingTo.id);
        
        if (activeChannel?.type === 'dm') {
            formData.append('conversationId', activeChannel.id);
        } else if (activeChannel?.id) {
            formData.append('channelId', activeChannel.id);
        }

        await api.post('/chat', formData);
        
        setInputValue('');
        setReplyingTo(null);
    } catch (err) {
        console.error("Erreur envoi fichier", err);
        alert("Erreur lors de l'envoi du fichier.");
    }
  };

  if (!activeChannel) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 flex-col bg-slate-900 min-w-0">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-2xl">👋</div>
        <p>Sélectionnez un salon pour discuter.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-900 relative">
       
       <ChatHeader 
         channel={activeChannel} 
         showMembers={showMembers} 
         onToggleMembers={onToggleMembers} 
       />

       <div className="flex-1 flex flex-col min-h-0 relative">
         <div 
            ref={scrollRef} 
            className="flex-1 overflow-y-auto p-4 custom-scrollbar" 
            onScroll={onScroll}
         >
            {isLoadingMore && <div className="text-center py-2 text-xs text-slate-500">Chargement...</div>}
            
            {!hasMore && !isLoadingMore && messages.length > 0 && (
                <div className="mt-8 mb-8 px-4">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <span className="text-3xl text-slate-200">#</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Bienvenue dans {activeChannel.name} !</h1>
                    <p className="text-slate-400">C'est le début de l'histoire de ce salon.</p>
                </div>
            )}

            {messages.map((msg, index) => {
               if (!msg || !msg.user) return null;
               
               const isSameUser = index > 0 && messages[index - 1]?.user?.id === msg.user.id;
               const isTimeClose = index > 0 && (new Date(msg.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() < 60000 * 5);
               const shouldGroup = isSameUser && isTimeClose && !msg.replyTo;

               return (
                 <MessageItem 
                    key={msg.id}
                    msg={msg}
                    isMe={user?.id === msg.user.id}
                    isSameUser={isSameUser}
                    shouldGroup={shouldGroup}
                    onReply={setReplyingTo}
                    onDelete={setDeleteId}
                    onUserClick={onUserClick}
                    onReplyClick={scrollToMessage}
                    isOwner={isOwner}
                    serverId={activeServer?.id}
                    // 👇 ON PASSE LA FONCTION D'OUVERTURE DU VISUALISEUR
                    onImageClick={(url) => setViewingImage(url)} 
                 />
               );
            })}
            <div ref={messagesEndRef} className="h-1" />
         </div>

         <ChatInput 
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSendMessage={handleSendMessageWithFile}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            socket={socket}
            activeChannel={activeChannel}
         />
       </div>

       <ConfirmModal 
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={performDelete}
          title="Supprimer le message"
          message="Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible."
          isDestructive={true}
          confirmText="Supprimer"
       />

       {/* 👇 MODALE DE VISUALISATION D'IMAGE */}
       <ImageViewerModal 
          imageUrl={viewingImage}
          onClose={() => setViewingImage(null)}
       />
    </div>
  );
}