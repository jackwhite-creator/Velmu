import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Server, useServerStore } from '../store/serverStore';

interface Props {
  isOpen: boolean;
  server: Server;
  onClose: () => void;
}

export default function EditServerModal({ isOpen, server, onClose }: Props) {
  const { setServers, servers, setActiveServer } = useServerStore();
  const [name, setName] = useState(server.name);
  const [iconUrl, setIconUrl] = useState(server.iconUrl || '');
  const [isLoading, setIsLoading] = useState(false);

  // Reset des champs quand on ouvre la modale avec un nouveau serveur
  useEffect(() => {
    if (isOpen) {
      setName(server.name);
      setIconUrl(server.iconUrl || '');
    }
  }, [isOpen, server]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);

    try {
      const res = await api.put(`/servers/${server.id}`, { name, iconUrl });
      const updatedServer = res.data;

      // Mise à jour du store local
      const updatedList = servers.map(s => s.id === server.id ? { ...s, ...updatedServer } : s);
      setServers(updatedList);
      setActiveServer({ ...server, ...updatedServer }); // Garde les catégories existantes
      
      onClose();
    } catch (error) {
      console.error("Erreur update", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-slate-800 w-full max-w-md rounded-lg p-6 border border-slate-700 shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-center text-white mb-6">Paramètres du serveur</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-slate-700 border-2 border-dashed border-slate-500 flex items-center justify-center overflow-hidden relative">
              {iconUrl ? (
                <img src={iconUrl} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <div className="text-slate-500 text-xs text-center px-2">Icon URL</div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nom du serveur</label>
            <input 
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 outline-none"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">URL de l'icône</label>
            <input 
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 outline-none"
              value={iconUrl}
              onChange={e => setIconUrl(e.target.value)}
            />
          </div>

          <div className="flex justify-between pt-4">
             <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:underline">Annuler</button>
             <button type="submit" disabled={isLoading} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium">Sauvegarder</button>
          </div>
        </form>
      </div>
    </div>
  );
}