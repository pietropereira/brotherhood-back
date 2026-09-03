import { Request, Response } from 'express';
import { prisma } from '../../../prisma/client';
import { verify } from 'jsonwebtoken';
import { authConfig } from '../../../config/auth';
import server = require('../../../server');

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
          authorId: req.user.id, // Garante que o authorId vá na raiz
        },
      });

      const populatedTopic = await prisma.topic.findUnique({
        where: { id: topic.id },
        include: {
          author: {
            select: {
              nickname: true,
              avatarUrl: true,
            },
          },
        },
      });

      if (populatedTopic) {
        server.io.emit('new_topic_published', populatedTopic);
        console.log(`📢 [Socket] Novo desabafo emitido globalmente: "${populatedTopic.title}"`);
      }

      return res.status(201).json(populatedTopic);
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno ao criar tópico.' });
    }
  }

  // 🔵 Listar todos os tópicos (Feed Público com Anonimato)
 async list(req: Request, res: Response): Promise<Response> {
    // 💡 Captura a página atual dos Query Params (se não enviar, assume a página 1)
    const { category, page = 1 } = req.query;
    
    const limit = 10; // Blocos fixos de 10 em 10 posts para performance comercial
    const skip = (Number(page) - 1) * limit;

    const authHeader = req.headers.authorization;
    let loggedUserId: string | null = null;

    if (authHeader) {
      const [, token] = authHeader.split(' ');
      try {
        const decoded = verify(token, authConfig.jwt.secret);
        if (decoded && decoded.sub) {
          loggedUserId = String(decoded.sub);
        }
      } catch (err) {
        // Ignora erros de token e trata como deslogado
      }
    }

    try {
      const topics = await prisma.topic.findMany({
        where: {
          category: category ? String(category) : undefined,
          ...(loggedUserId ? {
            reports: {
              none: {
                reporterId: loggedUserId
              }
            }
          } : {})
        },
        // ⚡ REGRA DA PAGINAÇÃO COMERCIAL
        take: limit,
        skip: skip,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          author: {
            select: {
              nickname: true,
              avatarUrl: true
            }
          }
        }
      });

      return res.json(topics);
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno ao carregar o feed.' });
    }
  }
}

