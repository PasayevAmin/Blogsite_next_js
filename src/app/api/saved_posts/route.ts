import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId tələb olunur" },
        { status: 400 }
      );
    }

    const savedPosts = await prisma.savedPost.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: {
              select: { id: true, username: true },
            },
            tags: true,
            likes: true,
            saved: true,
            comments: {
              include: { replies: true },
            },
          },
        },
      },
    });

    const posts = savedPosts.map((saved) => saved.post);

    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error("Backend xətası:", error);
    return NextResponse.json(
      { success: false, message: "Serverdə xəta baş verdi" },
      { status: 500 }
    );
  }
}
