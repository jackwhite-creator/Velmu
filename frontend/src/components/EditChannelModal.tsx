import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Channel } from '../store/serverStore';
import ConfirmModal from './ConfirmModal';

interface Props {
  isOpen: boolean;
  channel: Channel | null;
  onClose: () => void;
}

export default function EditChannelModal({ isOpen, channel, onClose }: Props) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialisation du formulaire à l'ouverture
  useEffect(() => {
    if (channel) {
      setName(channel.name);
    }
  }, [channel, isOpen]);

  if (!isOpen || !channel) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      // 1. Appel API (Modification)
      await api.put(`/channels/${channel.id}`, { name });
      // Le socket "refresh_server_ui" s'occupera de mettre à jour l'interface
      onClose();
    } catch (error) {
      console.error("Erreur modification salon", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      // 2. Appel API (Suppression)
      await api.delete(`/channels/${channel.id}`);
      // Le socket gérera le reste
      onClose();
    } catch (error) {
      console.error("Erreur suppression salon", error);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-slate-800 w-full max-w-lg rounded-lg shadow-2xl overflow-hidden border border-slate-700 flex flex-col animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-lg font-bold text-white uppercase tracking-wide">Paramètres du salon</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
            
            {/* Section Nom */}
            <form id="edit-channel-form" onSubmit={handleSave}>
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Nom du salon</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-medium">#</span>
                        <input 
                            value={name}
                            onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))} // Slugify auto
                            className="w-full bg-slate-900 text-white p-2.5 pl-8 rounded border border-slate-700 focus:border-indigo-500 focus:ring-0 outline-none font-medium transition-colors"
                            placeholder="nouveau-nom"
                        />
                    </div>
                </div>
            </form>

            <div className="h-px bg-slate-700 my-4"></div>

            {/* Section Zone de Danger */}
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Suppression</h3>
                <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-red-900/30">
                    <span className="text-sm text-slate-300">Tu veux supprimer ce salon définitivement ?</span>
                    <button 
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-1.5 bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded text-sm font-medium transition"
                    >
                        Supprimer
                    </button>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-900/80 flex justify-end gap-3 border-t border-slate-700">
            <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 text-slate-300 hover:underline text-sm font-medium"
            >
                Annuler
            </button>
            <button 
                type="submit" 
                form="edit-channel-form"
                disabled={isLoading || !name.trim() || name === channel.name}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
        </div>
      </div>

      {/* Modale de confirmation pour la suppression */}
      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={`Supprimer #${channel.name}`}
        message={<span>Es-tu sûr de vouloir supprimer le salon <strong>#{channel.name}</strong> ? Cette action est irréversible.</span>}
        isDestructive={true}
        confirmText="Supprimer le salon"
      />
    </div>
  );
}