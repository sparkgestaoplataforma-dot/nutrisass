import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

let io: Server;

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    const usuarioId = socket.handshake.query.usuarioId as string

    if (usuarioId){
      socket.join(`usuario:${usuarioId}`);
      console.log(`Usuário ${usuarioId} entrou na sala usuario:${usuarioId}`)
    }

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
