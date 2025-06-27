import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
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

  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "userId tələb olunur" },
      { status: 400 }
    );
  }

  const existing = await prisma.savedPost.findFirst({
    where: { userId, postId },
  });

  if (existing) {
    await prisma.savedPost.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({
      success: true,
      saved: false,
    });
  }

  await prisma.savedPost.create({
    data: { userId, postId },
  });

  return NextResponse.json({
    success: true,
    saved: true,
  });
}

