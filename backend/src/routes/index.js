import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { upload } from '../config/multer.js';
import { register, login, me } from '../controllers/auth.controller.js';
import { searchUsers, listChats, createChat } from '../controllers/chat.controller.js';
import { getMessages } from '../controllers/message.controller.js';
import { uploadFile } from '../controllers/upload.controller.js';

const router = Router();

router.post('/auth/register', asyncHandler(register));
router.post('/auth/login', asyncHandler(login));
router.get('/auth/me', requireAuth, asyncHandler(me));

router.get('/users', requireAuth, asyncHandler(searchUsers));

router.get('/chats', requireAuth, asyncHandler(listChats));
router.post('/chats', requireAuth, asyncHandler(createChat));

router.post('/messages/upload', requireAuth, upload.single('file'), asyncHandler(uploadFile));
router.get('/messages/:chatId', requireAuth, asyncHandler(getMessages));

export default router;
