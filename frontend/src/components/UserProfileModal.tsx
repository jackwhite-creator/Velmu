import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useServerStore } from '../store/serverStore';
import { useFriendStore } from '../store/friendStore';
import { useAuthStore } from '../store/authStore';
import { formatDiscordDate } from '../lib/dateUtils';

interface UserProfileModalProps {
  userId: string | null;
  onClose: () => void;
}

interface FullProfile {
  id: string;
  username: string;
  discriminator: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  createdAt: string;
}

export default function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);
  
  const { onlineUsers, addConversation, setActiveConversation, setActiveServer } = useServerStore();
  // J'ajoute removeRequest ici. Assure-toi qu'il existe dans ton store !
  const { requests, addRequest, updateRequest, removeRequest } = useFriendStore(); 
  const { user: currentUser } = useAuthStore();

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Nouvel état pour l'effet de survol du bouton Ami
  const [hoveringFriend, setHoveringFriend] = useState(false);

  const isOnline = userId ? onlineUsers.has(userId) : false;
  const isMe = currentUser?.id === userId;

  useEffect(() => {
    if (userId) {
      setLoading(true);
      api.get(`/users/${userId}`)
        .then(res => setProfile(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (userId) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userId, onClose]);

  const getFriendStatus = () => {
    if (isMe) return 'ME';
    const request = requests.find(
      r => (r.senderId === currentUser?.id && r.receiverId === userId) || 
           (r.senderId === userId && r.receiverId === currentUser?.id)
    );
    if (!request) return 'NONE';
    if (request.status === 'ACCEPTED') return 'FRIEND';
    if (request.senderId === currentUser?.id) return 'SENT';
    return 'RECEIVED';
  };
  
  const friendStatus = getFriendStatus();

  const handleStartDM = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      const res = await api.post('/conversations', { targetUserId: userId });
      addConversation(res.data);
      setActiveServer(null);
      setActiveConversation(res.data);
      onClose();
      navigate('/channels/@me'); 
    } catch (error) { console.error("Erreur DM", error); } 
    finally { setActionLoading(false); }
  };

  const handleSendRequest = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      const res = await api.post('/friends/request', { 
        username: profile.username, 
        discriminator: profile.discriminator 
      });
      addRequest(res.data);
    } catch (error) { console.error(error); } 
    finally { setActionLoading(false); }
  };

  const handleAcceptRequest = async () => {
    const request = requests.find(r => r.senderId === userId && r.receiverId === currentUser?.id);
    if (!request) return;
    setActionLoading(true);
    try {
        updateRequest(request.id, 'ACCEPTED');
        await api.post('/friends/respond', { requestId: request.id, action: 'ACCEPT' });
    } catch (error) { console.error(error); } 
    finally { setActionLoading(false); }
  };

  // --- NOUVELLE FONCTION : RETIRER UN AMI ---
  const handleRemoveFriend = async () => {
    if (!userId) return;
    // Petite confirmation de sécurité
    if (!window.confirm(`Voulez-vous vraiment retirer ${profile?.username} de vos amis ?`)) return;

    setActionLoading(true);
    try {
        // Appel API pour supprimer l'ami (ou la requête acceptée)
        await api.delete(`/friends/${userId}`);
        
        // Mise à jour locale du store
        const request = requests.find(
            r => (r.senderId === currentUser?.id && r.receiverId === userId) || 
                 (r.senderId === userId && r.receiverId === currentUser?.id)
        );
        
        if (request && removeRequest) {
            removeRequest(request.id);
        } else {
            // Fallback si removeRequest n'existe pas dans le store : on ferme juste le modal
            // Idéalement, recharge les amis ici
            onClose(); 
        }
    } catch (error) {
        console.error("Erreur lors de la suppression de l'ami", error);
        alert("Impossible de retirer cet ami.");
    } finally {
        setActionLoading(false);
        setHoveringFriend(false);
    }
  };

  const renderButtons = () => {
    if (isMe) return null;

    return (
      <div className="flex gap-3 justify-end items-center h-[40px]">
        <button onClick={handleStartDM} disabled={actionLoading} className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-[3px] font-medium text-sm transition shadow-sm">
            Envoyer un message
        </button>

        {friendStatus === 'NONE' && (
            <button onClick={handleSendRequest} disabled={actionLoading} className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-[3px] font-medium text-sm transition shadow-sm">
               {actionLoading ? '...' : 'Ajouter en ami'}
            </button>
        )}
        {friendStatus === 'SENT' && (
            <button disabled className="px-4 py-1.5 bg-slate-700 text-slate-400 rounded-[3px] font-medium text-sm cursor-not-allowed border border-transparent opacity-80">
               Demande envoyée
            </button>
        )}
        {friendStatus === 'RECEIVED' && (
            <button onClick={handleAcceptRequest} disabled={actionLoading} className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-[3px] font-medium text-sm transition shadow-sm">
               Accepter
            </button>
        )}
        
        {/* 👇 LE BOUTON AMIS INTERACTIF ET DYNAMIQUE */}
        {friendStatus === 'FRIEND' && (
             <button 
                onClick={handleRemoveFriend}
                disabled={actionLoading}
                onMouseEnter={() => setHoveringFriend(true)}
                onMouseLeave={() => setHoveringFriend(false)}
                className={`px-4 py-1.5 rounded-[3px] font-medium text-sm border border-transparent transition-colors flex items-center gap-2 min-w-[90px] justify-center ${
                    hoveringFriend 
                    ? 'bg-red-500 text-white' // Style au survol (Rouge / Danger)
                    : 'bg-[#2B2D31] text-white' // Style normal (Sobre)
                }`}
             >
                {hoveringFriend ? (
                    <>
                        <span className="text-xs">Retirer</span>
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>Amis</span>
                    </>
                )}
             </button>
        )}
      </div>
    );
  };

  if (!userId) return null;

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose} 
    >
      <div 
        ref={modalRef}
        className="bg-[#111214] w-[600px] rounded-xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-500">Chargement...</div>
        ) : profile ? (
            <>
                {/* BANNIÈRE */}
                <div className="h-[210px] w-full relative bg-[#1E1F22]">
                    {profile.bannerUrl ? (
                        <img src={profile.bannerUrl} className="w-full h-full object-cover" alt="Banner" />
                    ) : (
                        <div className="w-full h-full bg-[#5865F2]"></div>
                    )}
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white/80 hover:text-white rounded-full transition-all z-20"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* AVATAR EN ABSOLU */}
                <div className="absolute top-[148px] left-[22px] z-20 pointer-events-none">
                     <div className="relative pointer-events-auto">
                        <div className="w-[138px] h-[138px] rounded-full p-[7px] bg-[#111214]">
                            <div className="w-full h-full rounded-full overflow-hidden bg-[#1E1F22] flex items-center justify-center relative border-[6px] border-[#111214]">
                                {profile.avatarUrl ? (
                                    <img src={profile.avatarUrl} className="w-full h-full object-cover" alt={profile.username} />
                                ) : (
                                    <span className="text-4xl font-bold text-slate-400">{profile.username[0].toUpperCase()}</span>
                                )}
                            </div>
                        </div>
                        <div className={`absolute bottom-4 right-4 w-8 h-8 rounded-full border-[6px] border-[#111214] ${isOnline ? 'bg-green-500' : 'bg-slate-500'}`} title={isOnline ? "En ligne" : "Hors ligne"}></div>
                    </div>
                </div>

                {/* CORPS DU PROFIL */}
                <div className="px-4 pb-5 relative bg-[#111214]">
                    <div className="flex justify-end py-4 min-h-[60px]">
                        {renderButtons()}
                    </div>

                    <div className="bg-[#1E1F22] rounded-lg p-4 border border-[#2B2D31] mt-4 ml-2 mr-2">
                        <div className="mb-4 border-b border-slate-700/50 pb-4">
                            <h1 className="text-2xl font-bold text-white flex items-center gap-1">
                                {profile.username}
                                <span className="text-slate-400 font-medium text-xl">#{profile.discriminator}</span>
                            </h1>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">À propos de moi</h3>
                            <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                {profile.bio || <span className="italic opacity-50">Cet utilisateur n'a pas encore de bio.</span>}
                            </div>
                        </div>

                        <div className="mb-2">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">Membre depuis</h3>
                            <p className="text-slate-400 text-xs">{formatDiscordDate(profile.createdAt)}</p>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                             <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">Note</h3>
                             <input 
                                className="w-full bg-transparent text-xs text-slate-300 placeholder-slate-500 focus:outline-none"
                                placeholder="Cliquez pour ajouter une note..."
                             />
                        </div>

                    </div>
                </div>
            </>
        ) : null}
      </div>
    </div>
  );
}