import { createServer } from "http";
import { Server } from "socket.io";
import { parse } from "url";
import next from "next";
import { prisma } from "./app/lib/prisma";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const userSocketMap = new Map<string, Set<string>>();

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("register", (userId: string) => {
      if (!userSocketMap.has(userId)) {
        userSocketMap.set(userId, new Set());
      }
      userSocketMap.get(userId)?.add(socket.id);
      socket.data.userId = userId;
      console.log(`User ${userId} registered with socket ${socket.id}`);
      console.log("Current online users:", Array.from(userSocketMap.keys()));
    });

    socket.on("sendMessage", async (message) => {
      try {
        const { content, senderId, receiverId } = message;

        const isReceiverOnline =
          userSocketMap.has(receiverId) &&
          (userSocketMap.get(receiverId)?.size ?? 0) > 0;

        const savedMessage = await prisma.message.create({
          data: {
            content,
            senderId,
            receiverId,
            status: isReceiverOnline ? "delivered" : "sent",
          },
        });

        if (isReceiverOnline) {
          const receiverSockets = userSocketMap.get(receiverId);
          console.log(
            `Sending message to user ${receiverId} with ${receiverSockets?.size} active connections`
          );

          receiverSockets?.forEach((socketId) => {
            io.to(socketId).emit("receiveMessage", {
              ...savedMessage,
              isDelivered: true,
            });
          });
        } else {
          console.log(
            `Receiver ${receiverId} is not online. Message saved for later delivery.`
          );
        }

        socket.emit("receiveMessage", {
          ...savedMessage,
          isDelivered: isReceiverOnline,
        });
      } catch (error) {
        console.error("Error handling message:", error);
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
            console.log(
              `User ${userId} is now offline (no active connections)`
            );
          } else {
            console.log(
              `User ${userId} still has ${userSockets.size} active connections`
            );
          }
        }
        console.log("Current online users:", Array.from(userSocketMap.keys()));
      }
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
