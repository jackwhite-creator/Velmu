import { useState } from 'react';
import { useServerStore } from '../store/serverStore';
import CreateServerModal from './CreateServerModal';
import JoinServerModal from './JoinServerModal';
import api from '../lib/api';

export default function ServerList() {
  const { servers, activeServer, setActiveServer, setActiveConversation } = useServerStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const goToHome = () => {
    setActiveServer(null);
    setActiveConversation(null);
  };

  const handleServerClick = async (server: any) => {
      if (activeServer?.id === server.id) return;
      
      // Optimistic UI
      setActiveServer(server);
      setActiveConversation(null);
      
      // Chargement complet
      try {
          const { data: fullServer } = await api.get(`/servers/${server.id}`);
          setActiveServer(fullServer);
      } catch (e) {
          console.error("Impossible de charger les détails du serveur", e);
      }
  };

  // Composant Tooltip réutilisable pour ne pas répéter le code CSS
  const Tooltip = ({ text }: { text: string }) => (
    <div className="absolute left-full ml-4 px-2 py-1 bg-black text-white text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 top-1/2 -translate-y-1/2 shadow-xl scale-95 group-hover:scale-100 origin-left">
      {text}
      {/* La petite flèche vers la gauche */}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-black"></div>
    </div>
  );

  return (
    <div className="w-[72px] bg-slate-900 border-r border-slate-800 flex flex-col items-center py-3 gap-2 z-30 flex-shrink-0 overflow-y-auto scrollbar-none">
      
      {/* --- BOUTON ACCUEIL --- */}
      <div className="relative group w-full flex justify-center mb-2">
         <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200 ${!activeServer ? 'h-8' : 'h-2 opacity-0 group-hover:opacity-100 group-hover:h-5'}`} />
         
         <div 
           onClick={goToHome}
           className={`w-12 h-12 cursor-pointer transition-all duration-200 overflow-hidden flex items-center justify-center font-bold text-white select-none ${!activeServer ? 'rounded-[16px] bg-indigo-600' : 'rounded-[24px] bg-slate-700 group-hover:rounded-[16px] group-hover:bg-indigo-600'}`}
         >
           <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.6 6.6a2 2 0 0 0-2.8-2.8L12 7.6 8.2 3.8a2 2 0 0 0-2.8 2.8l4.2 4.2L5.4 15a2 2 0 0 0 2.8 2.8l4.2-4.2 3.8 3.8a2 2 0 0 0 2.8-2.8l-4.2-4.2z"/></svg>
         </div>

         {/* Tooltip Accueil */}
         <Tooltip text="Messages privés" />
      </div>

      <div className="w-8 h-[2px] bg-slate-800 rounded-lg mx-auto mb-2"></div>
      
      {/* --- LISTE DES SERVEURS --- */}
      {servers.map((server) => {
        const isActive = activeServer?.id === server.id;
        return (
          <div key={server.id} className="relative group w-full flex justify-center">
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-full transition-all duration-200 ${isActive ? 'h-8' : 'h-2 opacity-0 group-hover:opacity-100 group-hover:h-5'}`} />
            
            <div 
              onClick={() => handleServerClick(server)}
              className={`w-12 h-12 cursor-pointer transition-all duration-200 overflow-hidden flex items-center justify-center font-bold text-white select-none ${isActive ? 'rounded-[16px] bg-indigo-600' : 'rounded-[24px] bg-slate-700 group-hover:rounded-[16px] group-hover:bg-indigo-600'}`}
            >
              {server.iconUrl ? (
                <img src={server.iconUrl} alt={server.name} className="w-full h-full object-cover" />
              ) : (
                server.name.substring(0, 2).toUpperCase()
              )}
            </div>

            {/* Tooltip Serveur */}
            <Tooltip text={server.name} />
          </div>
        );
      })}

      {/* --- BOUTON CRÉER --- */}
      <div className="relative group w-full flex justify-center mt-2">
        <div 
          onClick={() => setIsCreateOpen(true)}
          className="w-12 h-12 rounded-[24px] bg-slate-700 group-hover:bg-green-600 group-hover:rounded-[16px] transition-all duration-200 cursor-pointer flex items-center justify-center text-green-500 group-hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </div>
        <Tooltip text="Créer un serveur" />
      </div>

      {/* --- BOUTON REJOINDRE --- */}
      <div className="relative group w-full flex justify-center">
        <div 
          onClick={() => setIsJoinOpen(true)}
          className="w-12 h-12 rounded-[24px] bg-slate-700 group-hover:bg-green-600 group-hover:rounded-[16px] transition-all duration-200 cursor-pointer flex items-center justify-center text-green-500 group-hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
        </div>
        <Tooltip text="Rejoindre un serveur" />
      </div>

      <CreateServerModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <JoinServerModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
    </div>
  );
}