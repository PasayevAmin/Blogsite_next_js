import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { title } from "node:process";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {

    const comments = await prisma.comment.findMany({
      include: {
        author: {
          select: { id: true, username: true, coverImage: true },
        },
        post:{
          select:{title:true}
        },

        replies: true,
        
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const sortedComments = comments
  .map((comment) => ({
    ...comment,
    totalScore: comment.replies.length,
  }))
  .sort((a, b) => b.totalScore - a.totalScore);

    return NextResponse.json({comments: sortedComments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
 

    }
}
