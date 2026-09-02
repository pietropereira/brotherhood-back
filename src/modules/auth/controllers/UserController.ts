import { Request, Response } from 'express';
import { prisma } from '../../../prisma/client';

export class DeleteAccountController {
  async handle(req: Request, res: Response): Promise<Response> {
    const userId = req.user.id; // Pego o ID do token de quem está logado

    try {
      // Deleta o usuário. O Prisma cuida do efeito cascata apagando tópicos/mensagens
      await prisma.user.delete({
        where: { id: userId }
      });

      return res.status(204).send(); // Retorno 204 No Content (sucesso sem corpo)
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno ao excluir conta.' });
    }
  }
}
