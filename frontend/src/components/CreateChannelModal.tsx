import { useState } from 'react';
import api from '../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string | null;
  onSuccess: () => void; // Pour dire à la page parente de rafraîchir
}

export default function CreateChannelModal({ isOpen, onClose, categoryId, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !categoryId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await api.post('/channels', { name, categoryId });
      onSuccess(); // On recharge les données
      onClose();
      setName('');
    } catch (error) {
      console.error("Erreur création salon", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 w-full max-w-md rounded-lg p-6 border border-slate-700 shadow-xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-2">Créer un salon</h2>
        <p className="text-slate-400 text-sm mb-6">Dans la catégorie sélectionnée.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nom du salon</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">#</span>
              <input 
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 pl-8 text-white focus:border-indigo-500 outline-none"
                value={name}
                onChange={e => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))} // Format slug (minuscules, tirets)
                placeholder="nouveau-salon"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
             <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:underline">Annuler</button>
             <button 
               type="submit" 
               disabled={!name.trim() || isLoading}
               className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition disabled:opacity-50"
             >
               Créer le salon
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}