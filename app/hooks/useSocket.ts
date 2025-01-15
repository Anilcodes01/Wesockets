import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@/types/socket';

type SocketType = ReturnType<typeof io>;

export const useSocket = () => {
  const socket = useRef<SocketType | null>(null);

  useEffect(() => {
    if (!socket.current) {
      socket.current = io({
        path: '/api/socket',
      });

      socket.current.on('connect', () => {
        console.log('Connected to socket server');
      });

      socket.current.on('connect_error', (err: any) => {
        console.error('Socket connection error:', err);
      });
    }

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  return socket.current;
};