import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, login, logout } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
    bannerUrl: user?.bannerUrl || '' // Champ bannière
  });

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await api.put('/users/me', formData);
      
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        login(currentToken, res.data);
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Erreur update", error);
      alert("Impossible de mettre à jour le profil.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      bio: user.bio || '',
      avatarUrl: user.avatarUrl || '',
      bannerUrl: user.bannerUrl || ''
    });
    setIsEditing(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden border border-slate-700 flex flex-col md:flex-row animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Sidebar */}
        <div className="w-full md:w-60 bg-slate-900 p-4 border-r border-slate-700 flex flex-col">
          <h2 className="text-xs font-bold text-slate-400 uppercase mb-4 px-2">Paramètres</h2>
          <button className="text-left px-3 py-2 rounded bg-slate-800 text-white font-medium mb-1 text-sm border border-slate-700">
            Mon Compte
          </button>
          
          <div className="mt-auto pt-4 border-t border-slate-800">
            <button 
              onClick={() => { logout(); onClose(); }}
              className="text-left px-3 py-2 rounded text-red-400 hover:bg-red-900/20 w-full transition flex items-center gap-2 text-sm"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Contenu Principal */}
        <div className="flex-1 bg-slate-800 relative overflow-y-auto max-h-[80vh]">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white/70 hover:text-white transition z-10"
          >
            ✕
          </button>

          <div className="p-8">
            <h1 className="text-xl font-bold text-white mb-6">Mon Compte</h1>

            <div className="bg-slate-900 rounded-lg overflow-hidden mb-6 border border-slate-700 relative">
              
              {/* Bannière */}
              <div className="h-24 w-full bg-slate-700 relative overflow-hidden">
                 {(isEditing && formData.bannerUrl) ? (
                   <img src={formData.bannerUrl} className="w-full h-full object-cover" alt="Banner Preview" />
                 ) : user.bannerUrl ? (
                   <img src={user.bannerUrl} className="w-full h-full object-cover" alt="Banner" />
                 ) : (
                   <div className="w-full h-full bg-indigo-600"></div>
                 )}
              </div>
              
              <div className="px-6 pb-6 relative">
                <div className="flex justify-between items-end -mt-12 mb-4">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-slate-900 p-1.5">
                      <div className="w-full h-full rounded-full bg-indigo-500 flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                         {isEditing && formData.avatarUrl ? (
                            <img src={formData.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                         ) : user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                         ) : (
                            user.username[0].toUpperCase()
                         )}
                      </div>
                    </div>
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-slate-900 rounded-full"></div>
                  </div>
                  
                  <div>
                    {!isEditing ? (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium transition shadow-lg shadow-indigo-500/20"
                      >
                        Modifier le profil
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button 
                          onClick={handleCancel}
                          className="text-slate-300 hover:underline px-3 py-2 text-sm"
                          disabled={isLoading}
                        >
                          Annuler
                        </button>
                        <button 
                          onClick={handleSave}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition"
                          disabled={isLoading}
                        >
                          {isLoading ? '...' : 'Sauvegarder'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-1">
                    {user.username}
                    <span className="text-slate-400 text-lg font-medium opacity-60">#{user.discriminator}</span>
                  </h2>
                </div>

                {/* Formulaire */}
                <div className="bg-slate-800/50 rounded p-4 space-y-4 border border-slate-700/50">
                  
                  {isEditing && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wide">
                          URL de l'Avatar
                        </label>
                        <input
                          type="text"
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                          value={formData.avatarUrl}
                          onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wide">
                          URL de la Bannière
                        </label>
                        <input
                          type="text"
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                          value={formData.bannerUrl}
                          onChange={(e) => setFormData({...formData, bannerUrl: e.target.value})}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wide">Email</label>
                    <div className="text-slate-400 font-mono text-sm select-none cursor-not-allowed">
                      {user.email} <span className="italic opacity-50 ml-2">(Non modifiable)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wide">Bio</label>
                    {isEditing ? (
                       <textarea
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none h-24 resize-none"
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        maxLength={190}
                       />
                    ) : (
                      <p className="text-slate-300 text-sm italic whitespace-pre-wrap">
                        {user.bio || "Pas encore de bio..."}
                      </p>
                    )}
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}