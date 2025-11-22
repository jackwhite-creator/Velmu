import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

interface Props {
  isConnected?: boolean; // Optionnel, pour le petit point vert
  onOpenProfile: () => void;
}

export default function UserFooter({ isConnected = true, onOpenProfile }: Props) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermeture au clic dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        containerRef.current && !containerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fonction pour ouvrir le menu
  const toggleMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="relative bg-[#1E1F22] flex-shrink-0 z-50">
      
      {/* --- MENU POP-UP --- */}
      {isMenuOpen && (
        <div 
          ref={menuRef}
          className="absolute bottom-[58px] left-2 w-[240px] bg-[#111214] rounded-md shadow-2xl border border-[#1E1F22] overflow-hidden animate-in slide-in-from-bottom-2 duration-200 origin-bottom-left"
        >
            {/* En-tête avec bannière mini */}
            <div className="h-16 bg-[#5865F2] relative">
                {user?.bannerUrl && <img src={user.bannerUrl} className="w-full h-full object-cover opacity-80" />}
                <div className="absolute -bottom-4 left-3">
                   <div className="w-10 h-10 rounded-full bg-[#111214] p-[3px]">
                       <div className="w-full h-full rounded-full bg-[#5865F2] flex items-center justify-center overflow-hidden">
                           {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-white font-bold text-xs">{user?.username?.[0]}</span>}
                       </div>
                   </div>
                   <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-[2px] border-[#111214] rounded-full"></div>
                </div>
            </div>

            <div className="pt-6 px-3 pb-3">
                <div className="font-bold text-white text-sm">{user?.username}</div>
                <div className="text-xs text-slate-400">#{user?.discriminator}</div>
                
                <div className="h-[1px] bg-slate-700/50 my-2 mx-1"></div>

                {/* Options du menu */}
                <div className="space-y-1">
                    <button 
                        onClick={() => { setIsMenuOpen(false); onOpenProfile(); }}
                        className="w-full text-left px-2 py-1.5 rounded text-sm text-slate-300 hover:bg-indigo-500 hover:text-white transition flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        Modifier le profil
                    </button>
                    
                    <div className="h-[1px] bg-slate-700/50 my-1 mx-1"></div>

                    <button 
                        onClick={handleLogout}
                        className="w-full text-left px-2 py-1.5 rounded text-sm text-red-400 hover:bg-red-500 hover:text-white transition flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Se déconnecter
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- BARRE UTILISATEUR --- */}
      <div 
        ref={containerRef}
        className="p-2 bg-[#232428] flex items-center gap-1"
      >
        <div 
            className="flex items-center gap-2 flex-1 hover:bg-white/5 p-1.5 rounded cursor-pointer transition select-none group" 
            onClick={toggleMenu}
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white overflow-hidden">
              {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user?.username?.[0]}
            </div>
            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-[2px] border-[#232428] rounded-full ${isConnected ? 'bg-green-500' : 'bg-slate-500'}`}></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate text-white leading-tight">{user?.username}</div>
            <div className="text-[11px] text-slate-400 leading-tight group-hover:text-slate-300">#{user?.discriminator}</div>
          </div>
        </div>

        {/* Bouton Paramètres (Raccourci vers ProfileModal) */}
        <button 
            onClick={onOpenProfile} 
            className="p-2 hover:bg-white/5 rounded text-slate-400 hover:text-white transition flex items-center justify-center"
            title="Paramètres Utilisateur"
        >
             <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>
      </div>
    </div>
  );
}