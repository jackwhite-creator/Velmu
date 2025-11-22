import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useServerStore, Server, Channel, Category } from '../../store/serverStore';
import api from '../../lib/api';
import { Socket } from 'socket.io-client';

// Modales
import EditServerModal from '../EditServerModal';
import ConfirmModal from '../ConfirmModal';
import EditChannelModal from '../EditChannelModal';
import CreateCategoryModal from '../CreateCategoryModal';
import EditCategoryModal from '../EditCategoryModal';

// Composants UI
import ServerHeader from './ServerHeader';
import ChannelList from './ChannelList';
import UserFooter from './UserFooter'; // ✅ IMPORT DU NOUVEAU FOOTER
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from '../ContextMenu';

interface Props {
  activeServer: Server;
  activeChannel: Channel | null;
  socket: Socket | null;
  onChannelSelect: (channel: Channel) => void;
  onCreateChannel: (categoryId: string) => void;
  onInvite: () => void;
  onOpenProfile: () => void;
}

// Type pour savoir quel menu afficher
type MenuType = 'GLOBAL' | 'CHANNEL' | 'CATEGORY';

export default function ServerSidebar({ 
  activeServer, activeChannel, socket, 
  onChannelSelect, onCreateChannel, onInvite, onOpenProfile 
}: Props) {
  const { user } = useAuthStore();
  const { setActiveServer } = useServerStore();
  
  // Modales States
  const [isEditServerOpen, setIsEditServerOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  
  // Confirm Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '' as React.ReactNode,
    action: async () => {},
    isDestructive: false,
    confirmText: 'Confirmer'
  });

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ 
      x: number; y: number; type: MenuType; data?: any 
  } | null>(null);

  // Self-Healing
  useEffect(() => {
      if (activeServer && !activeServer.categories) {
          api.get(`/servers/${activeServer.id}`).then(res => setActiveServer(res.data)).catch(console.error);
      }
  }, [activeServer?.id, activeServer?.categories]);

  // Fermeture menu contextuel au clic
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // ✅ COULEUR MISE À JOUR : #2B2D31 (Discord Dark)
  if (!activeServer) return <div className="w-[260px] bg-[#2B2D31] border-r border-[#1E1F22] flex flex-col flex-shrink-0 z-20" />;

  const isOwner = activeServer.ownerId === user?.id;

  // --- HANDLERS CLIC DROIT ---
  const handleContextMenuGlobal = (e: React.MouseEvent) => {
      if (!isOwner) return;
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, type: 'GLOBAL' });
  };

  const handleContextMenuChannel = (e: React.MouseEvent, channel: Channel) => {
      if (!isOwner) return;
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, type: 'CHANNEL', data: channel });
  };

  const handleContextMenuCategory = (e: React.MouseEvent, category: Category) => {
      if (!isOwner) return;
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, type: 'CATEGORY', data: category });
  };

  // --- ACTIONS SPÉCIFIQUES ---

  const handleGlobalCreateChannel = () => {
      const firstCat = activeServer.categories?.[0];
      if (firstCat) onCreateChannel(firstCat.id);
      else setIsCreateCategoryOpen(true);
      setContextMenu(null);
  };

  const handleDeleteChannelContext = () => {
      const channel = contextMenu?.data; 
      if (!channel) return;
      
      setContextMenu(null); 

      setConfirmConfig({
          title: `Supprimer #${channel.name}`,
          message: <span>Êtes-vous sûr de vouloir supprimer le salon <strong>#{channel.name}</strong> ? Cette action est irréversible.</span>,
          isDestructive: true,
          confirmText: 'Supprimer',
          action: async () => {
              try {
                  await api.delete(`/channels/${channel.id}`);
              } catch (err) {
                  console.error("Erreur suppression salon", err);
              }
          }
      });
      setConfirmOpen(true);
  };

  const handleDeleteCategoryContext = () => {
      const category = contextMenu?.data;
      if (!category) return;
      setContextMenu(null);

      setConfirmConfig({
          title: `Supprimer ${category.name}`,
          message: <span>Voulez-vous vraiment supprimer la catégorie <strong>{category.name}</strong> et tous ses salons ?</span>,
          isDestructive: true,
          confirmText: 'Supprimer',
          action: async () => {
              try {
                  await api.delete(`/categories/${category.id}`);
              } catch (err) { console.error(err); }
          }
      });
      setConfirmOpen(true);
  };

  return (
    <div className="w-[260px] bg-[#2B2D31] border-r border-[#1E1F22] flex flex-col flex-shrink-0 z-20" onContextMenu={handleContextMenuGlobal}>
        
        <ServerHeader 
            server={activeServer} 
            isOwner={isOwner} 
            socket={socket}
            onInvite={onInvite}
            onOpenSettings={() => setIsEditServerOpen(true)}
            onCreateChannel={handleGlobalCreateChannel}
        />

        <ChannelList 
            server={activeServer}
            activeChannel={activeChannel}
            isOwner={isOwner}
            onChannelSelect={onChannelSelect}
            onCreateChannel={onCreateChannel}
            onEditChannel={setEditingChannel}
            onContextMenuChannel={handleContextMenuChannel}
            onContextMenuCategory={handleContextMenuCategory}
        />

        {/* ✅ UTILISATION DU NOUVEAU FOOTER */}
        <UserFooter isConnected={socket?.connected || false} onOpenProfile={onOpenProfile} />

        {/* --- MENU CONTEXTUEL --- */}
        {contextMenu && (
            <ContextMenu position={contextMenu} onClose={() => setContextMenu(null)}>
                
                {/* GLOBAL */}
                {contextMenu.type === 'GLOBAL' && (
                    <>
                        <ContextMenuItem label="Créer un salon" onClick={handleGlobalCreateChannel} icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>} />
                        <ContextMenuSeparator />
                        <ContextMenuItem label="Créer une catégorie" onClick={() => { setIsCreateCategoryOpen(true); setContextMenu(null); }} icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>} />
                    </>
                )}

                {/* CHANNEL */}
                {contextMenu.type === 'CHANNEL' && (
                    <>
                        <ContextMenuItem label="Modifier le salon" onClick={() => { setEditingChannel(contextMenu.data); setContextMenu(null); }} icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>} />
                        <ContextMenuSeparator />
                        <ContextMenuItem label="Supprimer le salon" onClick={handleDeleteChannelContext} variant="danger" icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>} />
                    </>
                )}

                {/* CATEGORY */}
                {contextMenu.type === 'CATEGORY' && (
                    <>
                        <ContextMenuItem label="Créer un salon" onClick={() => { onCreateChannel(contextMenu.data.id); setContextMenu(null); }} icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>} />
                        <ContextMenuSeparator />
                        <ContextMenuItem label="Modifier la catégorie" onClick={() => { setEditingCategory(contextMenu.data); setContextMenu(null); }} icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>} />
                        <ContextMenuItem label="Supprimer la catégorie" onClick={handleDeleteCategoryContext} variant="danger" icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>} />
                    </>
                )}
            </ContextMenu>
        )}

        <EditServerModal isOpen={isEditServerOpen} server={activeServer} onClose={() => setIsEditServerOpen(false)} />
        <ConfirmModal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmConfig.action} title={confirmConfig.title} message={confirmConfig.message} isDestructive={confirmConfig.isDestructive} confirmText={confirmConfig.confirmText} />
        <EditChannelModal isOpen={!!editingChannel} channel={editingChannel} onClose={() => setEditingChannel(null)} />
        <CreateCategoryModal isOpen={isCreateCategoryOpen} onClose={() => setIsCreateCategoryOpen(false)} serverId={activeServer.id} />
        <EditCategoryModal isOpen={!!editingCategory} category={editingCategory} onClose={() => setEditingCategory(null)} />
    </div>
  );
}