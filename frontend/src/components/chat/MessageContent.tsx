import React from 'react';
import { formatDiscordDate } from '../../lib/dateUtils';

interface Props {
  msg: any;
  shouldGroup: boolean;
  isEditing: boolean;
  editContent: string;
  isMentioningMe: boolean;
  isModified: boolean;
  onUserClick: (e: React.MouseEvent) => void;
  setEditContent: (val: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onImageClick: (url: string) => void;
}

export default function MessageContent({ 
  msg, shouldGroup, isEditing, editContent, isMentioningMe, isModified,
  onUserClick, setEditContent, onSaveEdit, onCancelEdit, onImageClick
}: Props) {
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSaveEdit();
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  return (
    <div className="flex-1 min-w-0 z-10 relative">
      {/* Header: username + date */}
      {!shouldGroup && (
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="font-medium text-indigo-100 hover:underline cursor-pointer" onClick={onUserClick}>
            {msg.user.username}
          </span>
          <span className="text-[11px] text-slate-500">
            {formatDiscordDate(msg.createdAt)}
          </span>
        </div>
      )}

      {/* Contenu */}
      {isEditing ? (
        <div className="bg-slate-900 p-2 rounded w-full mt-1 shadow-inner border border-slate-700/50">
          <input 
            autoFocus
            className="w-full bg-slate-800 text-slate-200 p-2 rounded outline-none border border-transparent focus:border-indigo-500 transition-all"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="text-xs mt-2 flex gap-2">
            <span className="text-slate-400">Entrée pour <span className="text-indigo-400 cursor-pointer hover:underline" onClick={onSaveEdit}>sauvegarder</span></span>
            <span className="text-slate-400">• Echap pour <span className="text-red-400 cursor-pointer hover:underline" onClick={onCancelEdit}>annuler</span></span>
          </div>
        </div>
      ) : (
        <div>
          {msg.content && (
            // 👇 CORRECTION ICI : 'break-all' au lieu de 'break-words' pour forcer le retour à la ligne
            <p className={`text-slate-300 leading-relaxed whitespace-pre-wrap break-all ${shouldGroup ? '' : '-mt-1'} ${isMentioningMe ? 'text-slate-100' : ''}`}>
              {msg.content}
              {isModified && <span className="text-[10px] text-slate-500 ml-1 select-none" title={`Modifié le ${new Date(msg.updatedAt).toLocaleString()}`}>(modifié)</span>}
            </p>
          )}
          
          {/* IMAGE */}
          {msg.fileUrl && (
            <div className="mt-2 group/image">
              <img 
                src={msg.fileUrl} 
                alt="Attachment" 
                className="max-w-full md:max-w-sm max-h-[350px] rounded-lg shadow-sm border border-slate-700/50 cursor-pointer hover:shadow-md transition"
                onClick={() => onImageClick(msg.fileUrl)}
                onError={() => console.error("Erreur chargement image", msg.fileUrl)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}