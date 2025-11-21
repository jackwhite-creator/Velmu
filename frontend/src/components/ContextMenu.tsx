import React, { useEffect, useRef } from 'react';

// --- TYPES ---

interface ContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  children: React.ReactNode;
}

interface ContextMenuItemProps {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

// --- COMPOSANT CONTENEUR ---
export function ContextMenu({ position, onClose, children }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer si on clique en dehors (Clic Gauche seulement)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    // On écoute le clic gauche pour fermer
    // On écoute le scroll pour fermer (UX standard)
    // ON NE MET PAS 'contextmenu' ICI pour éviter le conflit d'ouverture immédiate
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', onClose, true); 
    
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', onClose, true);
    };
  }, [onClose]);

  // Ajustement pour ne pas sortir de l'écran (Basic)
  const style = { 
    top: position.y, 
    left: position.x,
  };

  return (
    <div 
      ref={menuRef}
      className="fixed z-[9999] bg-[#111214] border border-slate-900 rounded-md shadow-xl p-1.5 min-w-[180px] animate-in fade-in duration-100 zoom-in-95"
      style={style}
      onClick={(e) => e.stopPropagation()} // Empêche la propagation du clic
      onContextMenu={(e) => e.preventDefault()} // Empêche le menu natif SUR le menu contextuel
    >
      {children}
    </div>
  );
}

// --- COMPOSANT ITEM ---
export function ContextMenuItem({ label, icon, onClick, variant = 'default' }: ContextMenuItemProps) {
  const baseClass = "flex justify-between items-center px-2 py-2 rounded-sm cursor-pointer text-sm font-medium transition group w-full text-left";
  const variantClass = variant === 'danger' 
    ? "hover:bg-red-500 text-red-400 hover:text-white" 
    : "hover:bg-indigo-600 text-slate-300 hover:text-white";

  return (
    <button onClick={onClick} className={`${baseClass} ${variantClass}`}>
      <span>{label}</span>
      {icon && <span className="ml-4 opacity-70 group-hover:opacity-100">{icon}</span>}
    </button>
  );
}

// --- COMPOSANT SÉPARATEUR ---
export function ContextMenuSeparator() {
  return <div className="h-[1px] bg-slate-700/50 my-1 mx-1"></div>;
}