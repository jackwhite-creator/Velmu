import React, { useRef, useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Channel } from '../../store/serverStore';
import { useAuthStore } from '../../store/authStore';
import TypingIndicator from './TypingIndicator';

interface Props {
  inputValue: string;
  setInputValue: (val: string) => void;
  // On modifie la signature pour accepter un fichier optionnel
  onSendMessage: (e: React.FormEvent, file?: File | null) => void;
  replyingTo: any;
  setReplyingTo: (msg: any) => void;
  socket: Socket | null;
  activeChannel: Channel;
}

export default function ChatInput({ 
  inputValue, setInputValue, onSendMessage, replyingTo, setReplyingTo, socket, activeChannel 
}: Props) {
  const { user } = useAuthStore();
  
  // 👇 CORRECTION ICI : On utilise ReturnType<typeof setTimeout> pour être compatible navigateur
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  
  // --- GESTION FICHIER ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Nettoyage de l'URL object pour éviter les fuites de mémoire
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Gestion du Coller (Ctrl+V) pour les images
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(file));
          e.preventDefault(); // On empêche de coller le nom du fichier texte
        }
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // On envoie le fichier avec
    onSendMessage(e, selectedFile);
    // Reset après envoi
    clearFile();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!socket || !user || !activeChannel) return;

    const now = Date.now();
    const payload = { 
        channelId: activeChannel.type !== 'dm' ? activeChannel.id : undefined,
        conversationId: activeChannel.type === 'dm' ? activeChannel.id : undefined,
        username: user.username
    };

    if (now - lastTypingSentRef.current > 2000) {
        socket.emit('typing_start', payload);
        lastTypingSentRef.current = now;
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', payload);
    }, 3000);
  };

  return (
    <div className="bg-slate-900 flex-shrink-0 px-4 pb-6 pt-2">
        
        {/* ZONE PREVIEW IMAGE */}
        {previewUrl && (
            <div className="flex items-start mb-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 relative w-fit">
                <div className="relative group">
                    <img src={previewUrl} alt="Upload preview" className="h-32 rounded-md object-cover border border-slate-700" />
                    <button 
                        onClick={clearFile}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition transform hover:scale-110"
                        title="Retirer l'image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div className="ml-3 max-w-xs">
                    <p className="text-sm text-slate-200 font-medium truncate">{selectedFile?.name}</p>
                    <p className="text-xs text-slate-400">{(selectedFile!.size / 1024).toFixed(1)} KB</p>
                </div>
            </div>
        )}

        {replyingTo && (
            <div className="flex items-center justify-between bg-slate-800/50 px-4 py-2 rounded-t-lg border-t border-x border-slate-700/50 text-sm text-slate-300">
                <span>Réponse à <span className="font-bold">@{replyingTo.user.username}</span></span>
                <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        )}

        <TypingIndicator 
            socket={socket} 
            channelId={activeChannel.type !== 'dm' ? activeChannel.id : undefined}
            conversationId={activeChannel.type === 'dm' ? activeChannel.id : undefined}
        />

        <div className={`bg-slate-700/50 p-3 flex items-center gap-3 border border-slate-700 focus-within:border-indigo-500/50 transition-all ${replyingTo ? 'rounded-b-lg' : 'rounded-lg'}`}>
            
            {/* INPUT FILE CACHÉ */}
            <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*" // On filtre les images pour l'instant
            />

            {/* BOUTON PLUS (+) */}
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-slate-400 hover:text-slate-200 transition p-1 rounded-full hover:bg-slate-600"
                title="Envoyer un fichier"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </button>
            
            <form onSubmit={handleSubmit} className="flex-1">
                <input 
                  className="w-full bg-transparent text-slate-200 outline-none font-medium placeholder-slate-500" 
                  placeholder={`Envoyer un message ${activeChannel.type === 'dm' ? 'à @' + activeChannel.name : 'dans #' + activeChannel.name}`} 
                  value={inputValue} 
                  onChange={handleInputChange} 
                  onPaste={handlePaste} // Ajout du Paste
                />
            </form>
            
            <div className="flex gap-2 text-slate-400">
                {/* Icône d'envoi cliquable (pour mobile ou confort) */}
                {(inputValue.trim() || selectedFile) && (
                    <svg onClick={handleSubmit} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer text-indigo-400 hover:text-indigo-300 transition p-1"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                )}
            </div>
        </div>
    </div>
  );
}