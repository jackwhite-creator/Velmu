import { useEffect, useState, useRef } from 'react';
import api from '../lib/api';
import { useServerStore } from '../store/serverStore';
import { useFriendStore } from '../store/friendStore';
import { useAuthStore } from '../store/authStore';
import { formatDiscordDate } from '../lib/dateUtils';

interface UserProfileModalProps {
  userId: string | null; // On revient à l'ID pour que ça marche partout
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
  const modalRef = useRef<HTMLDivElement>(null);
  
  const { onlineUsers } = useServerStore();
  const { requests, addRequest, updateRequest } = useFriendStore();
  const { user: currentUser } = useAuthStore();

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'mutual_friends' | 'mutual_servers'>('info');

  const isOnline = userId ? onlineUsers.has(userId) : false;
  const isMe = currentUser?.id === userId;

  // 1. Chargement des données du profil via l'ID
  useEffect(() => {
    if (userId) {
      setLoading(true);
      api.get(`/users/${userId}`)
        .then(res => setProfile(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [userId]);

  // Gestion clic dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (userId) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userId, onClose]);


  // --- LOGIQUE AMIS ---
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

  const handleSendRequest = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      const res = await api.post('/friends/request', { 
        username: profile.username, 
        discriminator: profile.discriminator 
      });
      addRequest(res.data);
    } catch (error) {
      console.error("Erreur ajout ami", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    const request = requests.find(r => r.senderId === userId && r.receiverId === currentUser?.id);
    if (!request) return;
    setActionLoading(true);
    try {
        updateRequest(request.id, 'ACCEPTED');
        await api.post('/friends/respond', { requestId: request.id, action: 'ACCEPT' });
    } catch (error) {
        console.error("Erreur acceptation", error);
    } finally {
        setActionLoading(false);
    }
  };

  // --- RENDU DU BOUTON (DESIGN) ---
  const renderActionButton = () => {
    const status = getFriendStatus();

    if (status === 'ME') return null; // Pas de bouton pour soi-même sur la vue publique

    if (status === 'FRIEND') {
        return (
          <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-[3px] font-medium text-sm transition flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            Envoyer un message
          </button>
        );
    }
    if (status === 'SENT') {
        return (
          <button disabled className="flex-1 bg-slate-600 text-slate-300 py-2 px-4 rounded-[3px] font-medium text-sm cursor-not-allowed">
            Demande envoyée
          </button>
        );
    }
    if (status === 'RECEIVED') {
        return (
          <button onClick={handleAcceptRequest} disabled={actionLoading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-[3px] font-medium text-sm transition flex items-center justify-center gap-2">
            {actionLoading ? '...' : 'Accepter la demande'}
          </button>
        );
    }
    // NONE
    return (
        <button onClick={handleSendRequest} disabled={actionLoading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-[3px] font-medium text-sm transition flex items-center justify-center gap-2">
            {actionLoading ? 'Envoi...' : 'Ajouter en ami'}
        </button>
    );
  };

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className="bg-[#313338] w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative"
      >
        {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Chargement du profil...</div>
        ) : profile ? (
          <>
            {/* --- BANNIÈRE --- */}
            <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
               {profile.bannerUrl && (
                 <img src={profile.bannerUrl} className="w-full h-full object-cover" alt="Bannière" />
               )}
               <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white/80 hover:text-white rounded-full transition-all">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
               </button>
            </div>

            <div className="px-4 pb-4 relative">
              {/* --- AVATAR FLOTTANT --- */}
              <div className="relative -mt-[60px] mb-3 w-fit">
                <div className="w-32 h-32 rounded-full p-1.5 bg-[#313338]">
                   <div className="w-full h-full rounded-full overflow-hidden bg-[#1E1F22] flex items-center justify-center border-[3px] border-[#313338]">
                        {profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl font-bold text-slate-400">{profile.username[0].toUpperCase()}</span>
                        )}
                   </div>
                   <div className={`absolute bottom-3 right-3 w-6 h-6 border-4 border-[#313338] rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-500'}`} title={isOnline ? "En ligne" : "Hors ligne"}></div>
                </div>
              </div>

              {/* --- IDENTITÉ --- */}
              <div className="mb-4 p-2 bg-[#111214] rounded-lg border border-slate-800">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white leading-tight">{profile.username}</h2>
                        <span className="text-slate-400 text-sm">#{profile.discriminator}</span>
                    </div>
                    {isMe && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded uppercase font-bold">C'est vous</span>}
                </div>
              </div>

              {/* --- ACTIONS --- */}
              {!isMe && (
                <div className="flex gap-2 mb-6">
                    {renderActionButton()}
                    
                    {/* Bouton More (3 points) */}
                    <button className="bg-[#4E5058] hover:bg-[#6D6F78] text-white p-2 rounded-[3px] transition flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                    </button>
                </div>
              )}

              {/* --- ONGLETS --- */}
              <div className="bg-[#2B2D31] rounded-lg overflow-hidden">
                  <div className="flex border-b border-slate-700">
                      <button onClick={() => setActiveTab('info')} className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'info' ? 'bg-slate-700/50 text-white' : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'}`}>Info</button>
                      <button onClick={() => setActiveTab('mutual_servers')} className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'mutual_servers' ? 'bg-slate-700/50 text-white' : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'}`}>Serveurs</button>
                  </div>
                  
                  <div className="p-4 min-h-[120px]">
                    {activeTab === 'info' && (
                        <div className="space-y-3">
                            <div>
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">À propos de moi</h3>
                                <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                    {profile.bio || <span className="italic opacity-50">Aucune bio renseignée.</span>}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">Membre depuis</h3>
                                <p className="text-slate-400 text-xs">{formatDiscordDate(profile.createdAt)}</p>
                            </div>
                        </div>
                    )}
                    {activeTab === 'mutual_servers' && (
                        <div className="text-center text-xs text-slate-500 py-4">Aucun serveur en commun (WIP)</div>
                    )}
                  </div>
              </div>

            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}