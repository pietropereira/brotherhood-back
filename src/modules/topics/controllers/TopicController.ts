import { Request, Response } from 'express';
import { prisma } from '../../../prisma/client';
import { verify } from 'jsonwebtoken';
import { authConfig } from '../../../config/auth';

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
    const { category } = req.query;
    
    const authHeader = req.headers.authorization;
    let loggedUserId: string | null = null;

    if (authHeader) {
      const [, token] = authHeader.split(' ');
      try {
        // 🛡️ Executa a verificação usando a função nativa correta
        const decoded = verify(token, authConfig.jwt.secret);
        
        // Garante que o sub exista e joga no nosso ID logado
        if (decoded && decoded.sub) {
          loggedUserId = String(decoded.sub);
        }
      } catch (err) {
        // Se o token expirar ou falhar, ignora silenciosamente e trata como deslogado
        console.log("Erro na verificação opcional do token no feed:", err.message);
      }
    }

    try {
      const topics = await prisma.topic.findMany({
        where: {
          category: category ? String(category) : undefined,

          // Se descobrimos o ID do usuário logado através do token, filtra os denunciados
          ...(loggedUserId ? {
            reports: {
              none: {
                reporterId: loggedUserId
              }
            }
          } : {})
        },
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

