import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { ensureAuthenticated } from '../../../middlewares/ensureAuthenticated';

const chatRoutes = Router();
const chatController = new ChatController();

// Rotas protegidas do chat
chatRoutes.post('/', ensureAuthenticated, chatController.create);
chatRoutes.post('/message', ensureAuthenticated, chatController.sendMessage);
chatRoutes.get('/me', ensureAuthenticated, chatController.listMyChats);
chatRoutes.get('/:chatId/messages', ensureAuthenticated, chatController.getChatMessages);


export { chatRoutes };
