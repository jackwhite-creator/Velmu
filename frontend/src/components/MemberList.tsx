import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useServerStore } from '../store/serverStore';
import { useAuthStore } from '../store/authStore';
import { ContextMenu, ContextMenuItem } from './ContextMenu'; // <--- Import ContextMenu
import ConfirmModal from './ConfirmModal'; // <--- Import ConfirmModal

interface Member {
  id: string;
  role: string;
  userId: string;
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatarUrl: string | null;
  };
}

interface MemberListProps {
  onMemberClick: (e: React.MouseEvent, userId: string) => void;
}

export default function MemberList({ onMemberClick }: MemberListProps) {
  const { activeServer, onlineUsers } = useServerStore();
  const { user: currentUser } = useAuthStore();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  // --- ETATS POUR ACTIONS ---
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, member: Member } | null>(null);
  const [confirmKick, setConfirmKick] = useState<Member | null>(null);

  useEffect(() => {
    if (!activeServer) return;
    const fetchMembers = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/members/${activeServer.id}`);
        setMembers(res.data);
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchMembers();
  }, [activeServer?.id]);

  if (!activeServer) return null;

  // Permissions
  const amIOwner = activeServer.ownerId === currentUser?.id;

  // --- HANDLERS ---
  const handleContextMenu = (e: React.MouseEvent, member: Member) => {
      if (!amIOwner || member.userId === currentUser?.id) return; // Pas de menu sur soi-même ou si pas owner
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, member });
  };

  const handleKick = async () => {
      if (!confirmKick) return;
      try {
          await api.delete(`/members/${activeServer.id}/kick/${confirmKick.userId}`);
          // Le socket rafraichira la liste automatiquement
      } catch (e) { console.error(e); }
      setConfirmKick(null);
  };

  // --- RENDU MEMBER ROW ---
  const renderMemberRow = (member: Member, isOfflineGroup = false) => {
    const isOwner = member.userId === activeServer.ownerId;
    const isOnline = onlineUsers.has(member.userId);
    const isMe = member.userId === currentUser?.id;

    return (
      <div 
        key={member.id} 
        onClick={(e) => onMemberClick(e, member.userId)}
        onContextMenu={(e) => handleContextMenu(e, member)} // <--- CLIC DROIT ICI
        className={`flex items-center gap-3 px-2.5 py-1.5 mx-2 rounded hover:bg-slate-700/50 cursor-pointer group transition ${isOfflineGroup ? 'opacity-50 hover:opacity-100' : 'opacity-100'}`}
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
            {member.user.avatarUrl ? (
              <img src={member.user.avatarUrl} className="w-full h-full object-cover" alt="" />
            ) : member.user.username[0].toUpperCase()}
          </div>
          <div className={`absolute bottom-0 right-0 w-3 h-3 border-[2.5px] border-[#2B2D31] rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-500'}`}></div>
        </div>
        
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className={`font-medium text-sm truncate ${isOnline ? 'text-slate-200' : 'text-slate-400'} ${isOwner ? 'text-amber-400' : ''}`}>
            {member.user.username}
          </span>
          {isMe && <span className="ml-auto text-[9px] bg-indigo-500/20 text-indigo-300 px-1 py-0.5 rounded font-bold uppercase">Moi</span>}
          {isOwner && !isMe && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 ml-1"><path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"/></svg>}
        </div>
      </div>
    );
  };

  // ... (Logique de tri existante inchangée) ...
  const sortMembers = (a: Member, b: Member) => {
    if (a.userId === activeServer.ownerId) return -1;
    if (b.userId === activeServer.ownerId) return 1;
    return a.user.username.localeCompare(b.user.username);
  };
  const onlineMembers = members.filter(m => onlineUsers.has(m.userId)).sort(sortMembers);
  const offlineMembers = members.filter(m => !onlineUsers.has(m.userId)).sort(sortMembers);

  return (
    <div className="w-60 bg-[#2B2D31] border-l border-slate-800 flex-shrink-0 flex flex-col hidden lg:flex">
       <div className="h-12 shadow-sm flex items-center px-4 border-b border-slate-800/50">
          <h2 className="font-bold text-xs text-slate-400 uppercase tracking-wide">Membres — {members.length}</h2>
       </div>

       <div className="flex-1 overflow-y-auto custom-scrollbar py-3 space-y-6">
          {!loading && (
            <>
              {onlineMembers.length > 0 && (<div><div className="px-4 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wide">En ligne — {onlineMembers.length}</div>{onlineMembers.map(m => renderMemberRow(m, false))}</div>)}
              {offlineMembers.length > 0 && (<div><div className="px-4 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Hors ligne — {offlineMembers.length}</div>{offlineMembers.map(m => renderMemberRow(m, true))}</div>)}
            </>
          )}
       </div>

       {/* --- MENU CONTEXTUEL --- */}
       {contextMenu && (
           <ContextMenu position={contextMenu} onClose={() => setContextMenu(null)}>
               <ContextMenuItem 
                   label={`Exclure ${contextMenu.member.user.username}`} 
                   variant="danger"
                   onClick={() => { setConfirmKick(contextMenu.member); setContextMenu(null); }}
                   icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>}
               />
           </ContextMenu>
       )}

       {/* --- MODALE CONFIRMATION --- */}
       <ConfirmModal 
           isOpen={!!confirmKick}
           onClose={() => setConfirmKick(null)}
           onConfirm={handleKick}
           title={`Exclure ${confirmKick?.user.username}`}
           message={`Êtes-vous sûr de vouloir exclure ${confirmKick?.user.username} du serveur ? Il pourra revenir s'il reçoit une nouvelle invitation.`}
           confirmText="Exclure"
           isDestructive={true}
       />
    </div>
  );
}