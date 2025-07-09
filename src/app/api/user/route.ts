import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    
    const users = await prisma.user.findMany({
      include: {
         comments: {
          include: {
            replies: true, // 💡 replies-i daxil et
          },
        },
        likes: true,
        saved: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const sortedusers = users
  .map((user) => ({
    ...user,
    totalScore: user.likes.length + user.comments.length+user.comments.reduce((acc, comment) => {
      return acc + comment.replies.length; // hər şərh üçün replies sayını əlavə et
    }, 0) + user.saved.length, // likes, comments, replies və saved sayını toplayırıq
  }))
  .sort((a, b) => b.totalScore - a.totalScore); 

    return NextResponse.json({users: sortedusers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}