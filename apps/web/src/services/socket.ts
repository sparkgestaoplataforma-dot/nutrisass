import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

export const socket: Socket = io(API_URL, {
  autoConnect: false,
  auth: {
    token: useAuthStore.getState().accessToken ?? "",
  },
});

export function connectSocket(): void {
  const token = useAuthStore.getState().accessToken;
  if (!token) return;

  socket.auth = { token };

  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket(): void {
  if (socket.connected) {
    socket.disconnect();
  }
}

// Reconectar automaticamente quando o token mudar no store
useAuthStore.subscribe((state, prevState) => {
  const token = state.accessToken;
  const prevToken = prevState.accessToken;

  if (token && token !== prevToken) {
    socket.auth = { token };
    if (socket.connected) {
      socket.disconnect().connect();
    } else {
      socket.connect();
    }
  }

  // Desconectar no logout
  if (!token && prevToken) {
    socket.disconnect();
  }
});
