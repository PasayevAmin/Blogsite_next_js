import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

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
    const userPost = await prisma.post.findFirstOrThrow({
      where: { id: postId },
      include: {
        tags: true,
        comments: true,
        likes: true,
        saved: true,
        author: {
          select: { id: true, username: true, image: true },
        },
      },
    });

    return new Response(
      JSON.stringify({ posts: userPost }),
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