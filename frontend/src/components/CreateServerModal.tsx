import { useState } from 'react';
import api from '../lib/api';
import { useServerStore } from '../store/serverStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateServerModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { addServer, setActiveServer, setActiveChannel, setActiveConversation } = useServerStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // 1. Création (Renvoie juste l'ID et le nom)
      const res = await api.post('/servers', { name });
      const newServerLight = res.data;

      // 2. FIX : On récupère immédiatement les détails COMPLETS (avec catégories/salons)
      const fullServerRes = await api.get(`/servers/${newServerLight.id}`);
      const fullServer = fullServerRes.data;

      // 3. Mise à jour du Store
      addServer(fullServer);
      setActiveServer(fullServer);
      setActiveConversation(null);

      // 4. Sélection du salon par défaut
      if (fullServer.categories?.[0]?.channels?.[0]) {
          setActiveChannel(fullServer.categories[0].channels[0]);
      } else {
          setActiveChannel(null);
      }

      onClose();
      setName('');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-in fade-in duration-200" onClick={onClose}>
      {/* RETOUR AU DESIGN SLATE */}
      <div className="bg-slate-800 w-full max-w-md rounded-lg shadow-2xl overflow-hidden transform transition-all" onClick={e => e.stopPropagation()}>
        
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Personnalise ton serveur</h2>
          <p className="text-slate-400 text-sm">Donne un nom à ton nouveau serveur. Tu pourras toujours le changer plus tard.</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6">
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nom du serveur</label>
            <input 
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 text-white p-2.5 rounded border border-slate-700 focus:border-indigo-500 focus:ring-0 outline-none font-medium transition-colors"
              placeholder="Mon super serveur"
            />
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          </div>

          <div className="flex justify-between items-center mt-8 bg-slate-900/50 -mx-6 px-6 py-4 border-t border-slate-700">
             <button type="button" onClick={onClose} className="text-slate-300 hover:underline text-sm font-medium">Retour</button>
             <button 
               type="submit" 
               disabled={isLoading || !name.trim()}
               className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded text-sm font-medium transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isLoading ? 'Création...' : 'Créer'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}