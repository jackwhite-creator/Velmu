import { Router } from 'express';
import { FriendController } from '../controllers/friend.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/friends -> Lister toutes les relations (Amis, En attente)
router.get('/', authenticateToken, FriendController.getAll);

// POST /api/friends/request -> Envoyer une demande d'ami
router.post('/request', authenticateToken, FriendController.sendRequest);

// POST /api/friends/respond -> Accepter ou Refuser une demande
router.post('/respond', authenticateToken, FriendController.respond);

// DELETE /api/friends/:id -> Supprimer un ami ou annuler une demande
// On utilise ':id' car cela peut être un requestId OU un userId (géré par le contrôleur)
router.delete('/:id', authenticateToken, FriendController.delete);

export default router;