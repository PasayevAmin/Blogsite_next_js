import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: { id: true, username: true, image: true },
        },
        tags: true,
        comments: true,
        likes: true,
        saved: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const sortedPosts = posts
  .map((post) => ({
    ...post,
    totalScore: post.likes.length + post.comments.length,
  }))
  .sort((a, b) => b.totalScore - a.totalScore); 

    return NextResponse.json({posts: sortedPosts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, authorId, image, tags } = body;

    if (!title || !authorId) {
      return NextResponse.json(
        { success: false, message: "Başlıq və authorId tələb olunur" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      include: {
        author: {
          select: {
            id: true,
            username: true
          }
        },
        tags: true,// yeni postun tag-lərini də cavaba əlavə et
      },
      data: {
        title,
        content,
        authorId: Number(authorId),
        image: image || null,
        type: "DRAFT",
        tags: {
          connect: tags?.map((tagId: number) => ({ id: tagId }))
        }
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { success: false, message: "Server xətası" },
      { status: 500 }
    );
  }
}

