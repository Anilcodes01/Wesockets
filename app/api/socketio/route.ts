import { NextRequest, NextResponse } from "next/server";
import { Server as NetServer } from "http";
import { Server as SocketServer } from "socket.io";
import { prisma } from "@/app/lib/prisma";

let io: SocketServer | null = null;

interface Message {
  content: string;
  senderId: string;
  receiverId: string;
}

const userSocketMap = new Map<string, Set<string>>();

export const GET = async (req: NextRequest) => {
  if (!io) {
    console.log("Initializing Socket.IO server...");
    const httpServer = (req as any).socket?.server as NetServer;

    io = new SocketServer(httpServer, {
      path: "/api/socketio",
      transports: ["polling"],
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("register", (userId: string) => {
        if (!userSocketMap.has(userId)) {
          userSocketMap.set(userId, new Set());
        }
        userSocketMap.get(userId)!.add(socket.id);
        socket.data.userId = userId;
        console.log(`User ${userId} registered with socket ${socket.id}`);
      });

      socket.on("sendMessage", async (message: Message) => {
        const { content, senderId, receiverId } = message;

        const isReceiverOnline =
          userSocketMap.has(receiverId) &&
          userSocketMap.get(receiverId)!.size > 0;

        try {
          const savedMessage = await prisma.message.create({
            data: {
              content,
              senderId,
              receiverId,
              status: isReceiverOnline ? "delivered" : "sent",
            },
          });

          if (isReceiverOnline) {
            userSocketMap.get(receiverId)!.forEach((socketId) => {
              io!.to(socketId).emit("receiveMessage", {
                ...savedMessage,
                isDelivered: true,
              });
            });
          }
          socket.emit("receiveMessage", {
            ...savedMessage,
            isDelivered: isReceiverOnline,
          });
        } catch (error) {
          console.error("Error saving message:", error);
          socket.emit("messageError", {
            error: "Failed to send message",
            details: error instanceof Error ? error.message : "Unknown error",
          });
        }
      });

      socket.on("disconnect", () => {
        const userId = socket.data.userId;
        if (userId) {
          const userSockets = userSocketMap.get(userId);
          if (userSockets) {
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
              userSocketMap.delete(userId);
            }
          }
        }
      });
    });
  } else {
    console.log("Socket.IO server already initialized.");
  }

  return NextResponse.json({ status: "Socket.IO initialized" });
};
