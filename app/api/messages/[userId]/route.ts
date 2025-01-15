import { getServerSession } from "next-auth";
import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/authOptions";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        {
          senderId: session.user.id,
          receiverId: params.userId,
        },
        {
          senderId: params.userId,
          receiverId: session.user.id,
        },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return new Response(JSON.stringify(messages), {
    headers: { "Content-Type": "application/json" },
  });
}
