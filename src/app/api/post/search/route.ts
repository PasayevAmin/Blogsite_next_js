import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma"; // sənə uyğun import
const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("title") || "";

  const posts = await prisma.post.findMany({
    where: {
      OR: [
        {
          title: {
            contains: q,
          },
        },
        {
          author: {
            username: {
              contains: q,
            },
          },
        },
      ],
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ posts });
}
