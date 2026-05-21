import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import type { TokenPayload } from '@nutricao/shared';

let io: Server;

export function initSocket(httpServer: HttpServer) {
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Authorization'],
    },
  });

  // Middleware de autenticação JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      console.warn(`[Socket] Conexão recusada: token ausente (${socket.id})`);
      return next(new Error('Token não fornecido'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
      socket.data.userId = decoded.userId;
      socket.data.clinicaId = decoded.clinicaId;
      next();
    } catch {
      console.warn(`[Socket] Conexão recusada: token inválido (${socket.id})`);
      return next(new Error('Token inválido ou expirado'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, clinicaId } = socket.data;
    console.log(`[Socket] Conectado: ${socket.id} | userId: ${userId} | clinicaId: ${clinicaId}`);

    // Entrar automaticamente nas rooms do usuário e da clínica
    socket.join(`usuario:${userId}`);
    socket.join(`clinica:${clinicaId}`);

    socket.on('disconnect', () => {
      console.log(`[Socket] Desconectado: ${socket.id} | userId: ${userId}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
