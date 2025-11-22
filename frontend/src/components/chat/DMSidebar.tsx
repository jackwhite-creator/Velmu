import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useServerStore, Conversation } from '../../store/serverStore';
import api from '../../lib/api';
import UserFooter from './UserFooter';

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
    api.get('/conversations/me').then(res => setConversations(res.data)).catch(console.error);
  }, []);

  const getOtherUser = (conversation: Conversation) => {
    return conversation.users.find(u => u.id !== user?.id) || conversation.users[0];
  };

  return (
    <div className="w-60 bg-[#2B2D31] border-r border-[#1E1F22] flex flex-col flex-shrink-0 z-20">
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
        <div 
          onClick={() => setActiveConversation(null)} 
          className={`flex items-center gap-3 px-2 py-2.5 rounded cursor-pointer mb-4 transition-colors
            ${!activeConversation ? 'bg-[#404249] text-white' : 'text-[#949BA4] hover:bg-[#35373C] hover:text-[#dbdee1]'}
          `}
        >
          <div className="w-6 h-6 flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <span className="font-medium text-sm">Amis</span>
        </div>

        <div className="text-[11px] font-bold text-[#949BA4] uppercase px-2 mb-2 tracking-wide flex justify-between items-center hover:text-[#dbdee1] transition cursor-pointer">
           <span>Messages Privés</span>
           <span className="text-lg leading-3">+</span>
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
                ${isActive ? 'bg-[#404249] text-white' : 'text-[#949BA4] hover:bg-[#35373C] hover:text-[#dbdee1]'}
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
                 <div className={`absolute bottom-0 right-0 w-3 h-3 border-[2.5px] border-[#2B2D31] rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-500'}`}></div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                 <span className={`font-medium text-sm truncate ${isActive ? 'text-white' : 'text-[#949BA4] group-hover:text-[#dbdee1]'}`}>
                   {otherUser.username}
                 </span>
              </div>

              <div className={`opacity-0 group-hover:opacity-100 hover:text-white ${isActive ? 'text-white' : 'text-[#949BA4]'}`}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </div>
            </div>
          );
        })}
      </div>
      
      <UserFooter isConnected={true} onOpenProfile={onOpenProfile} />
    </div>
  );
}