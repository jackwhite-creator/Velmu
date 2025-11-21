import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './authStore';

// On récupère l'URL depuis l'environnement ou on met par défaut
const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') // On retire /api si présent
  : 'http://localhost:4000';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: () => {
    // 1. Si déjà connecté ou connexion en cours, on ne fait rien
    const { socket } = get();
    if (socket?.connected) return;

    // 2. Récupération du token depuis ton AuthStore existant
    const token = useAuthStore.getState().token;
    if (!token) return;

    // 3. Initialisation propre
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,       // Essaye de se reconnecter auto
      reconnectionAttempts: 5,  // Max 5 fois
    });

    // 4. Gestion des événements de base (Debug & État)
    newSocket.on('connect', () => {
      console.log('🟢 Socket connecté:', newSocket.id);
      set({ isConnected: true });
    });

    newSocket.on('disconnect', () => {
      console.log('🔴 Socket déconnecté');
      set({ isConnected: false });
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });
    
    // --- ICI ON BRANCHERA LES ÉCOUTEURS GLOBAUX PLUS TARD SI BESOIN ---

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  }
}));