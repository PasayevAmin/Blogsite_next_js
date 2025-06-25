import { PrismaClient } from "@/generated/prisma";
import path from "path";
import fs from "fs/promises";

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


export async function DELETE(
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
    // 1. Post mövcuddurmu və şəkli varmı?
    const postToDelete = await prisma.post.findUnique({
      where: { id: postId },
      select: { image: true },
    });

    if (!postToDelete) {
      return new Response(JSON.stringify({ error: "Post tapılmadı" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Əlaqəli məlumatları sil (öncəliklə `replies`, sonra `comments`, `likes`, `saved`)
    await prisma.reply.deleteMany({ where: { comment: { postId } } });
    await prisma.comment.deleteMany({ where: { postId } });
    await prisma.like.deleteMany({ where: { postId } });
    await prisma.savedPost.deleteMany({ where: { postId } });

    // 3. Şəkli fayl sistemindən sil
    const imageFileName = postToDelete.image;
    if (imageFileName) {
      const imagePath = path.join(process.cwd(), "public", "blog", imageFileName);
      try {
        await fs.unlink(imagePath);
        console.log(`Şəkil silindi: ${imagePath}`);
      } catch (fileError: any) {
        if (fileError.code !== "ENOENT") {
          console.error("Şəkil silinərkən xəta:", fileError);
        }
      }
    }

    // 4. Postu sil
    const deletedPost = await prisma.post.delete({ where: { id: postId } });

    return new Response(
      JSON.stringify({ message: "Post və əlaqəli məlumatlar silindi", post: deletedPost }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Silinmə zamanı xəta:", error);
    return new Response(
      JSON.stringify({ error: "Post silinərkən daxili server xətası" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
