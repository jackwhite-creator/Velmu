import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import userRoutes from './routes/user.routes';
import serverRoutes from './routes/server.routes';
import categoryRoutes from './routes/category.routes';
import channelRoutes from './routes/channel.routes';
import inviteRoutes from './routes/invite.routes';
import memberRoutes from './routes/member.routes';
import conversationRoutes from './routes/conversation.routes';
import friendRoutes from './routes/friend.routes';

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());

// Utiliser process.cwd() pour un chemin absolu fiable vers les uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/friends', friendRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('API Velmu is running 🚀');
});

export default app;