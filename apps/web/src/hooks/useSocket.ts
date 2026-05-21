import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { socket, connectSocket } from '@/services/socket';

export function useSocket() {
  const socketRef = useRef<Socket>(socket);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      console.log('[Socket] Conectado:', socket.id);
      setIsConnected(true);
    }

    function onDisconnect(reason: string) {
      console.log('[Socket] Desconectado:', reason);
      setIsConnected(false);
    }

    function onReconnect(attempt: number) {
      console.log('[Socket] Reconectado na tentativa:', attempt);
    }

    function onConnectError(err: Error) {
      console.error('[Socket] Erro de conexão:', err.message);
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect', onReconnect);
    socket.on('connect_error', onConnectError);

    // Conectar se ainda não estiver conectado
    if (!socket.connected) {
      connectSocket();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect', onReconnect);
      socket.off('connect_error', onConnectError);
    };
  }, []);

  return { socketRef, isConnected };
}

export function useSocketEvent<T>(
  socketRef: React.RefObject<Socket | null>,
  event: string,
  callback: (data: T) => void,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    const handler = (data: T) => callbackRef.current(data);
    s.on(event, handler);

    return () => {
      s.off(event, handler);
    };
  }, [socketRef, event]);
}
