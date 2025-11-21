import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, setUser } = useAuthStore();
  
  // États pour les champs
  const [bio, setBio] = useState('');
  
  // États pour les prévisualisations d'images
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  
  // États pour les fichiers à envoyer
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs pour les inputs cachés
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Initialisation
  useEffect(() => {
    if (isOpen && user) {
      setBio(user.bio || '');
      setAvatarPreview(user.avatarUrl || null);
      setBannerPreview(user.bannerUrl || null);
      setAvatarFile(null);
      setBannerFile(null);
    }
  }, [isOpen, user]);

  // Nettoyage des URLs temporaires
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
      // On n'envoie le pseudo que si l'API le demande obligatoirement, 
      // sinon on peut l'omettre. Ici je le mets pour la sécurité.
      if (user?.username) formData.append('username', user.username);

      if (avatarFile) formData.append('avatar', avatarFile);
      if (bannerFile) formData.append('banner', bannerFile); 

      const res = await api.put('/users/profile', formData);

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
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            
            {/* --- BANNIÈRE MODIFIABLE --- */}
            <div className="group relative h-[210px] w-full bg-slate-700 cursor-pointer" onClick={() => bannerInputRef.current?.click()}>
                {bannerPreview ? (
                    <img src={bannerPreview} className="w-full h-full object-cover transition group-hover:opacity-75" alt="Bannière" />
                ) : (
                    <div className="w-full h-full bg-[#5865F2] transition group-hover:opacity-75"></div>
                )}
                
                {/* Overlay au survol */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm">
                        <span className="text-xs font-bold text-white uppercase tracking-wide">Changer la bannière</span>
                    </div>
                </div>
                
                <input type="file" ref={bannerInputRef} className="hidden" onChange={handleBannerChange} accept="image/*" />
                
                {/* Bouton Fermer */}
                <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onClose(); }} 
                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white/80 hover:text-white rounded-full transition-all z-20"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            <div className="px-5 pb-5 relative bg-[#313338] flex-1 overflow-y-auto">
                
                {/* --- AVATAR MODIFIABLE --- */}
                {/* 👇 CORRECTION ICI : ajout de 'relative z-10' et ajustement de la marge négative */}
                <div className="flex justify-between items-end -mt-[66px] mb-6 relative z-10">
                    <div 
                        className="relative group cursor-pointer"
                        onClick={() => avatarInputRef.current?.click()}
                    >
                        <div className="w-[130px] h-[130px] rounded-full p-[6px] bg-[#313338]">
                            <div className="w-full h-full rounded-full overflow-hidden bg-[#1E1F22] flex items-center justify-center relative border-[3px] border-[#313338]">
                                {avatarPreview ? (
                                    <img src={avatarPreview} className="w-full h-full object-cover transition group-hover:opacity-50" alt="Avatar" />
                                ) : (
                                    <span className="text-4xl font-bold text-slate-400 transition group-hover:opacity-50">{user.username[0].toUpperCase()}</span>
                                )}
                                
                                {/* Overlay Avatar */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                                </div>
                            </div>
                        </div>
                        <input type="file" ref={avatarInputRef} className="hidden" onChange={handleAvatarChange} accept="image/*" />
                    </div>
                </div>

                {/* --- FORMULAIRE --- */}
                <div className="space-y-6 max-w-lg">
                    
                    {/* Pseudo (Lecture seule) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">
                            Nom d'utilisateur
                        </label>
                        <div className="w-full bg-[#1E1F22] text-slate-400 p-3 rounded-[3px] border border-transparent font-medium cursor-not-allowed opacity-80 flex justify-between items-center">
                            <span>{user.username}</span>
                            <span className="text-slate-500">#{user.discriminator}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 pl-1">Le changement de pseudo n'est pas disponible pour le moment.</p>
                    </div>

                    {/* Bio (Éditable) */}
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

            {/* --- FOOTER ACTIONS --- */}
            <div className="bg-[#2B2D31] p-4 px-6 flex justify-end gap-4 border-t border-[#1E1F22]">
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
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Sauvegarde...
                        </>
                    ) : 'Enregistrer les modifications'}
                </button>
            </div>

        </form>
      </div>
    </div>
  );
}