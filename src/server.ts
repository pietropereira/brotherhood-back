import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { routes } from './routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use(routes);

// Acopla o Express no servidor HTTP nativo do Node
const server = createServer(app);

// Inicializa o Socket.io liberando o CORS para o seu app se conectar
export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Escuta as conexões em tempo real
io.on('connection', (socket) => {
  console.log(`🔌 Usuário conectado ao socket: ${socket.id}`);

  // Permite que o celular entre em uma "sala privada" baseada no ID do chat (evita que mensagens vazem para outros chats)
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    console.log(`👥 Usuário entrou na sala do chat: ${chatId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Usuário desconectou do socket');
  });
});

const PORT = process.env.PORT || 3334;

// 🚨 ATENÇÃO: Agora mudamos de "app.listen" para "server.listen"
server.listen(PORT, () => {
  console.log(`🚀 Brotherhood Backend rodando com WebSockets na porta ${PORT}!`);
});
