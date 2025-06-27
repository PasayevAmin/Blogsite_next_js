// app/api/followed-posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID yoxdur" }, { status: 400 });
    }

    // İstifadəçinin follow etdiyi user-ların ID-lərini alırıq
    const followingUsers = await prisma.follower.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    // Tip təyini
    const followingIds = followingUsers.map((f: { followingId: number }) => f.followingId);

    // Əgər heç kimi follow etməyibsə, boş qaytar
    if (followingIds.length === 0) {
      return NextResponse.json({ posts: [] });
    }

    // Həmin user-lərin postlarını gətir
    const posts = await prisma.post.findMany({
      where: {
        authorId: {
          in: [...followingIds, userId],
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        saved: true, // 💡 saved-i daxil et
        tags: true,
        likes: true,
        comments: {
          include: {
            replies: true, // 💡 replies-i daxil et
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });


    return NextResponse.json({ posts });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Xəta baş verdi" }, { status: 500 });
  }
}
