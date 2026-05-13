import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

// Função para obter o ID do usuário atual do store de forma síncrona
const getUserId = () => useAuthStore.getState().user?.userId;

export const socket: Socket = io(API_URL, {
  query: {
    usuarioId: getUserId(),
  },
  autoConnect: true,
});

// Listener para atualizar a conexão quando o usuário mudar
useAuthStore.subscribe((state) => {
  const userId = state.user?.userId;
  if (userId && socket.io.opts.query) {
    // @ts-ignore - query type can be string or object
    socket.io.opts.query.usuarioId = userId;
    if (socket.connected) {
      socket.disconnect().connect();
    }
  }
});
