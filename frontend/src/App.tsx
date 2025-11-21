import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useSocketStore } from './store/socketStore';
import { useServerStore } from './store/serverStore';
import { useFriendStore } from './store/friendStore';
import api from './lib/api'; // <--- 1. IMPORT API NÉCESSAIRE

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import InvitePage from './pages/InvitePage';

function App() {
  const { token } = useAuthStore();
  const { connect, disconnect, socket } = useSocketStore();

  const { setOnlineUsers, updateUserStatus, addConversation } = useServerStore();
  // On récupère setRequests pour initialiser la liste
  const { addRequest, updateRequest, removeRequest, setRequests } = useFriendStore(); 

  // 1. GESTION CONNEXION
  useEffect(() => {
    if (token) connect();
    else disconnect();
    return () => disconnect();
  }, [token, connect, disconnect]);

  // 2. CHARGEMENT INITIAL DES DONNÉES (C'est ce qui manquait !)
  useEffect(() => {
    if (token) {
      // On charge la liste des amis et demandes dès le lancement
      api.get('/friends')
         .then((res) => setRequests(res.data))
         .catch((err) => console.error("Erreur chargement amis", err));
    }
  }, [token, setRequests]);

  // 3. ÉCOUTEURS GLOBAUX
  useEffect(() => {
    if (!socket) return;

    socket.on('initial_online_users', (ids: string[]) => setOnlineUsers(ids));
    socket.on('user_status_change', ({ userId, status }: any) => updateUserStatus(userId, status === 'online'));
    
    socket.on('new_conversation', (conv) => addConversation(conv));
    socket.on('new_friend_request', addRequest);
    socket.on('friend_request_accepted', (req) => {updateRequest(req.id, 'ACCEPTED', req);});
    socket.on('friend_removed', removeRequest);

    return () => {
      socket.off('initial_online_users');
      socket.off('user_status_change');
      socket.off('new_conversation');
      socket.off('new_friend_request');
      socket.off('friend_request_accepted');
      socket.off('friend_removed');
    };
  }, [socket, setOnlineUsers, updateUserStatus, addConversation, addRequest, updateRequest, removeRequest]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/invite/:code" element={token ? <InvitePage /> : <Navigate to="/login" />} />
      <Route path="/channels/*" element={token ? <ChatPage /> : <Navigate to="/login" />} />
      <Route path="/" element={<Navigate to={token ? "/channels/@me" : "/login"} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;