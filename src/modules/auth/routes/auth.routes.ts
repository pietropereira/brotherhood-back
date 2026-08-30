import { Router } from 'express';
import { RegisterController } from '../controllers/RegisterController'; // 👈 Um ponto (.) a menos!
import { LoginController } from '../controllers/LoginController'; 

const authRoutes = Router();

const registerController = new RegisterController();
const loginController = new LoginController();

authRoutes.post('/register', registerController.handle);
authRoutes.post('/login', loginController.handle);

export { authRoutes };
