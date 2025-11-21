interface Props {
  replyTo: {
    id: string;
    content: string;
    user: { username: string; avatarUrl: string | null };
  };
  onClick: () => void;
}

export default function MessageReplyHeader({ replyTo, onClick }: Props) {
  return (
    <div className="flex items-center ml-[18px] mb-1 select-none">
      {/* La ligne courbée */}
      <div className="w-8 h-4 border-l-2 border-t-2 border-slate-600 rounded-tl-md mr-1 self-end mb-2 flex-shrink-0"></div>
      
      {/* Le bloc cliquable */}
      <div 
        onClick={onClick}
        className="flex items-center gap-1.5 cursor-pointer opacity-70 hover:opacity-100 transition min-w-0 group/replyHeader"
      >
        {/* Mini Avatar */}
        <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
          {replyTo.user.avatarUrl ? (
            <img src={replyTo.user.avatarUrl} className="w-full h-full object-cover" alt="" />
          ) : (
            <span className="text-[9px] text-white font-bold leading-none">
              {replyTo.user.username?.[0]?.toUpperCase()}
            </span>
          )}
        </div>
        
        {/* Nom de l'auteur cité */}
        <span className="font-semibold text-xs text-slate-400 hover:text-white hover:underline transition-colors flex-shrink-0">
          @{replyTo.user.username}
        </span>

        {/* Contenu du message cité (C'est ici qu'on limite la taille !) */}
        {/* 'truncate' met les '...' et 'max-w' empêche de casser la page */}
        <span className="text-xs text-slate-500 truncate max-w-[200px] md:max-w-md group-hover/replyHeader:text-slate-300 transition-colors">
          {replyTo.content || <span className="italic text-slate-600">Cliquez pour voir l'image/fichier</span>}
        </span>
      </div>
    </div>
  );
}