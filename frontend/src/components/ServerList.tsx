import { useEffect } from 'react';
import { useServerStore } from '../store/serverStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import CreateServerModal from './CreateServerModal';
import JoinServerModal from './JoinServerModal';
import { useState } from 'react';

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
    
    const savedChannelId = localStorage.getItem('lastChannelId');
    if (savedChannelId) {
        const allChannels = server.categories?.flatMap((c: any) => c.channels) || [];
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
          <img src="/logo.png" alt="Home" className="w-7 h-7 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
          {!user?.avatarUrl && <span className="text-white font-bold text-xs">DM</span>}
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
          </div>
        );
      })}

      <div className="w-8 h-[2px] bg-[#35363C] rounded-lg mx-auto" />

      <div onClick={() => setIsCreateOpen(true)} className="group w-[48px] h-[48px] rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-[#23A559] transition-all duration-200 flex items-center justify-center cursor-pointer text-[#23A559] hover:text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </div>

      <div onClick={() => setIsJoinOpen(true)} className="group w-[48px] h-[48px] rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-[#23A559] transition-all duration-200 flex items-center justify-center cursor-pointer text-[#23A559] hover:text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
      </div>

      <CreateServerModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <JoinServerModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
    </div>
  );
}