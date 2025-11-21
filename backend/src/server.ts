import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import dotenv from 'dotenv';
import { initializeSocket } from './socket';

dotenv.config();

const PORT = process.env.PORT || 4000;

// 1. Création du serveur HTTP
const httpServer = createServer(app);

// 2. Configuration de Socket.IO
const io = new Server(httpServer, {
  cors: {
    // 👇 ICI LE FIX : On autorise Localhost ET Vercel
    origin: [
        "http://localhost:5173", 
        "https://velmu-m3fe.vercel.app", 
        /\.vercel\.app$/ // Regex pour autoriser toutes les previews Vercel
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 3. Partage de l'instance IO avec Express
app.set('io', io);

// 4. Initialisation des événements Socket
initializeSocket(io);

// 5. Lancement
httpServer.listen(PORT, () => {
  console.log(`✅ Serveur Velmu lancé sur http://localhost:${PORT}`);
});