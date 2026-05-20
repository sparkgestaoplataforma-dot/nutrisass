import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { socket } from '@/services/socket';

export function useSocket() {
  const socketRef = useRef<Socket | null>(socket);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  return socketRef;
}

export function useSocketEvent<T>(
  socketRef: React.RefObject<Socket | null>,
  event: string,
  callback: (data: T) => void,
) {
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
  }, [socketRef, event, callback]);
}
