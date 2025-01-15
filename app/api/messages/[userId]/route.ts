import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/authOptions";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!userId) {
    return new NextResponse("User ID is required", { status: 400 });
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        {
          senderId: session.user.id,
          receiverId: userId,
        },
        {
          senderId: userId,
          receiverId: session.user.id,
        },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json(messages);
}
