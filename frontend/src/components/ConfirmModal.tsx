import { useState } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  showCancel?: boolean; // <--- NOUVELLE PROP
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  isDestructive = false,
  showCancel = true, // <--- Par défaut, on affiche les deux boutons
}: ConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error(error);
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
        className="bg-slate-800 w-full max-w-sm rounded-lg shadow-2xl border border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
          <div className="text-slate-400 text-sm leading-relaxed">
            {message}
          </div>
        </div>

        <div className="bg-slate-900/50 p-4 flex justify-end gap-3 border-t border-slate-700/50">
          {/* On cache ce bouton si showCancel est false */}
          {showCancel && (
            <button 
                onClick={onClose}
                className="px-4 py-2 text-slate-300 hover:underline text-sm font-medium transition"
                disabled={isLoading}
            >
                {cancelText}
            </button>
          )}
          
          <button 
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-6 py-2 rounded text-white text-sm font-medium transition shadow-lg 
              ${isDestructive 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20'
              } 
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isLoading ? '...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}