import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  context: { params: Promise<{ commentId: string }>  }
) {
 const { commentId: commentIdParam } = await context.params;
  const commentId = parseInt(commentIdParam, 10);

  if (isNaN(commentId) || commentId <= 0) {
    return NextResponse.json({ error: "Yanlış şərh ID-si" }, { status: 400 });
  }

  try {
    const replies = await prisma.reply.findMany({
      where: { commentId },
      include: {
        author: {
          select: { id: true, username: true, coverImage: true }, // coverImage əlavə edildi
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, replies });
  } catch (error) {
    console.error("Cavablar alınarkən xəta:", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}


export async function POST(
  request: Request,
  context: { params: Promise<{ commentId: string }>  }
) {
 const { commentId: commentIdParam } = await context.params;
  const commentId = parseInt(commentIdParam, 10);

  if (isNaN(commentId) || commentId <= 0) {
    return NextResponse.json({ error: "Yanlış şərh ID-si" }, { status: 400 });
  }

  try {
    const { content, userId } = await request.json();

    if (!content || typeof content !== "string" || content.trim() === "" || !userId) {
      return NextResponse.json({ error: "Məlumatlar yanlışdır" }, { status: 400 });
    }

    const newReply = await prisma.reply.create({
      data: {
        content,
        commentId,
        authorId: userId,
      },
      include: {
        author: {
          select: { id: true, username: true },
        },
      },
    });

    return NextResponse.json({ success: true, reply: newReply });
  } catch (error) {
    console.error("Cavab əlavə edilərkən xəta:", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}