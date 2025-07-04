// src/app/api/post/view/[postId]/route.ts
import { PrismaClient } from "@/generated/prisma";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  context:{ params: Promise<{ postId: string }> }
) {
  const { postId } = await context.params;
  const postIdNum = parseInt(postId, 10);

  if (isNaN(postIdNum)) {
    return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
  }

  try {
    const updatedPost = await prisma.post.update({
      where: { id: postIdNum },
      data: {
        views: {
          increment: 1,
        },
      },
      select: {
        id: true,
        views: true,
      },
    });

    return NextResponse.json({ success: true, views: updatedPost.views });
  } catch (error) {
    console.error("View artırılarkən xəta:", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
export async function GET(
  request: Request,
   context:{ params: Promise<{ postId: string }> }
) {
  const { postId } = await context.params;
  const postIdNum = parseInt(postId, 10);

  if (isNaN(postIdNum)) {
    return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: postIdNum },
      select: {
        id: true,
        views: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, views: post.views });
  } catch (error) {
    console.error("Postu taparkən xəta:", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}