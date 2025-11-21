import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- 1. IMPORT
import api from '../lib/api';
import { useServerStore } from '../store/serverStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinServerModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate(); // <--- 2. HOOK
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { addServer, setActiveServer, setActiveChannel, setActiveConversation, servers } = useServerStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    const code = inviteCode.split('/').pop() || inviteCode;

    setIsLoading(true);
    setError('');

    try {
      // 1. Rejoindre
      const res = await api.post(`/invites/${code}/join`);
      const joinedServer = res.data;

      if (!joinedServer || !joinedServer.id) throw new Error("Réponse invalide");

      // Si déjà membre, on redirige juste
      const existing = servers.find(s => s.id === joinedServer.id);
      if (existing) {
          setActiveServer(existing);
          // On tente de trouver le premier salon pour rediriger
          if (existing.categories?.[0]?.channels?.[0]) {
             const firstChannel = existing.categories[0].channels[0];
             setActiveChannel(firstChannel);
             navigate(`/channels/${existing.id}/${firstChannel.id}`); // <--- REDIRECTION
          }
          onClose();
          return;
      }

      // 2. Récupérer les détails COMPLETS
      const fullServerRes = await api.get(`/servers/${joinedServer.id}`);
      const fullServer = fullServerRes.data;

      // 3. Mise à jour Store
      addServer(fullServer);
      setActiveServer(fullServer);
      setActiveConversation(null);

      // 4. Activer le premier salon ET REDIRIGER
      if (fullServer.categories?.[0]?.channels?.[0]) {
        const firstChannel = fullServer.categories[0].channels[0];
        setActiveChannel(firstChannel);
        navigate(`/channels/${fullServer.id}/${firstChannel.id}`); // <--- REDIRECTION MAGIQUE
      } else {
        setActiveChannel(null);
        navigate(`/channels/${fullServer.id}`);
      }

      onClose();
      setInviteCode('');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Invitation invalide ou expirée");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-slate-800 w-full max-w-md rounded-lg shadow-2xl overflow-hidden transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Rejoindre un serveur</h2>
          <p className="text-slate-400 text-sm">Saisis le code d'invitation ci-dessous.</p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Code d'invitation</label>
            <input 
              autoFocus
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full bg-slate-900 text-white p-2.5 rounded border border-slate-700 focus:border-green-500 focus:ring-0 outline-none font-medium transition-colors"
              placeholder="Ex: kjs82Kd"
            />
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          </div>
          <div className="flex justify-between items-center mt-8 bg-slate-900/50 -mx-6 px-6 py-4 border-t border-slate-700">
             <button type="button" onClick={onClose} className="text-slate-300 hover:underline text-sm font-medium">Retour</button>
             <button 
               type="submit" 
               disabled={isLoading || !inviteCode.trim()}
               className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded text-sm font-medium transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isLoading ? 'Connexion...' : 'Rejoindre'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}