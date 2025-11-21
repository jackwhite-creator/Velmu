import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, setUser, token } = useAuthStore();
  
  const [username, setUsername] = useState('');
  // 👇 FIX TYPAGE : On force le type string | null pour accepter le undefined potentiel converti
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      setUsername(user.username);
      // Si user.avatarUrl est undefined, on met null
      setAvatarUrl(user.avatarUrl || null);
      setSelectedFile(null);
    }
  }, [isOpen, user]);

  // ... (Le reste du fichier reste identique à la version "Design" précédente, le rendu était bon) ...
  // Je remets juste les handlers pour que ce soit complet

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', username);
      if (selectedFile) {
        formData.append('avatar', selectedFile);
      }

      const res = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUser(res.data);
      onClose();
    } catch (error) {
      console.error("Erreur mise à jour profil", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div ref={modalRef} className="bg-[#313338] w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
        {/* Bannière */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-pink-500 relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white/80 hover:text-white rounded-full transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-4 pb-4 relative">
            <div className="relative -mt-[60px] mb-4 w-fit">
                <div onClick={() => fileInputRef.current?.click()} className="relative w-32 h-32 rounded-full p-1.5 bg-[#313338] group cursor-pointer">
                    <div className="w-full h-full rounded-full overflow-hidden relative bg-[#1E1F22] flex items-center justify-center">
                        {avatarUrl ? <img src={avatarUrl} alt={username} className="w-full h-full object-cover" /> : <span className="text-4xl font-bold text-slate-400">{username[0]?.toUpperCase()}</span>}
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 text-white font-medium text-xs uppercase tracking-wide">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            Changer
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*" />
                </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">{user.username}</h2>
            <p className="text-slate-400 text-sm mb-6">#{user.discriminator}</p>

            <div className="space-y-5 bg-[#2B2D31] p-4 rounded-lg">
               <div>
                 <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">Nom d'utilisateur</label>
                 <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-[#1E1F22] text-slate-200 p-2.5 rounded-[3px] outline-none border-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" required minLength={3} />
               </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 bg-[#2B2D31] p-4 -mx-4 -mb-4 rounded-b-xl">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-white hover:underline transition-all">Annuler</button>
              <button type="submit" disabled={isLoading} className="px-5 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-[3px] transition-all disabled:opacity-50 flex items-center">
                {isLoading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}