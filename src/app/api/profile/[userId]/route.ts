// src/app/api/post/[userId]/route.ts

import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  // 1) context.params Promise olduğu üçün await edirik
  const { userId: userIdParam } = await context.params;
  const userId = parseInt(userIdParam, 10);

  if (isNaN(userId) || userId <= 0) {
    return new Response(
      JSON.stringify({ error: "Invalid userId" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const user = await prisma.user.findMany({
      where: { id: userId }
    })
    const userPosts = await prisma.post.findMany({
      where: { authorId: userId },
      include: {
        tags: true,
        comments: {
          include: {
            replies: true, // 💡 replies-i daxil et
          },
        },

        likes: true,
        saved: true,
        author: {
          select: { id: true, username: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return new Response(
      JSON.stringify({ posts: userPosts, user: user }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Failed to fetch user posts:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch user posts" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
