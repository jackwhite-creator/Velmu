import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useServerStore } from '../store/serverStore';
import { useFriendStore } from '../store/friendStore';
import { useAuthStore } from '../store/authStore';

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
  const { onlineUsers } = useServerStore();
  // On récupère updateRequest pour mettre à jour le store localement
  const { requests, addRequest, updateRequest } = useFriendStore(); 
  const { user: currentUser } = useAuthStore();

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'mutual_friends' | 'mutual_servers'>('info');

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

  // --- LOGIQUE D'ETAT D'AMI ---
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

  // --- ACTION 1 : ENVOYER DEMANDE ---
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
      alert("Impossible d'envoyer la demande.");
    } finally {
      setActionLoading(false);
    }
  };

  // --- ACTION 2 : ACCEPTER DEMANDE ---
  const handleAcceptRequest = async () => {
    // On cherche la requête EXACTE où :
    // 1. L'expéditeur est l'utilisateur du profil (userId)
    // 2. Le destinataire est MOI (currentUser.id)
    const request = requests.find(
        r => r.senderId === userId && r.receiverId === currentUser?.id
    );

    if (!request) {
        console.error("Aucune demande trouvée localement pour cet utilisateur.");
        // Tentative de secours : On recharge la liste et on réessaie
        try {
            const res = await api.get('/friends'); // On rafraîchit la liste
            const freshRequests = res.data;
            const freshRequest = freshRequests.find((r: any) => r.senderId === userId && r.receiverId === currentUser?.id);
            
            if (freshRequest) {
                 // On a trouvé la requête fraîche, on lance l'acceptation
                 await api.post('/friends/respond', { requestId: freshRequest.id, action: 'ACCEPT' });
                 updateRequest(freshRequest.id, 'ACCEPTED');
            } else {
                alert("Erreur : Demande introuvable (peut-être déjà annulée ?)");
            }
        } catch (err) {
            console.error("Erreur de récupération secours", err);
        }
        return;
    }

    setActionLoading(true);
    try {
        console.log("Acceptation de la requête :", request.id); // LOG POUR DEBUG
        await api.post('/friends/respond', { 
            requestId: request.id, 
            action: 'ACCEPT' 
        });
        updateRequest(request.id, 'ACCEPTED');
    } catch (error) {
        console.error("Erreur acceptation", error);
        alert("Erreur lors de l'acceptation.");
    } finally {
        setActionLoading(false);
    }
  };

  // --- RENDU DU BOUTON DYNAMIQUE ---
  const renderActionButton = () => {
    if (loading || !profile) return null;

    switch (friendStatus) {
      case 'ME':
        return (
          <button className="bg-slate-700 text-slate-300 px-4 py-2 rounded font-medium text-sm cursor-default opacity-50 border border-slate-600">
            C'est vous !
          </button>
        );
      case 'FRIEND':
        return (
          <button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-medium text-sm transition flex items-center gap-2 border border-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            Envoyer un message
          </button>
        );
      case 'SENT':
        return (
          <button disabled className="bg-slate-700 text-slate-400 px-4 py-2 rounded font-medium text-sm cursor-default border border-slate-600">
            Demande envoyée
          </button>
        );
      case 'RECEIVED':
        return (
          // 👇 BOUTON CORRIGÉ AVEC L'ACTION 👇
          <button 
            onClick={handleAcceptRequest}
            disabled={actionLoading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium text-sm transition flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {actionLoading ? (
                'Traitement...' 
            ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Accepter la demande
                </>
            )}
          </button>
        );
      case 'NONE':
      default:
        return (
          <button 
            onClick={handleSendRequest}
            disabled={actionLoading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium text-sm transition flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {actionLoading ? 'Envoi...' : 'Envoyer une demande d\'ami'}
          </button>
        );
    }
  };


  if (!userId) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 w-full max-w-[600px] rounded-lg shadow-2xl overflow-hidden border border-slate-700 animate-in zoom-in-95 duration-200 relative flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-500">Chargement...</div>
        ) : profile ? (
          <>
            {/* Header / Bannière */}
            <div className="h-32 w-full bg-slate-700 relative">
               {profile.bannerUrl ? (
                 <img src={profile.bannerUrl} className="w-full h-full object-cover" alt="Bannière" />
               ) : (
                 <div className="w-full h-full bg-indigo-600"></div>
               )}
               <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition z-10"
               >
                 ✕
               </button>
            </div>

            {/* Infos Principales */}
            <div className="px-6 relative">
               <div className="flex justify-between items-end">
                  {/* Avatar */}
                  <div className="w-32 h-32 rounded-full bg-slate-800 p-2 -mt-16 relative z-10">
                      <div className="w-full h-full rounded-full bg-indigo-500 flex items-center justify-center text-4xl font-bold text-white overflow-hidden">
                        {profile.avatarUrl ? (
                          <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          profile.username[0].toUpperCase()
                        )}
                      </div>
                      
                      <div 
                        className={`absolute bottom-2 right-2 w-6 h-6 border-4 border-slate-800 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-500'}`} 
                        title={isOnline ? "En ligne" : "Hors ligne"}
                      ></div>
                  </div>

                  {/* BOUTON D'ACTION */}
                  <div className="pb-3">
                      {renderActionButton()}
                  </div>
               </div>

               {/* Pseudo & Badges */}
               <div className="mt-3 pb-4 border-b border-slate-700">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    {profile.username}
                    <span className="text-lg text-slate-400 font-medium">#{profile.discriminator}</span>
                  </h2>
               </div>

               {/* Navigation Onglets */}
               <div className="flex items-center gap-6 mt-4 border-b border-slate-700 text-sm font-medium">
                  <button 
                    onClick={() => setActiveTab('info')}
                    className={`pb-3 border-b-2 transition ${activeTab === 'info' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                  >
                    Info utilisateur
                  </button>
                  <button 
                    onClick={() => setActiveTab('mutual_servers')}
                    className={`pb-3 border-b-2 transition ${activeTab === 'mutual_servers' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                  >
                    Serveurs en commun
                  </button>
                  <button 
                    onClick={() => setActiveTab('mutual_friends')}
                    className={`pb-3 border-b-2 transition ${activeTab === 'mutual_friends' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                  >
                    Amis en commun
                  </button>
               </div>

               {/* Contenu des Onglets */}
               <div className="py-6 min-h-[200px] overflow-y-auto">
                  {activeTab === 'info' && (
                    <div className="space-y-4">
                       <div>
                          <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">À propos de moi</h3>
                          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {profile.bio || "Aucune bio renseignée."}
                          </p>
                       </div>
                       
                       <div>
                          <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Note</h3>
                          <input 
                            type="text" 
                            placeholder="Cliquez pour ajouter une note..." 
                            className="w-full bg-transparent text-sm text-slate-300 placeholder-slate-500 focus:outline-none pb-1 border-b border-transparent focus:border-indigo-500 transition"
                          />
                       </div>
                    </div>
                  )}

                  {activeTab === 'mutual_servers' && (
                    <div className="flex items-center gap-3 p-2 rounded hover:bg-slate-700/50 cursor-pointer">
                       <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-600">
                          VL
                       </div>
                       <div>
                          <div className="text-white font-medium text-sm">Velmu Serveur</div>
                          <div className="text-xs text-slate-400">Serveur principal</div>
                       </div>
                    </div>
                  )}

                  {activeTab === 'mutual_friends' && (
                    <div className="text-center py-8">
                       <div className="text-slate-500 text-sm">Aucun ami en commun... pour l'instant !</div>
                    </div>
                  )}
               </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}