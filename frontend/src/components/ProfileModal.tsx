import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, setUser } = useAuthStore();
  
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      setBio(user.bio || '');
      setAvatarPreview(user.avatarUrl || null);
      setBannerPreview(user.bannerUrl || null);
      setAvatarFile(null);
      setBannerFile(null);
    }
  }, [isOpen, user]);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
      if (bannerPreview && bannerPreview.startsWith('blob:')) URL.revokeObjectURL(bannerPreview);
    };
  }, [avatarPreview, bannerPreview]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('bio', bio);
      if (user?.username) formData.append('username', user.username);
      if (avatarFile) formData.append('avatar', avatarFile);
      if (bannerFile) formData.append('banner', bannerFile); 

      const res = await api.put('/users/profile', formData); // Assure-toi que cette route existe (voir point 2)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        ref={modalRef} 
        className="bg-[#313338] w-full max-w-[600px] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
            
            {/* 👇 CORRECTION : On crée un wrapper 'flex-1 overflow-y-auto' QUI CONTIENT LA BANNIÈRE ET LE RESTE */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                
                {/* --- BANNIÈRE --- */}
                <div className="group relative h-[210px] w-full bg-slate-700 cursor-pointer" onClick={() => bannerInputRef.current?.click()}>
                    {bannerPreview ? (
                        <img src={bannerPreview} className="w-full h-full object-cover transition group-hover:opacity-75" alt="Bannière" />
                    ) : (
                        <div className="w-full h-full bg-[#5865F2] transition group-hover:opacity-75"></div>
                    )}
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm">
                            <span className="text-xs font-bold text-white uppercase tracking-wide">Changer la bannière</span>
                        </div>
                    </div>
                    <input type="file" ref={bannerInputRef} className="hidden" onChange={handleBannerChange} accept="image/*" />
                    
                    <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onClose(); }} 
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white/80 hover:text-white rounded-full transition-all z-20"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* --- CONTENU DU PROFIL (Avatar + Inputs) --- */}
                {/* On retire l'overflow ici car c'est le parent qui scroll maintenant */}
                <div className="px-5 pb-5 relative bg-[#313338]">
                    
                    {/* --- AVATAR --- */}
                    <div className="flex justify-between items-end -mt-[66px] mb-6 relative z-10 pointer-events-none"> 
                        {/* pointer-events-none sur le container pour éviter de bloquer le clic sur la bannière en dessous si besoin, 
                            mais on remet pointer-events-auto sur l'avatar */}
                        <div 
                            className="relative group cursor-pointer pointer-events-auto"
                            onClick={() => avatarInputRef.current?.click()}
                        >
                            <div className="w-[130px] h-[130px] rounded-full p-[6px] bg-[#313338]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-[#1E1F22] flex items-center justify-center relative border-[3px] border-[#313338]">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} className="w-full h-full object-cover transition group-hover:opacity-50" alt="Avatar" />
                                    ) : (
                                        <span className="text-4xl font-bold text-slate-400 transition group-hover:opacity-50">{user.username[0].toUpperCase()}</span>
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                                    </div>
                                </div>
                            </div>
                            <input type="file" ref={avatarInputRef} className="hidden" onChange={handleAvatarChange} accept="image/*" />
                        </div>
                    </div>

                    {/* --- FORM FIELDS --- */}
                    <div className="space-y-6 max-w-lg">
                        <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">
                                Nom d'utilisateur
                            </label>
                            <div className="w-full bg-[#1E1F22] text-slate-400 p-3 rounded-[3px] border border-transparent font-medium cursor-not-allowed opacity-80 flex justify-between items-center">
                                <span>{user.username}</span>
                                <span className="text-slate-500">#{user.discriminator}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">
                                À propos de moi
                            </label>
                            <textarea 
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full bg-[#1E1F22] text-slate-200 p-3 rounded-[3px] border-none focus:ring-0 outline-none font-medium resize-none h-28 placeholder-slate-500"
                                placeholder="Racontez un peu votre vie..."
                                maxLength={190}
                            />
                            <div className="text-right text-xs text-slate-500 mt-1">
                                {190 - bio.length} caractères restants
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- FOOTER FIXE --- */}
            <div className="bg-[#2B2D31] p-4 px-6 flex justify-end gap-4 border-t border-[#1E1F22] z-20 relative">
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="px-6 py-2.5 text-sm font-medium text-white hover:underline transition-all"
                >
                    Annuler
                </button>
                <button 
                    type="submit" 
                    disabled={isLoading} 
                    className="px-8 py-2.5 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-[3px] transition-all disabled:opacity-50 shadow-md flex items-center gap-2"
                >
                    {isLoading ? 'Sauvegarde...' : 'Enregistrer les modifications'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}