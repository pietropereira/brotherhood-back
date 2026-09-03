import { Request, Response } from 'express';
import { prisma } from '../../prisma/client';

export class AdminController {
  // 1. Lista todos os relatos de abusos enviados pelos usuários
  async listReports(req: Request, res: Response): Promise<Response> {
    try {
      const reports = await prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: { nickname: true }
          },
          topic: {
            include: {
              author: {
                select: { nickname: true }
              }
            }
          }
        }
      });

      return res.json(reports);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar denúncias.' });
    }
  }

  // 2. Deleta o desabafo denunciado permanentemente do ecossistema
  async deleteTopic(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    try {
      const topicExists = await prisma.topic.findUnique({ where: { id } });

      if (!topicExists) {
        return res.status(404).json({ error: 'Desabafo não encontrado ou já foi excluído.' });
      }

      // Deleta o tópico. O banco limpa chats, mensagens e denúncias atreladas automaticamente
      await prisma.topic.delete({ where: { id } });

      return res.status(204).send(); // Sucesso (No Content)
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao excluir o desabafo.' });
    }
  }
}
