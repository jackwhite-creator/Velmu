import { Router } from 'express';
import { ChannelController } from '../controllers/channel.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticateToken, ChannelController.create);
router.put('/reorder', authenticateToken, ChannelController.reorder); // <--- NOUVEAU
router.put('/:channelId', authenticateToken, ChannelController.update);
router.delete('/:channelId', authenticateToken, ChannelController.delete);

export default router;