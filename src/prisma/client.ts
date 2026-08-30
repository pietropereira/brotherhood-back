import { PrismaClient } from '@prisma/client';

// Instância única para gerenciar a conexão com o brotherhood_db
export const prisma = new PrismaClient();