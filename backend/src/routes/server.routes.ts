import { Router } from 'express';
import { ServerController } from '../controllers/server.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/servers -> Créer un serveur
router.post('/', authenticateToken, ServerController.create);

// GET /api/servers/me -> Mes serveurs
router.get('/me', authenticateToken, ServerController.getMyServers);

// GET /api/servers/:id -> Détails d'un serveur (pour afficher la sidebar)
router.get('/:id', authenticateToken, ServerController.getOne);

// PUT /api/servers/:id -> Modifier un serveur
router.put('/:id', authenticateToken, ServerController.update);

// DELETE /api/servers/:id -> Supprimer un serveur
router.delete('/:id', authenticateToken, ServerController.delete);

// POST /api/servers/:id/leave -> Quitter un serveur
router.post('/:id/leave', authenticateToken, ServerController.leave);

export default router;