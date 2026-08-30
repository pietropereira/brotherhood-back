import { Router } from 'express';
import { TopicController } from '../controllers/TopicController';
import { ensureAuthenticated } from '../../../middlewares/ensureAuthenticated';

const topicRoutes = Router();
const topicController = new TopicController();

// Rotas
topicRoutes.post('/', ensureAuthenticated, topicController.create); // Protegida por Token
topicRoutes.get('/', topicController.list); // Pública para a comunidade ler

export { topicRoutes };
