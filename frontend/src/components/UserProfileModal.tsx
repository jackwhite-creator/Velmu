import React, { useRef, useEffect } from 'react';
import { formatDiscordDate } from '../lib/dateUtils';
import { useAuthStore } from '../store/authStore';

export interface UserProfileData {
  id: string;
  username: string;
  discriminator: string;
  avatarUrl: string | null;
  createdAt: string;
}

interface UserProfileModalProps {
  user: UserProfileData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ user, isOpen, onClose }: UserProfileModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const isMe = currentUser?.id === user.id;

  // Placeholder pour la date, assurez-vous que votre backend renvoie bien createdAt
  // Si le backend ne renvoie pas encore createdAt pour l'utilisateur public, 
  // utilisez une date fictive ou cachez la section.
  const memberSince = user.createdAt ? formatDiscordDate(user.createdAt) : "Date inconnue";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className="bg-[#313338] w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative"
      >
        {/* --- BANNIÈRE (Couleur unie ou dégradé) --- */}
        <div className="h-32 bg-[#5865F2] relative"> 
           {/* On pourrait utiliser la couleur dominante de l'avatar ici plus tard */}
           
           {/* Bouton Fermer */}
           <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white/80 hover:text-white rounded-full transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>

        <div className="px-4 pb-4 relative">
          {/* --- AVATAR FLOTTANT --- */}
          <div className="relative -mt-[60px] mb-3 w-fit">
            <div className="w-32 h-32 rounded-full p-1.5 bg-[#313338]">
               <div className="w-full h-full rounded-full overflow-hidden bg-[#1E1F22] flex items-center justify-center border-[3px] border-[#313338]">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-4xl font-bold text-slate-400">{user.username[0].toUpperCase()}</span>
                    )}
               </div>
               {/* Indicateur de statut (En ligne, etc.) pourrait aller ici */}
            </div>
          </div>

          {/* --- IDENTITÉ --- */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white leading-tight">{user.username}</h2>
            <span className="text-slate-400 text-base">#{user.discriminator}</span>
          </div>

          {/* --- ACTIONS (Boutons) --- */}
          {!isMe && (
            <div className="flex gap-2 mb-6">
                <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-[3px] font-medium text-sm transition flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    Envoyer un message
                </button>
                {/* Bouton "Ajouter en ami" ou autre options (3 points) */}
                <button className="bg-[#4E5058] hover:bg-[#6D6F78] text-white p-2 rounded-[3px] transition flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                </button>
            </div>
          )}

          {/* --- INFOS SUPPLÉMENTAIRES --- */}
          <div className="bg-[#2B2D31] p-3 rounded-lg space-y-3">
            <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">Membre depuis</h3>
                <p className="text-slate-200 text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    {memberSince}
                </p>
            </div>
            
            {/* Autres infos: Rôles, Serveurs en commun... */}
          </div>

        </div>
      </div>
    </div>
  );
}