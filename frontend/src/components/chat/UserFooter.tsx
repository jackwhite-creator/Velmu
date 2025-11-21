import { useAuthStore } from '../../store/authStore';

interface Props {
  isConnected: boolean;
  onOpenProfile: () => void;
}

export default function UserFooter({ isConnected, onOpenProfile }: Props) {
  const { user } = useAuthStore();

  return (
    <div className="p-2 bg-slate-850 border-t border-slate-700 flex items-center gap-1">
        <div className="flex items-center gap-2 flex-1 hover:bg-slate-700/60 p-1.5 rounded cursor-pointer transition select-none group" onClick={onOpenProfile}>
            <div className="relative">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white overflow-hidden">
                    {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user?.username?.[0]}
                </div>
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-[2px] border-slate-800 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} title={isConnected ? 'Connecté' : 'Connexion...'}></div>
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate text-white">{user?.username}</div>
                <div className="text-[11px] text-slate-400">#{user?.discriminator}</div>
            </div>
        </div>
        <button onClick={onOpenProfile} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>
    </div>
  );
}