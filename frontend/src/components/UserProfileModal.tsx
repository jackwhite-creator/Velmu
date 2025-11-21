import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- Pour la redirection
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
  const { requests, addRequest, updateRequest } = useFriendStore();
  const { user: currentUser } = useAuthStore();

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isOnline = userId ? onlineUsers.has(userId) : false;
  const isMe = currentUser?.id === userId;

  // Chargement des données
  useEffect(() => {
    if (userId) {
      setLoading(true);
      api.get(`/users/${userId}`)
        .then(res => setProfile(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [userId]);

  // Fermeture au clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (userId) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userId, onClose]);

  // --- LOGIQUE D'ÉTAT D'AMI ---
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

  // --- ACTIONS ---

  const handleStartDM = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      // 1. Créer ou récupérer la conversation
      const res = await api.post('/conversations', { targetUserId: userId });
      const conversation = res.data;

      // 2. Mettre à jour le store
      addConversation(conversation);
      setActiveServer(null); // On quitte le serveur visuellement
      setActiveConversation(conversation);

      // 3. Redirection et Fermeture
      onClose();
      navigate('/channels/@me'); 
    } catch (error) {
      console.error("Erreur ouverture DM", error);
    } finally {
      setActionLoading(false);
    }
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

  // --- RENDU DES BOUTONS ---
  const renderButtons = () => {
    if (isMe) return null;

    return (
      <div className="flex gap-3 mt-4 justify-end">
        <button 
            onClick={handleStartDM}
            disabled={actionLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium text-sm transition shadow-sm"
        >
            Envoyer un message
        </button>

        {friendStatus === 'NONE' && (
            <button onClick={handleSendRequest} disabled={actionLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium text-sm transition shadow-sm">
               {actionLoading ? '...' : 'Ajouter en ami'}
            </button>
        )}
        {friendStatus === 'SENT' && (
            <button disabled className="px-4 py-2 bg-slate-700 text-slate-400 rounded font-medium text-sm cursor-not-allowed border border-slate-600">
               Demande envoyée
            </button>
        )}
        {friendStatus === 'RECEIVED' && (
            <button onClick={handleAcceptRequest} disabled={actionLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium text-sm transition shadow-sm">
               Accepter la demande
            </button>
        )}
        {friendStatus === 'FRIEND' && (
             <button disabled className="px-4 py-2 bg-slate-700 text-green-400 rounded font-medium text-sm border border-slate-600 cursor-default">
                Amis
             </button>
        )}
      </div>
    );
  };

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className="bg-[#111214] w-[600px] rounded-lg shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-500">Chargement...</div>
        ) : profile ? (
            <>
                {/* BANNIÈRE */}
                <div className="h-[210px] w-full relative" style={{ backgroundColor: profile.bannerUrl ? 'transparent' : '#1E1F22' }}>
                    {profile.bannerUrl ? (
                        <img src={profile.bannerUrl} className="w-full h-full object-cover" alt="Banner" />
                    ) : (
                        // Couleur par défaut si pas de bannière (Gris foncé Discord ou couleur unie)
                        <div className="w-full h-full bg-[#5865F2]"></div>
                    )}
                    {/* Bouton fermer discret */}
                    <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* CORPS DU PROFIL */}
                <div className="px-5 pb-5 relative bg-[#111214]">
                    
                    {/* AVATAR (Chevauchement) */}
                    <div className="flex justify-between items-end -mt-[70px] mb-4">
                        <div className="relative">
                            <div className="w-[130px] h-[130px] rounded-full p-[6px] bg-[#111214]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-[#2B2D31] flex items-center justify-center relative">
                                    {profile.avatarUrl ? (
                                        <img src={profile.avatarUrl} className="w-full h-full object-cover" alt={profile.username} />
                                    ) : (
                                        <span className="text-4xl font-bold text-slate-400">{profile.username[0].toUpperCase()}</span>
                                    )}
                                </div>
                            </div>
                            {/* Statut */}
                            <div className={`absolute bottom-4 right-4 w-7 h-7 rounded-full border-[5px] border-[#111214] ${isOnline ? 'bg-green-500' : 'bg-slate-500'}`} title={isOnline ? "En ligne" : "Hors ligne"}></div>
                        </div>

                        {/* BOUTONS D'ACTION */}
                        {renderButtons()}
                    </div>

                    {/* INFO UTILISATEUR */}
                    <div className="bg-[#1E1F22] rounded-lg p-4 border border-[#2B2D31]">
                        
                        {/* Nom + Tag */}
                        <div className="mb-4 border-b border-slate-700 pb-4">
                            <h1 className="text-2xl font-bold text-white flex items-center gap-1">
                                {profile.username}
                                <span className="text-slate-400 font-medium text-xl">#{profile.discriminator}</span>
                            </h1>
                        </div>

                        {/* A PROPOS */}
                        <div className="mb-4">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">À propos de moi</h3>
                            <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                {profile.bio || <span className="italic opacity-50">Cet utilisateur n'a pas encore de bio.</span>}
                            </div>
                        </div>

                        {/* DATE D'ARRIVÉE */}
                        <div className="mb-2">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">Membre depuis</h3>
                            <p className="text-slate-400 text-xs">{formatDiscordDate(profile.createdAt)}</p>
                        </div>
                        
                        {/* NOTE (Optionnel) */}
                        <div className="mt-4 pt-4 border-t border-slate-700">
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