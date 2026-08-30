import { Request, Response } from 'express';
import { prisma } from '../../../prisma/client';
import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { authConfig } from '../../../config/auth';

export class LoginController {
  async handle(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
      }

      // Geração do Token JWT amarrando o User ID no subject ('sub')
      const token = sign(
        { nickname: user.nickname }, 
        authConfig.jwt.secret, 
        {
          subject: user.id, 
          expiresIn: authConfig.jwt.expiresIn,
        }
      );

      return res.json({
        user: {
          id: user.id,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
        },
        token,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno ao realizar login.' });
    }
  }
}
