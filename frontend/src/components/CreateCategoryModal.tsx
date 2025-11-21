import { useState } from 'react';
import api from '../lib/api';
import { useServerStore } from '../store/serverStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  serverId: string;
}

export default function CreateCategoryModal({ isOpen, onClose, serverId }: Props) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setActiveServer, activeServer } = useServerStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await api.post('/categories', { name, serverId });
      
      // On rafraichit les données pour voir la catégorie tout de suite (si le socket tarde)
      const res = await api.get(`/servers/${serverId}`);
      setActiveServer(res.data);
      
      onClose();
      setName('');
    } catch (error) {
      console.error("Erreur création catégorie", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-slate-800 w-full max-w-md rounded-lg p-6 border border-slate-700 shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-2">Créer une catégorie</h2>
        <p className="text-slate-400 text-sm mb-6">Regroupez vos salons par thèmes.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nom de la catégorie</label>
            <input 
              autoFocus
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-indigo-500 outline-none"
              value={name}
              onChange={e => setName(e.target.value.toUpperCase())} // Souvent en majuscules sur Discord
              placeholder="NOUVELLE CATÉGORIE"
            />
          </div>

          <div className="flex justify-between pt-4">
             <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:underline">Annuler</button>
             <button type="submit" disabled={!name.trim() || isLoading} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition disabled:opacity-50">
               Créer
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}