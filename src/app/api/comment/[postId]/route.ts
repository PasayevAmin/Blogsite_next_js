import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { console } from "node:inspector/promises";

const prisma = new PrismaClient();

// Yeni şərh əlavə etmək (POST)
export async function POST(
  request: Request,
  context: { params: Promise<{ postId: string }> }
) {
  const { postId: postIdParam } = await context.params;
  const postId = parseInt(postIdParam, 10);
  if (isNaN(postId) || postId <= 0) {
    return new Response(
      JSON.stringify({ error: "Invalid post" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    const { content, userId } = await request.json();

    if (!content || typeof content !== "string" || content.trim() === "" || !userId || isNaN(postId)) {
      return NextResponse.json({ error: "Məlumatlar yanlışdır" }, { status: 400 });
    }

    const newComment = await prisma.comment.create({
      data: {
        content,
        postId: postId,
        authorId: userId,
      },
      include: {
        author: {
          select: { id: true, username: true },
        },
      },
    });

    return NextResponse.json({ success: true, comment: newComment });
  } catch (error) {
    console.error("Şərh əlavə edilərkən xəta:", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}



export async function GET(
  request: Request,
  context: { params: Promise<{ postId: string }> }
) {
  const { postId: postIdParam } = await context.params;
  const postId = parseInt(postIdParam, 10);
  if (isNaN(postId) || postId <= 0) {
    return new Response(
      JSON.stringify({ error: "Invalid post" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  try {

    const comments = await prisma.comment.findMany({
      where: { postId: postId },
      include: {
        author: {
          select: { id: true, username: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, username: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
       
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error("Şərhlər alınarkən xəta:", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
