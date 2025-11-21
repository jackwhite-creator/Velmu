import React, { useState } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from '../ContextMenu';
import ConfirmModal from '../ConfirmModal';

// Import des sous-composants
import MessageReplyHeader from './MessageReplyHeader';
import MessageAvatar from './MessageAvatar';
import MessageContent from './MessageContent';
import MessageHoverActions from './MessageHoverActions';

interface Props {
  msg: any;
  isMe: boolean;
  isSameUser: boolean;
  shouldGroup: boolean;
  onReply: (msg: any) => void;
  onDelete: (id: string) => void;
  onUserClick: (e: React.MouseEvent, userId: string) => void;
  onReplyClick: (id: string) => void;
  isOwner?: boolean;
  serverId?: string;
  onImageClick: (url: string) => void;
}

export default function MessageItem({ 
  msg, isMe, shouldGroup, onReply, onDelete, onUserClick, onReplyClick,
  isOwner, serverId, onImageClick
}: Props) {
  const { user: currentUser } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(msg.content);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [confirmKickOpen, setConfirmKickOpen] = useState(false);

  const isModified = msg.updatedAt && (new Date(msg.updatedAt).getTime() - new Date(msg.createdAt).getTime() > 2000);
  const isMentioningMe = msg.replyTo?.user?.id === currentUser?.id;

  // --- GESTION DES MARGES ---
  // Les messages groupés n'ont pas de marge
  // Les messages avec réponse ont la même marge que les messages normaux (mt-4)
  // car le header de réponse est inclus dans le flux normal
  let marginTopClass = 'mt-4';

  if (shouldGroup) {
    marginTopClass = 'mt-0';
  }
  // Note: on ne met plus de marge supplémentaire pour msg.replyTo
  // Le header de réponse s'affiche naturellement au-dessus

  // --- GESTION DU FOND ---
  const backgroundClass = isMentioningMe 
    ? 'bg-[#F0B232]/10 hover:bg-[#F0B232]/15 before:bg-[#F0B232]' 
    : 'hover:bg-slate-800/40 transparent';

  // --- ACTIONS ---
  const saveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await api.put(`/chat/${msg.id}`, { content: editContent });
      setIsEditing(false);
    } catch (err) {
      console.error("Erreur edition", err);
      alert("Impossible de modifier le message");
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setContextMenu(null);
  };

  const handleKickAction = () => {
    setConfirmKickOpen(true);
    setContextMenu(null);
  };

  const performKick = async () => {
    if (!serverId) return;
    try {
      await api.delete(`/members/${serverId}/kick/${msg.user.id}`);
    } catch (e) { console.error(e); }
    setConfirmKickOpen(false);
  };

  return (
    <>
      <div 
        id={`message-${msg.id}`} 
        onContextMenu={handleContextMenu}
        className={`
          group relative pr-4 pl-2 py-0.5 transition-colors
          ${marginTopClass} ${backgroundClass}
          ${isMentioningMe ? 'before:content-[""] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px]' : ''}
        `}
      >
        {/* 1. HEADER RÉPONSE */}
        {msg.replyTo && !shouldGroup && (
          <MessageReplyHeader replyTo={msg.replyTo} onClick={() => onReplyClick(msg.replyTo.id)} />
        )}

        <div className="flex gap-4">
          {/* 2. AVATAR */}
          <MessageAvatar 
            user={msg.user} 
            createdAt={msg.createdAt} 
            shouldGroup={shouldGroup} 
            onClick={(e) => onUserClick(e, msg.user.id)} 
          />

          {/* 3. CONTENU (Texte + Image + Edition) */}
          <MessageContent 
            msg={msg}
            shouldGroup={shouldGroup}
            isEditing={isEditing}
            editContent={editContent}
            isMentioningMe={isMentioningMe}
            isModified={isModified}
            onUserClick={(e) => onUserClick(e, msg.user.id)}
            setEditContent={setEditContent}
            onSaveEdit={saveEdit}
            onCancelEdit={() => { setIsEditing(false); setEditContent(msg.content); }}
            onImageClick={onImageClick}
          />
        </div>
        
        {/* 4. ACTIONS FLOTTANTES */}
        {!isEditing && (
          <MessageHoverActions 
            isMe={isMe}
            onReply={() => onReply(msg)}
            onEdit={() => { setIsEditing(true); setEditContent(msg.content); }}
            onDelete={() => onDelete(msg.id)}
          />
        )}
      </div>

      {/* 5. MENU CONTEXTUEL */}
      {contextMenu && (
        <ContextMenu position={contextMenu} onClose={() => setContextMenu(null)}>
          <ContextMenuItem label="Répondre" onClick={() => { onReply(msg); setContextMenu(null); }} icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>} />
          <ContextMenuItem label="Copier le texte" onClick={handleCopy} icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>} />
          
          {isMe && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem label="Modifier" onClick={() => { setIsEditing(true); setEditContent(msg.content); setContextMenu(null); }} icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>} />
              <ContextMenuItem label="Supprimer" onClick={() => { onDelete(msg.id); setContextMenu(null); }} variant="danger" icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>} />
            </>
          )}

          {isOwner && !isMe && serverId && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem label="Exclure l'utilisateur" variant="danger" onClick={handleKickAction} icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>} />
            </>
          )}
        </ContextMenu>
      )}

      {/* 6. MODALE KICK */}
      <ConfirmModal 
        isOpen={confirmKickOpen}
        onClose={() => setConfirmKickOpen(false)}
        onConfirm={performKick}
        title={`Exclure ${msg.user.username}`}
        message="Voulez-vous vraiment exclure cet utilisateur ?"
        isDestructive={true}
        confirmText="Exclure"
      />
    </>
  );
}