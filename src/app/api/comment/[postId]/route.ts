import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

// Yeni şərh əlavə etmək (POST)
export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
      const awaitedParams = await params;  // await etməli olduğun hissə buradır
  const postId = Number(awaitedParams.postId);
    const { content, userId } = await req.json();

    if (!content || typeof content !== "string" || content.trim() === "" || !userId || isNaN(postId)) {
  return NextResponse.json({ error: "Məlumatlar yanlışdır" }, { status: 400 });
}


    const newComment = await prisma.comment.create({
      data: {
        content,
        postId,
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

// Mövcud şərhləri və cavablarını əldə etmək (GET)
export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
      const awaitedParams = await params;  // await etməli olduğun hissə buradır
  const postId = Number(awaitedParams.postId);

    if (isNaN(postId)) {
      return NextResponse.json({ error: "Yanlış ID" }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
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
