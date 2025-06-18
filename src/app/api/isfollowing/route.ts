// app/api/isFollowing/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { followerId, followingId } = body;

  if (!followerId || !followingId) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const follow = await prisma.follower.findFirst({
    where: {
      followerId,
      followingId,
    },
  });

  return NextResponse.json({ isFollowing: !!follow });
}
