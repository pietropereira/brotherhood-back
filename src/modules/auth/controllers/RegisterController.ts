import { Request, Response } from 'express';
import { prisma } from '../../../prisma/client';
import bcrypt from 'bcrypt';

export class RegisterController {
  async handle(req: Request, res: Response): Promise<Response> {
    const { email, password, nickname, avatarUrl } = req.body;

    if (!email || !password || !nickname) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    try {
      // 1. Garante unicidade do e-mail
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ error: 'Este e-mail já está em uso.' });
      }

      // 2. Garante o anonimato estrito validando se o nickname já existe
      const nicknameExists = await prisma.user.findUnique({ where: { nickname } });
      if (nicknameExists) {
        return res.status(400).json({ error: 'Este nickname já está sendo usado por outro irmão.' });
      }

      // 3. Hasheia a senha com segurança
      const hashedPassword = await bcrypt.hash(password, 10);

      // 4. Salva no banco obedecendo os campos opcionais (? no schema)
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          nickname,
          avatarUrl: avatarUrl || null,
        },
      });

      // Retorna sem expor o hash da senha
      return res.status(201).json({
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno ao registrar usuário.' });
    }
  }
}
