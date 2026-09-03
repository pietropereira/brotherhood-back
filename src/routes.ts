import { Router } from 'express';
import { authRoutes } from './modules/auth/routes/auth.routes';
import { topicRoutes } from './modules/topics/routes/topic.routes';
import { chatRoutes } from './modules/chats/routes/chat.routes';
import adminRoutes = require('./routes/admin.routes');
const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/topics', topicRoutes);
routes.use('/chats', chatRoutes);
routes.use('/admin', adminRoutes.adminRoutes);

export { routes };
