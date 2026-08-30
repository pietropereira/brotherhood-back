import { Request, Response } from 'express';
import { prisma } from '../../../prisma/client';

export class ChatController {
  // 🟢 1. Iniciar ou recuperar um Chat Privado a partir de um Tópico
  async create(req: Request, res: Response): Promise<Response> {
    const { topicId } = req.body;
    const participantId = req.user.id; // Quem está logado e quer iniciar o chat

    if (!topicId) {
      return res.status(400).json({ error: 'O ID do tópico é obrigatório.' });
    }

    try {
      // Busca o tópico para saber quem é o autor original
      const topic = await prisma.topic.findUnique({
        where: { id: topicId },
      });

      if (!topic) {
        return res.status(404).json({ error: 'Tópico não encontrado.' });
      }

      // Regra de Negócio: O autor não pode abrir chat privado com o próprio desabafo
      if (topic.authorId === participantId) {
        return res.status(400).json({ error: 'Você não pode iniciar um chat privado no seu próprio tópico.' });
      }

      // Verifica se o leitor já iniciou uma conversa com esse tópico antes (evita duplicar chats)
      const existingChat = await prisma.chat.findFirst({
        where: {
          topicId,
          participantId,
        },
      });

      if (existingChat) {
        return res.json(existingChat); // Retorna o chat existente se já houver conversa
      }

      // Se for inédito, cria o canal exclusivo entre o leitor e o autor do tópico
      const chat = await prisma.chat.create({
        data: {
          topicId,
          participantId,
        },
      });

      return res.status(201).json(chat);
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno ao iniciar chat privado.' });
    }
  }

  // 💬 2. Enviar Mensagem dentro do Chat Privado
  async sendMessage(req: Request, res: Response): Promise<Response> {
    const { chatId, content } = req.body;
    const senderId = req.user.id; // Quem está enviando a mensagem

    if (!chatId || !content) {
      return res.status(400).json({ error: 'ID do chat e conteúdo são obrigatórios.' });
    }

    try {
      // Busca o chat incluindo o tópico para validar os participantes autorizados
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { topic: true },
      });

      if (!chat) {
        return res.status(404).json({ error: 'Chat privado não encontrado.' });
      }

      // Regra de Segurança Estrita: O remetente precisa ser o participante do chat OU o autor do desabafo
      const isParticipant = chat.participantId === senderId;
      const isTopicAuthor = chat.topic.authorId === senderId;

      if (!isParticipant && !isTopicAuthor) {
        return res.status(403).json({ error: 'Você não tem permissão para enviar mensagens neste chat.' });
      }

      // Cria a mensagem atrelada ao chat
      const message = await prisma.message.create({
        data: {
          content,
          chatId,
          senderId,
        },
        include: {
          sender: {
            select: {
              nickname: true,
              avatarUrl: true,
            },
          },
        },
      });

      return res.status(201).json(message);
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno ao enviar mensagem.' });
    }
  }

  async listMyChats(req: Request, res: Response): Promise<Response> {
  const userId = req.user.id;

  try {
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { participantId: userId },          // Chats que eu iniciei como leitor
          { topic: { authorId: userId } }      // Chats iniciados por outros no meu desabafo
        ]
      },
      include: {
        topic: {
          select: {
            id: true,
            title: true,
            category: true,
            author: {
              select: {
                nickname: true,
                avatarUrl: true
              }
            }
          }
        },
        participant: {
          select: {
            nickname: true,
            avatarUrl: true
          }
        },
        // Opcional: Traz a última mensagem trocada para renderizar o preview na tela
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json(chats);
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno ao listar conversas.' });
  }
}
}
