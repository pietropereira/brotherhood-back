import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';

export async function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = req.user.id; // Captura o ID do usuário que já passou pelo token JWT

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Se o usuário não existir ou não for um administrador oficial, barra o acesso na hora
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Acesso negado. Rota exclusiva para administradores.' });
    }

    return next(); // Permite que a requisição siga para o controlador
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno ao validar permissão.' });
  }
}
