import { useState, useEffect } from 'react'; // <--- Ajout des hooks
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Server, Channel, Category, useServerStore } from '../../store/serverStore';
import api from '../../lib/api';

interface Props {
  server: Server;
  activeChannel: Channel | null;
  isOwner: boolean;
  onChannelSelect: (c: Channel) => void;
  onCreateChannel: (catId: string) => void;
  onEditChannel: (c: Channel) => void;
  onContextMenuChannel: (e: React.MouseEvent, channel: Channel) => void;
  onContextMenuCategory: (e: React.MouseEvent, category: Category) => void;
}

export default function ChannelList({ 
  server, activeChannel, isOwner, 
  onChannelSelect, onCreateChannel, onEditChannel,
  onContextMenuChannel, onContextMenuCategory 
}: Props) {
  const { setActiveServer } = useServerStore();
  
  // --- GESTION DU PLIAGE DES CATÉGORIES ---
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // 1. Chargement initial depuis le localStorage
  useEffect(() => {
    const stored = localStorage.getItem('velmu_collapsed_cats');
    if (stored) {
      try {
        setCollapsedCategories(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error("Erreur lecture préférences catégories", e);
      }
    }
  }, []);

  // 2. Fonction de bascule (Toggle) avec sauvegarde
  const toggleCategory = (categoryId: string) => {
    const newSet = new Set(collapsedCategories);
    if (newSet.has(categoryId)) {
      newSet.delete(categoryId); // Déplier
    } else {
      newSet.add(categoryId);    // Plier
    }
    setCollapsedCategories(newSet);
    localStorage.setItem('velmu_collapsed_cats', JSON.stringify([...newSet]));
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newCategories = JSON.parse(JSON.stringify(server.categories)) as Category[];

    // CAS 1 : CATÉGORIES
    if (type === 'CATEGORY') {
        const [movedCategory] = newCategories.splice(source.index, 1);
        newCategories.splice(destination.index, 0, movedCategory);
        setActiveServer({ ...server, categories: newCategories });
        try {
            const orderedIds = newCategories.map(c => c.id);
            await api.put('/categories/reorder', { serverId: server.id, orderedIds });
        } catch (err) { console.error(err); }
        return;
    }

    // CAS 2 : SALONS
    const sourceCatIndex = newCategories.findIndex(c => c.id === source.droppableId);
    const destCatIndex = newCategories.findIndex(c => c.id === destination.droppableId);
    
    // Sécurité si la catégorie source/dest n'est pas trouvée (ex: bug sync)
    if (sourceCatIndex === -1 || destCatIndex === -1) return;

    const sourceCat = newCategories[sourceCatIndex];
    const destCat = newCategories[destCatIndex];

    const [movedChannel] = sourceCat.channels.splice(source.index, 1);
    destCat.channels.splice(destination.index, 0, movedChannel);

    setActiveServer({ ...server, categories: newCategories });

    try {
        const orderedIds = destCat.channels.map(c => c.id);
        await api.put('/channels/reorder', {
            activeId: draggableId,
            categoryId: destCat.id,
            orderedIds
        });
    } catch (err) { console.error(err); }
  };

  if (!server.categories) return <div className="text-center mt-10 text-slate-500 text-sm px-2">Chargement...</div>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="server-categories" type="CATEGORY">
            {(provided) => (
                <div 
                    ref={provided.innerRef} 
                    {...provided.droppableProps}
                    className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4"
                >
                    {server.categories.map((cat, index) => {
                        const isCollapsed = collapsedCategories.has(cat.id); // Vérifie si plié

                        return (
                            <Draggable key={cat.id} draggableId={cat.id} index={index} isDragDisabled={!isOwner}>
                                {(provided, snapshot) => (
                                    <div 
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`transition-opacity ${snapshot.isDragging ? 'opacity-50' : ''}`}
                                    >
                                        {/* HEADER CATÉGORIE */}
                                        <div 
                                            {...provided.dragHandleProps}
                                            className="flex items-center justify-between px-1 mb-1 group cursor-pointer hover:text-slate-300 text-slate-400 select-none"
                                            onContextMenu={(e) => onContextMenuCategory(e, cat)}
                                            onClick={() => toggleCategory(cat.id)} // <--- CLIC POUR PLIER/DÉPLIER
                                        >
                                            <div className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-0.5 truncate flex-1" title={cat.name}>
                                                {/* L'icône tourne si c'est plié */}
                                                <svg 
                                                    className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} 
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                                >
                                                    <path d="m6 9 6 6 6-6"/>
                                                </svg>
                                                <span className="truncate">{cat.name}</span>
                                            </div>
                                            
                                            {isOwner && (
                                                <span 
                                                    className="opacity-0 group-hover:opacity-100 text-lg leading-none hover:text-white transition p-0.5 rounded flex-shrink-0"
                                                    onClick={(e) => { e.stopPropagation(); onCreateChannel(cat.id); }}
                                                    title="Créer un salon"
                                                >
                                                    +
                                                </span>
                                            )}
                                        </div>

                                        {/* LISTE DES SALONS (Cachée si isCollapsed) */}
                                        {!isCollapsed && (
                                            <Droppable droppableId={cat.id} type="CHANNEL">
                                                {(provided, snapshot) => (
                                                    <div 
                                                        {...provided.droppableProps} 
                                                        ref={provided.innerRef} 
                                                        className={`space-y-0.5 min-h-[2px] ${snapshot.isDraggingOver ? 'bg-slate-700/20 rounded' : ''}`}
                                                    >
                                                        {cat.channels?.map((channel, index) => {
                                                            const isActive = activeChannel?.id === channel.id;
                                                            return (
                                                                <Draggable key={channel.id} draggableId={channel.id} index={index} isDragDisabled={!isOwner}>
                                                                    {(provided, snapshot) => (
                                                                        <div 
                                                                            ref={provided.innerRef} 
                                                                            {...provided.draggableProps} 
                                                                            {...provided.dragHandleProps} 
                                                                            style={{ ...provided.draggableProps.style }} 
                                                                            onClick={() => onChannelSelect(channel)} 
                                                                            onContextMenu={(e) => onContextMenuChannel(e, channel)}
                                                                            className={`relative px-2 py-[5px] rounded flex items-center gap-1.5 cursor-pointer group transition-colors ${isActive ? 'bg-slate-600/60 text-white' : 'text-slate-400 hover:bg-slate-700/40 hover:text-slate-200'} ${snapshot.isDragging ? 'bg-slate-700 shadow-lg opacity-100 z-50' : ''}`}
                                                                        >
                                                                            <span className="text-lg leading-none text-slate-500 flex-shrink-0">#</span>
                                                                            <span className={`font-medium text-sm truncate flex-1 ${isActive ? 'text-white' : ''}`} title={channel.name}>{channel.name}</span>
                                                                            
                                                                            {isOwner && (
                                                                                <div 
                                                                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white flex-shrink-0 transition-opacity"
                                                                                    onClick={(e) => { e.stopPropagation(); onEditChannel(channel); }} 
                                                                                    title="Modifier le salon"
                                                                                >
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.72l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            );
                                                        })}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        )}
                                    </div>
                                )}
                            </Draggable>
                        );
                    })}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    </DragDropContext>
  );
}