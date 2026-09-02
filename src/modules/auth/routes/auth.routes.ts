import { Router } from 'express';
import { RegisterController } from '../controllers/RegisterController'; // 👈 Um ponto (.) a menos!
import { LoginController } from '../controllers/LoginController'; 
import { DeleteAccountController } from '../controllers/UserController';
import { ensureAuthenticated } from '../../../middlewares/ensureAuthenticated';

const authRoutes = Router();
const deleteAccountController = new DeleteAccountController();

const registerController = new RegisterController();
const loginController = new LoginController();

authRoutes.post('/register', registerController.handle);
authRoutes.post('/login', loginController.handle);
authRoutes.delete('/me', ensureAuthenticated, deleteAccountController.handle);

export { authRoutes };
