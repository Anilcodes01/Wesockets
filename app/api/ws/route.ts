import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { WebSocketServer } from "ws";
import http from "http";

const wss = new WebSocketServer({ noServer: true });
const clients = new Map();

export async function GET(req: http.IncomingMessage) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const upgrade = req.headers["upgrade"];
    if (upgrade?.toLowerCase() !== "websocket") {
      return NextResponse.json(
        { message: "Expected websocket" },
        { status: 426 }
      );
    }

    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), async (ws) => {
      clients.set(userId, ws);

      await prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
      });

      ws.on("message", async (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          const { receiverId, content } = data;

          const savedMessage = await prisma.message.create({
            data: {
              content,
              senderId: userId,
              receiverId,
            },
          });

          const receiverWs = clients.get(receiverId);
          if (receiverWs) {
            receiverWs.send(JSON.stringify(savedMessage));
          }
        } catch (error) {
          console.error("Error processing message:", error);
        }
      });

      ws.on("close", async () => {
        clients.delete(userId);
        await prisma.user.update({
          where: { id: userId },
          data: {
            isActive: false,
            lastSeen: new Date(),
          },
        });
      });
    });

    return new NextResponse(null, { status: 101 });
  } catch (error) {
    console.error("WebSocket connection error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
