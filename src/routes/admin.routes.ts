import { Router } from 'express';
import { AdminController } from '../modules/admin/AdminController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { ensureAdmin } from '../middlewares/ensureAdmin';

const adminRoutes = Router();
const adminController = new AdminController();

// Todas as rotas abaixo exigem obrigatoriamente login E cargo de Admin
adminRoutes.get('/reports', ensureAuthenticated, ensureAdmin, adminController.listReports);
adminRoutes.delete('/topics/:id', ensureAuthenticated, ensureAdmin, adminController.deleteTopic);

export { adminRoutes };
