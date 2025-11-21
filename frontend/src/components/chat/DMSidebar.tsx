import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useServerStore, Conversation } from '../../store/serverStore';
import api from '../../lib/api';

interface Props {
  onOpenProfile: () => void;
}

export default function DMSidebar({ onOpenProfile }: Props) {
  const { user } = useAuthStore();
  const { 
    conversations, activeConversation, onlineUsers,
    setConversations, setActiveConversation 
  } = useServerStore();

  useEffect(() => {
    api.get('/conversations/me')
      .then(res => setConversations(res.data))
      .catch(console.error);
  }, []);

  const getOtherUser = (conversation: Conversation) => {
    return conversation.users.find(u => u.id !== user?.id) || conversation.users[0];
  };

  return (
    <div className="w-60 bg-slate-800 border-r border-slate-700 flex flex-col flex-shrink-0 z-20">
      
      {/* Header Recherche */}
      
      {/* Liste des DMs */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
        
        {/* Bouton Amis */}
        <div 
          onClick={() => setActiveConversation(null)} 
          className={`flex items-center gap-3 px-2 py-2.5 rounded cursor-pointer mb-4 transition-colors
            ${!activeConversation ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}
          `}
        >
          <div className="w-6 h-6 flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <span className="font-medium text-sm">Amis</span>
        </div>

        <div className="text-[11px] font-bold text-slate-400 uppercase px-2 mb-2 tracking-wide flex justify-between items-center">
           <span>Messages Privés</span>
           <span className="hover:text-white cursor-pointer text-lg leading-3">+</span>
        </div>

        {conversations.map(conv => {
          const otherUser = getOtherUser(conv);
          const isActive = activeConversation?.id === conv.id;
          const isOnline = onlineUsers.has(otherUser.id);

          return (
            <div 
              key={conv.id}
              onClick={() => setActiveConversation(conv)}
              className={`group flex items-center gap-3 px-2 py-2 rounded cursor-pointer transition
                ${isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}
              `}
            >
              <div className="relative">
                 <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                    {otherUser.avatarUrl ? (
                      <img src={otherUser.avatarUrl} className="w-full h-full object-cover" />
                    ) : (
                      otherUser.username[0].toUpperCase()
                    )}
                 </div>
                 <div className={`absolute bottom-0 right-0 w-3 h-3 border-[2.5px] border-slate-800 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-500'}`}></div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                 <span className={`font-medium text-sm truncate ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-200'}`}>
                   {otherUser.username}
                 </span>
              </div>

              <div className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white">
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* User Footer */}
      <div className="p-2 bg-slate-900 border-t border-slate-800 flex items-center gap-1">
        <div className="flex items-center gap-2 flex-1 hover:bg-slate-800 p-1.5 rounded cursor-pointer transition select-none group" onClick={onOpenProfile}>
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white overflow-hidden">
              {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user?.username?.[0]}
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-[2px] border-slate-900 rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate text-white leading-tight">{user?.username}</div>
            <div className="text-[11px] text-slate-400 leading-tight group-hover:text-slate-300">#{user?.discriminator}</div>
          </div>
        </div>
        <button onClick={onOpenProfile} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition">
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>
      </div>
    </div>
  );
}