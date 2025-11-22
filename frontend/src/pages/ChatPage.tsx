import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useServerStore } from '../store/serverStore';
import { useSocketStore } from '../store/socketStore';
import { useChat } from '../hooks/useChat';
import api from '../lib/api';

import ProfileModal from '../components/ProfileModal';
import UserCard from '../components/UserCard';
import UserProfileModal from '../components/UserProfileModal';
import ServerList from '../components/ServerList';
import ServerSidebar from '../components/chat/ServerSidebar';
import ChatArea from '../components/chat/ChatArea';
import MemberList from '../components/MemberList';
import CreateChannelModal from '../components/CreateChannelModal';
import InviteModal from '../components/InviteModal';
import DMSidebar from '../components/chat/DMSidebar';
import FriendsDashboard from '../components/chat/FriendsDashboard';
import ConfirmModal from '../components/ConfirmModal';

export default function ChatPage() {
  const navigate = useNavigate();
  const { token, user, setUser } = useAuthStore();
  const { socket } = useSocketStore();
  
  const { 
    activeServer, activeChannel, activeConversation, servers,
    setServers, setConversations, setActiveServer, setActiveChannel, setActiveConversation,
    removeServer
  } = useServerStore();

  const [inputValue, setInputValue] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [popover, setPopover] = useState<{ userId: string; x: number; y: number } | null>(null);
  const [fullProfileId, setFullProfileId] = useState<string | null>(null);
  const [creationCategoryId, setCreationCategoryId] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const [memberListVersion, setMemberListVersion] = useState(0);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [kickedServerName, setKickedServerName] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const targetId = activeServer ? activeChannel?.id : activeConversation?.id;
  const isDm = !activeServer && !!activeConversation;
  const { messages, loading: isLoadingChat, hasMore, sendMessage, loadMore } = useChat(targetId, isDm);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    if (user?.id) api.get(`/users/${user.id}`).then(res => setUser({ ...res.data, email: user.email })).catch(() => {});

    const initData = async () => {
      try {
        setIsRestoring(true);
        const [resServers, resConvs] = await Promise.all([api.get('/servers/me'), api.get('/conversations/me')]);
        setServers(resServers.data);
        setConversations(resConvs.data);

        const lastServerId = localStorage.getItem('lastServerId');
        const lastChannelId = localStorage.getItem('lastChannelId');
        const lastConvId = localStorage.getItem('lastConversationId');

        if (lastServerId && lastServerId !== 'null') {
            try {
                const { data: fullServer } = await api.get(`/servers/${lastServerId}`);
                setActiveServer(fullServer);
                setActiveConversation(null);
                if (lastChannelId) {
                    const allChannels = fullServer.categories?.flatMap((c: any) => c.channels) || [];
                    const found = allChannels.find((c: any) => c.id === lastChannelId) || allChannels[0];
                    if (found) setActiveChannel(found);
                }
            } catch { localStorage.removeItem('lastServerId'); setActiveServer(null); }
        } else if (lastConvId && lastConvId !== 'null') {
            const found = resConvs.data.find((c: any) => c.id === lastConvId);
            if (found) { setActiveServer(null); setActiveConversation(found); }
        }
      } catch (e) { console.error(e); } finally { setIsRestoring(false); }
    };
    initData();
  }, [token, navigate]);

  useEffect(() => {
    if (!isRestoring) {
        if (activeServer) {
            localStorage.setItem('lastServerId', activeServer.id);
            localStorage.setItem('lastConversationId', 'null');
            if (activeChannel) localStorage.setItem('lastChannelId', activeChannel.id);
        } else if (activeConversation) {
            localStorage.setItem('lastServerId', 'null');
            localStorage.setItem('lastConversationId', activeConversation.id);
        }
    }
  }, [activeServer?.id, activeChannel?.id, activeConversation?.id, isRestoring]);

  useEffect(() => {
    if (!socket) return;
    
    servers.forEach(s => socket.emit('join_server', s.id));

    const handleServerRefresh = async (sid: string) => {
       if (activeServer?.id === sid) {
         const { data } = await api.get(`/servers/${sid}`);
         setActiveServer(data);
         if (activeChannel) {
             const allChannels = data.categories?.flatMap((c: any) => c.channels) || [];
             const updatedChannel = allChannels.find((c: any) => c.id === activeChannel.id);
             if (updatedChannel) setActiveChannel(updatedChannel);
             else if (allChannels.length > 0) setActiveChannel(allChannels[0]);
         }
       }
    };

    const handleServerDeleted = (sid: string) => {
        removeServer(sid);
        if (activeServer?.id === sid) { 
            setActiveServer(null); setActiveChannel(null); localStorage.removeItem('lastServerId'); 
            navigate('/channels/@me');
        }
    };

    const handleMemberKicked = ({ serverId, userId }: { serverId: string, userId: string }) => {
        if (user?.id === userId) {
            const serverName = servers.find(s => s.id === serverId)?.name || "un serveur";
            removeServer(serverId);
            
            if (activeServer?.id === serverId) {
                setActiveServer(null);
                setActiveChannel(null);
                localStorage.removeItem('lastServerId');
                navigate('/channels/@me');
                setKickedServerName(serverName);
            }
        } else {
            if (activeServer?.id === serverId) {
                setMemberListVersion(v => v + 1);
            }
        }
    };

    socket.on('refresh_server_ui', handleServerRefresh);
    socket.on('server_deleted', handleServerDeleted);
    socket.on('refresh_members', () => setMemberListVersion(v => v + 1));
    socket.on('member_kicked', handleMemberKicked);

    return () => {
        socket.off('refresh_server_ui', handleServerRefresh);
        socket.off('server_deleted', handleServerDeleted);
        socket.off('refresh_members');
        socket.off('member_kicked', handleMemberKicked);
    };
  }, [socket, servers, activeServer?.id, activeChannel?.id, user?.id, navigate, removeServer, setActiveServer, setActiveChannel]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(inputValue, replyingTo?.id);
    setInputValue('');
    setReplyingTo(null);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleUserClick = (e: React.MouseEvent, userId: string) => {
    e.preventDefault(); e.stopPropagation();
    setPopover({ userId, x: e.clientX, y: e.clientY });
  };

  const handleMemberClick = (e: React.MouseEvent, userId: string) => {
    e.preventDefault(); e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({ userId, x: rect.left - 355, y: rect.top });
  };

  const chatHeaderInfo = useMemo(() => {
      if (activeServer && activeChannel) return activeChannel;
      if (activeConversation) {
         const other = activeConversation.users.find(u => u.id !== user?.id) || activeConversation.users[0];
         return { 
             id: activeConversation.id,
             name: other?.username || 'Inconnu', 
             type: 'dm' 
         } as any;
      }
      return null;
  }, [activeServer, activeChannel, activeConversation, user?.id]);

  if (isRestoring) return <div className="flex h-screen w-full bg-[#313338] items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div></div>;

  return (
    <div className="flex h-screen bg-[#313338] text-slate-100 font-sans overflow-hidden">
      <ServerList />
      {activeServer ? (
        <ServerSidebar activeServer={activeServer} activeChannel={activeChannel} socket={socket} onChannelSelect={setActiveChannel} onCreateChannel={setCreationCategoryId} onInvite={() => setIsInviteOpen(true)} onOpenProfile={() => setIsProfileOpen(true)} />
      ) : (
        <DMSidebar onOpenProfile={() => setIsProfileOpen(true)} />
      )}
      <div className="flex-1 flex min-h-0 bg-[#313338]">
         {!activeServer && !activeConversation ? <FriendsDashboard /> : (
             <ChatArea messages={messages} isLoadingMore={isLoadingChat} hasMore={hasMore} onScroll={loadMore} activeChannel={chatHeaderInfo} inputValue={inputValue} setInputValue={setInputValue} onSendMessage={handleSendMessage} showMembers={showMembers && !!activeServer} onUserClick={handleUserClick} onToggleMembers={() => setShowMembers(!showMembers)} scrollRef={scrollContainerRef} messagesEndRef={messagesEndRef} socket={socket} replyingTo={replyingTo} setReplyingTo={setReplyingTo} />
         )}
         {activeServer && showMembers && <MemberList key={memberListVersion} onMemberClick={handleMemberClick} />}
      </div>
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      {popover && <UserCard userId={popover.userId} position={{x: popover.x, y: popover.y}} onClose={() => setPopover(null)} onEditProfile={() => { setPopover(null); setIsProfileOpen(true); }} onOpenFullProfile={() => { setPopover(null); setFullProfileId(popover.userId); }} />}
      <UserProfileModal userId={fullProfileId} onClose={() => setFullProfileId(null)} />
      <CreateChannelModal isOpen={!!creationCategoryId} categoryId={creationCategoryId} onClose={() => setCreationCategoryId(null)} onSuccess={() => {}} />
      <InviteModal isOpen={isInviteOpen} server={activeServer} onClose={() => setIsInviteOpen(false)} />
      
      <ConfirmModal 
        isOpen={!!kickedServerName}
        onClose={() => setKickedServerName(null)}
        onConfirm={() => setKickedServerName(null)} 
        title="Exclu du serveur"
        message={`Vous avez été exclu du serveur "${kickedServerName}".`}
        isDestructive={false}
        confirmText="Compris"
        showCancel={false} 
      />
    </div>
  );
}