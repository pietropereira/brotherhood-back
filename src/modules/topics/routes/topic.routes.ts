import { Router } from 'express';
import { TopicController } from '../controllers/TopicController';
import { ensureAuthenticated } from '../../../middlewares/ensureAuthenticated';
import { ReportController } from '../controllers/ReportController'; 

const topicRoutes = Router();
const topicController = new TopicController();
const reportController = new ReportController();

// Rotas
topicRoutes.post('/', ensureAuthenticated, topicController.create); // Protegida por Token
topicRoutes.get('/', topicController.list); // Pública para a comunidade ler
topicRoutes.post('/report', ensureAuthenticated, reportController.create);

export { topicRoutes };
