import { Request, Response } from 'express';
import { prisma } from '../../../prisma/client';

export class ReportController {
  async create(req: Request, res: Response): Promise<Response> {
    const { topicId, reason } = req.body;
    const reporterId = req.user.id; // Quem está denunciando

    if (!topicId || !reason) {
      return res.status(400).json({ error: 'Tópico e motivo são obrigatórios.' });
    }

    try {
      const topic = await prisma.topic.findUnique({ where: { id: topicId } });

      if (!topic) {
        return res.status(404).json({ error: 'Tópico não encontrado.' });
      }

      // Regra 1: Não pode denunciar o próprio desabafo
      if (topic.authorId === reporterId) {
        return res.status(400).json({ error: 'Você não pode denunciar o seu próprio desabafo.' });
      }

      // Regra 2: Evita duplicidade de denúncia pelo mesmo usuário
      const alreadyReported = await prisma.report.findFirst({
        where: { topicId, reporterId }
      });

      if (alreadyReported) {
        return res.status(400).json({ error: 'Você já enviou uma denúncia para este desabafo.' });
      }

      // Salva a denúncia de forma anônima e segura
      const report = await prisma.report.create({
        data: {
          topicId,
          reporterId,
          reason
        }
      });

      return res.status(201).json(report);
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno ao processar denúncia.' });
    }
  }
}
