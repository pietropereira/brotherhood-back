import { Router } from 'express';
import { authRoutes } from './modules/auth/routes/auth.routes';
import { topicRoutes } from './modules/topics/routes/topic.routes';
import { chatRoutes } from './modules/chats/routes/chat.routes';
const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/topics', topicRoutes);
routes.use('/chats', chatRoutes);

export { routes };
