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
  context:  { params: Promise<{ postId: string }> } // Context params Promise olaraq gəlmir, birbaşa obyektdir
) {
  const { postId: postIdParam } = await context.params;
  const postId = parseInt(postIdParam, 10);

  if (isNaN(postId) || postId <= 0) {
    return new Response(
      JSON.stringify({ error: "Yanlış post ID" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // 1. Postu verilənlər bazasından silməzdən əvvəl şəklin yolunu götürün
    const postToDelete = await prisma.post.findUnique({
      where: { id: postId },
      select: { image: true }, // Yalnız 'image' xüsusiyyətini seçirik
    });

    if (!postToDelete) {
      return new Response(
        JSON.stringify({ error: "Post tapılmadı" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const imageFileName = postToDelete.image;

    // 2. Əgər postun şəkli varsa, onu fayl sistemindən silin
    if (imageFileName) {
      // Şəkil faylının tam yolunu qurun
      // process.cwd() tətbiqin kök qovluğunu verir
      const imagePath = path.join(process.cwd(), 'public', 'blog', imageFileName);

      try {
        await fs.unlink(imagePath); // Şəkli asinxron olaraq silin
        console.log(`Şəkil silindi: ${imagePath}`);
      } catch (fileError: any) {
        // Şəkil silinərkən xəta baş verərsə (məsələn, fayl tapılmazsa)
        // Bu xəta postun silinməsinə mane olmamalıdır
        if (fileError.code === 'ENOENT') {
          console.warn(`Şəkil tapılmadı, lakin post silinəcək: ${imagePath}`);
        } else {
          console.error(`Şəkil silinərkən xəta baş verdi: ${imagePath}`, fileError);
          // Həqiqi bir fayl sistemi xətası olarsa, postu silməzdən əvvəl xəta qaytara bilərsiniz
          // Lakin adətən, faylın silinməsi uğursuz olsa belə, verilənlər bazası əməliyyatı davam etdirilir
          // Bu, sizin tətbiqinizin tələblərinə bağlıdır.
          // return new Response(
          //   JSON.stringify({ error: `Şəkil silinərkən xəta: ${fileError.message}` }),
          //   { status: 500, headers: { "Content-Type": "application/json" } }
          // );
        }
      }
    }

    // 3. Şəkil uğurla silindikdən (və ya heç olmadıqda/xəta baş verdikdə belə davam etdikdə) postu silin
    const deletedPost = await prisma.post.delete({
      where: { id: postId },
    });

    return new Response(
      JSON.stringify({ message: "Post uğurla silindi", post: deletedPost }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Post silinərkən daxili xəta:", error);
    return new Response(
      JSON.stringify({ error: "Post silinərkən daxili server xətası" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}