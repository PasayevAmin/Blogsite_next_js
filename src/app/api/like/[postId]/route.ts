// src/app/api/like/[postId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

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

  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      return NextResponse.json({ liked: false });
    } else {
      await prisma.like.create({
        data: {
          userId,
          postId,
        },
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
