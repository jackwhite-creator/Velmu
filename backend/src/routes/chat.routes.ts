import { Router } from 'express';
import { getChannelMessages, updateMessage, deleteMessage, uploadFile } from '../controllers/chat.controller'; // Ajoute uploadFile
import { authenticateToken } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// GET
router.get('/:channelId/messages', authenticateToken, getChannelMessages);

// PUT (Modifier)
router.put('/:messageId', authenticateToken, updateMessage);

// DELETE (Supprimer)
router.delete('/:messageId', authenticateToken, deleteMessage);

router.post('/', authenticateToken, upload.single('file'), uploadFile);

export default router;