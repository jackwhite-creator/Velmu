import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { getConversationMessages } from '../controllers/chat.controller'; // <--- Import du contrôleur qu'on vient de créer
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/conversations -> Démarrer un MP
router.post('/', authenticateToken, ConversationController.getOrCreate);

// GET /api/conversations/me -> Mes MPs (Liste gauche)
router.get('/me', authenticateToken, ConversationController.getMyConversations);

// GET /api/conversations/:conversationId/messages -> Historique des messages
router.get('/:conversationId/messages', authenticateToken, getConversationMessages); // <--- La route manquante !

export default router;