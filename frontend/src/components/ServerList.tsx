import { useEffect, useState } from 'react';
import { useServerStore } from '../store/serverStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import CreateServerModal from './CreateServerModal';
import JoinServerModal from './JoinServerModal';

export default function ServerList() {
  const navigate = useNavigate();
  const { servers, setServers, activeServer, setActiveServer, setActiveChannel, setActiveConversation } = useServerStore();
  const { user } = useAuthStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  useEffect(() => {
    api.get('/servers/me').then(res => setServers(res.data)).catch(console.error);
  }, []);

  const handleServerClick = (server: any) => {
    setActiveServer(server);
    setActiveConversation(null);
    navigate(`/channels/${server.id}`);
    
    const savedChannelId = localStorage.getItem('lastChannelId');
    if (savedChannelId && server.categories) {
        const allChannels = server.categories.flatMap((c: any) => c.channels) || [];
        const channel = allChannels.find((c: any) => c.id === savedChannelId);
        if (channel) {
            setActiveChannel(channel);
            return;
        }
    }

    if (server.categories?.[0]?.channels?.[0]) {
      setActiveChannel(server.categories[0].channels[0]);
    } else {
      setActiveChannel(null);
    }
  };

  const handleDmClick = () => {
    setActiveServer(null);
    setActiveChannel(null);
    navigate('/channels/@me');
  };

  return (
    <div className="w-[72px] bg-[#1E1F22] flex flex-col items-center py-3 space-y-2 overflow-y-auto custom-scrollbar flex-shrink-0 z-30">
      
      <div onClick={handleDmClick} className="relative group flex items-center justify-center w-full cursor-pointer">
        {!activeServer && (
            <div className="absolute left-0 w-[4px] h-[40px] bg-white rounded-r-lg transition-all duration-200" />
        )}
        <div className={`w-[48px] h-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 flex items-center justify-center overflow-hidden ${!activeServer ? 'bg-[#5865F2]' : 'bg-[#313338] group-hover:bg-[#5865F2]'}`}>
          <img 
            src="/logo.png" 
            alt="Home" 
            className="w-7 h-7 object-contain" 
            onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }} 
          />
          <svg className="hidden w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.2 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.82 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"/></svg>
        </div>

        <div className="absolute left-[80px] bg-black text-white text-xs font-bold px-3 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-100 pointer-events-none whitespace-nowrap shadow-lg z-50 scale-95 group-hover:scale-100 origin-left">
            Messages Privés
            <div className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-black" />
        </div>
      </div>

      <div className="w-8 h-[2px] bg-[#35363C] rounded-lg mx-auto" />

      {servers.map((server) => {
        const isActive = activeServer?.id === server.id;
        return (
          <div key={server.id} onClick={() => handleServerClick(server)} className="relative group flex items-center justify-center w-full cursor-pointer">
            {isActive && <div className="absolute left-0 w-[4px] h-[40px] bg-white rounded-r-lg" />}
            {!isActive && <div className="absolute left-0 w-[4px] h-[8px] bg-white rounded-r-lg opacity-0 group-hover:opacity-100 group-hover:h-[20px] transition-all duration-200" />}
            
            <div className={`w-[48px] h-[48px] rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 flex items-center justify-center overflow-hidden ${isActive ? 'bg-[#5865F2]' : 'bg-[#313338] group-hover:bg-[#5865F2]'}`}>
              {server.iconUrl ? (
                <img src={server.iconUrl} className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-200 font-medium text-sm group-hover:text-white">{server.name.substring(0, 2).toUpperCase()}</span>
              )}
            </div>

            <div className="absolute left-[80px] bg-black text-white text-xs font-bold px-3 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-100 pointer-events-none whitespace-nowrap shadow-lg z-50 scale-95 group-hover:scale-100 origin-left">
                {server.name}
                <div className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-black" />
            </div>
          </div>
        );
      })}

      <div className="w-8 h-[2px] bg-[#35363C] rounded-lg mx-auto" />

      <div onClick={() => setIsCreateOpen(true)} className="relative group w-[48px] h-[48px] rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-[#23A559] transition-all duration-200 flex items-center justify-center cursor-pointer text-[#23A559] hover:text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <div className="absolute left-[80px] bg-black text-white text-xs font-bold px-3 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-100 pointer-events-none whitespace-nowrap shadow-lg z-50 scale-95 group-hover:scale-100 origin-left">
            Ajouter un serveur
            <div className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-black" />
        </div>
      </div>

      <div onClick={() => setIsJoinOpen(true)} className="relative group w-[48px] h-[48px] rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-[#23A559] transition-all duration-200 flex items-center justify-center cursor-pointer text-[#23A559] hover:text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
        <div className="absolute left-[80px] bg-black text-white text-xs font-bold px-3 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-100 pointer-events-none whitespace-nowrap shadow-lg z-50 scale-95 group-hover:scale-100 origin-left">
            Explorer les serveurs
            <div className="absolute top-1/2 -left-1 -mt-1 border-4 border-transparent border-r-black" />
        </div>
      </div>

      <CreateServerModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <JoinServerModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
    </div>
  );
}