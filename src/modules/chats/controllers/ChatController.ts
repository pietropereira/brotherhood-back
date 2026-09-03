import { Request, Response } from 'express';
import { prisma } from '../../../prisma/client';
 import { io } from '../../../server';
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

    // 🔌 2. EMISSÃO CORRIGIDA: Agora passamos o objeto 'message' completo e populado para a sala do socket!
    io.to(chatId).emit('new_message', message);

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
            { participantId: userId },
            { topic: { authorId: userId } }
          ]
        },
        include: {
          topic: {
            include: {
              author: { select: { nickname: true, avatarUrl: true } }
            }
          },
          participant: { select: { nickname: true, avatarUrl: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1 // Traz apenas a última mensagem para preview e cálculo
          }
        }
      });

      // 🔴 A MÁGICA DO CONTADOR: Mapeia os chats injetando se há mensagens não lidas
      const formattedChats = chats.map(chat => {
        const isAuthor = chat.topic.authorId === userId;
        const lastRead = isAuthor ? chat.lastReadByAuthor : chat.lastReadByParticipant;
        
        const lastMessage = chat.messages[0];
        
        // Tem não lida se: existe mensagem, ela NÃO foi enviada por mim, E o createdAt dela é mais novo que o meu lastRead
        const hasUnread = lastMessage && 
                          lastMessage.senderId !== userId && 
                          new Date(lastMessage.createdAt) > new Date(lastRead);

        return {
          ...chat,
          hasUnread: !!hasUnread // Retorna true ou false
        };
      });

      return res.json(formattedChats);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar conversas.' });
    }
  }

// 📜 4. Carregar o histórico completo de mensagens de um chat específico
async getChatMessages(req: Request, res: Response): Promise<Response> {
    const { chatId } = req.params; // Lemos o ID do chat direto da URL (ex: /chats/ID/messages)
    const userId = req.user.id;    // Usuário logado

    try {
      // 1. Busca o chat para validar se quem está pedindo o histórico pertence à conversa
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { topic: true }
      });

      if (!chat) {
        return res.status(404).json({ error: 'Chat privado não encontrado.' });
      }

      // 2. Trava de segurança: só o leitor ou o autor do tópico podem ver as mensagens
      if (chat.participantId !== userId && chat.topic.authorId !== userId) {
        return res.status(403).json({ error: 'Você não tem permissão para ver este histórico.' });
      }

      // 3. Busca todas as mensagens daquele chat específico
      const messages = await prisma.message.findMany({
        where: { chatId },
        orderBy: {
          createdAt: 'desc' // Mensagens antigas primeiro, simulando a timeline de um chat real
        },
        include: {
          sender: {
            select: {
              nickname: true,
              avatarUrl: true
            }
          }
        }
      });
      
      return res.json(messages);
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno ao carregar mensagens.' });
    }
  }

    async markAsRead(req: Request, res: Response): Promise<Response> {
    const { id: chatId } = req.params;
    const userId = req.user.id; // ID do usuário logado vindo do JWT

    try {
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { topic: true }
      });

      if (!chat) {
        return res.status(404).json({ error: 'Chat não encontrado.' });
      }

      // 🕵️‍♂️ Descobre se quem abriu a tela é o autor do desabafo ou o participante de apoio
      const isAuthor = chat.topic.authorId === userId;

      // Atualiza a data de leitura da pessoa correspondente para o momento atual (now)
      await prisma.chat.update({
        where: { id: chatId },
        data: isAuthor 
          ? { lastReadByAuthor: new Date() } 
          : { lastReadByParticipant: new Date() }
      });

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno ao atualizar leitura.' });
    }
  }
}
