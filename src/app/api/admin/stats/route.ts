import { NextResponse } from 'next/server';
import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET() {
  const postsCount = await prisma.post.count();
  const usersCount = await prisma.user.count();
  const comment = await prisma.comment.count();
  const replyCount = await prisma.reply.count();
 const commentsCount = replyCount + comment; // Assuming replies are counted as comments
  return NextResponse.json({
    posts: postsCount,
    users: usersCount,
    comments: commentsCount,
  });
}
