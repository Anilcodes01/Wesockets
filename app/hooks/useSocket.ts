import { useEffect, useRef } from "react";
import io from "socket.io-client";

type SocketType = ReturnType<typeof io>;

export const useSocket = (userId: string) => {
  const socket = useRef<SocketType | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (userId && !isInitialized.current) {
      socket.current = io({
        path: "/api/socketio",
      });

      socket.current.on("connect", () => {
        console.log("Connected to socket server");
        socket.current?.emit("register", userId);
      });

      socket.current.on("connect_error", (err: any) => {
        console.error("Socket connection error:", err);
      });

      isInitialized.current = true;
    }

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
        isInitialized.current = false;
      }
    };
  }, [userId]);

  return socket.current;
};
