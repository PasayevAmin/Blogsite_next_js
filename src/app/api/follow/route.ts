import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { followerId, followingId } = body;

  if (!followerId || !followingId || followerId === followingId) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  try {
    const follow = await prisma.follower.create({
      data: {
        followerId,
        followingId,
      },
    });

    return NextResponse.json({ success: true, follow });
  } catch (error) {
    return NextResponse.json({ error: "Already following?" }, { status: 400 });
  }
}
