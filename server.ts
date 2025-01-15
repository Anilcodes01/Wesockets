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
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("sendMessage", async (message) => {
      try {
        const { content, senderId, receiverId } = message;

        const savedMessage = await prisma.message.create({
          data: {
            content,
            senderId,
            receiverId,
          },
        });

        io.emit("receiveMessage", savedMessage);
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
