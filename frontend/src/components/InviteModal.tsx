import { useEffect, useState } from 'react';
import { Server } from '../store/serverStore';
import api from '../lib/api';

interface Props {
  isOpen: boolean;
  server: Server | null;
  onClose: () => void;
}

export default function InviteModal({ isOpen, server, onClose }: Props) {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Génération automatique à l'ouverture
  useEffect(() => {
    if (isOpen && server) {
      const generateInvite = async () => {
        setIsLoading(true);
        try {
          // Appel à la route qu'on vient de créer
          const res = await api.post('/invites/create', { serverId: server.id });
          setInviteCode(res.data.code);
        } catch (error) {
          console.error("Erreur génération invitation", error);
        } finally {
          setIsLoading(false);
        }
      };
      generateInvite();
    } else {
      setInviteCode('');
      setCopied(false);
    }
  }, [isOpen, server]);

  if (!isOpen || !server) return null;

  const fullLink = `${window.location.origin}/invite/${inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullLink); // Ou juste le code selon ta pref
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-slate-800 w-full max-w-md rounded-lg shadow-2xl overflow-hidden p-6" onClick={e => e.stopPropagation()}>
        
        <h2 className="text-lg font-bold text-white mb-2">Inviter des amis dans {server.name}</h2>
        <p className="text-slate-400 text-sm mb-6">Partagez ce code avec vos amis pour qu'ils rejoignent le serveur.</p>

        <div className="bg-slate-950 p-2 rounded border border-slate-700 flex items-center justify-between relative">
           {isLoading ? (
             <span className="text-slate-500 text-sm pl-2">Génération du code unique...</span>
           ) : (
             <input 
               readOnly 
               value={inviteCode} 
               className="bg-transparent text-slate-200 font-mono text-lg outline-none w-full"
             />
           )}
           
           <button 
             onClick={handleCopy} 
             disabled={isLoading}
             className={`ml-2 px-4 py-1.5 rounded text-sm font-medium transition ${copied ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
           >
             {copied ? 'Copié' : 'Copier'}
           </button>
        </div>

        <p className="text-xs text-slate-500 mt-4">Votre lien d'invitation expire dans 7 jours.</p>
      </div>
    </div>
  );
}