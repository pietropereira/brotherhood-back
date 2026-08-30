import { Request, Response } from 'express';
import { prisma } from '../../../prisma/client';

export class TopicController {
  // 🟢 Criar um novo tópico (Desabafo)
  async create(req: Request, res: Response): Promise<Response> {
    const { title, content, category } = req.body;
    const authorId = req.user.id; // Injetado com segurança pelo middleware de autenticação

    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Título, conteúdo e categoria são obrigatórios.' });
    }

    try {
      const topic = await prisma.topic.create({
        data: {
          title,
          content,
          category,
          authorId,
        },
      });

      return res.status(201).json(topic);
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno ao criar tópico.' });
    }
  }

  // 🔵 Listar todos os tópicos (Feed Público com Anonimato)
  async list(req: Request, res: Response): Promise<Response> {
    const { category } = req.query; // Permite filtrar por ?category=Ansiedade, por exemplo

    try {
      const topics = await prisma.topic.findMany({
        where: category ? { category: String(category) } : {},
        orderBy: {
          createdAt: 'desc', // Tópicos mais recentes primeiro
        },
        include: {
          author: {
            select: {
              nickname: true,   // 🔐 Expõe apenas o nickname
              avatarUrl: true,  // 🔐 Expõe apenas o avatar
              // O ID real, e-mail e senha NUNCA são enviados para o feed público
            },
          },
        },
      });

      return res.json(topics);
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno ao listar tópicos.' });
    }
  }
}
