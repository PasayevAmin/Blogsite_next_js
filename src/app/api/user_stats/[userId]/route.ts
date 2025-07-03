import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  // 1) context.params Promise olduğu üçün await edirik
  const { userId: userIdParam } = await context.params;
  const userId = parseInt(userIdParam, 10);

  if (isNaN(userId) || userId <= 0) {
    return new Response(
      JSON.stringify({ error: "Invalid userId" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const followerCount = await prisma.follower.count({
      where: { followingId: userId },
    });

    const followingCount = await prisma.follower.count({
      where: { followerId: userId },
    });

    return NextResponse.json({
      success: true,
      followerCount,
      followingCount,
    });
  } catch (error) {
    console.error("Xəta:", error);
    return NextResponse.json(
      { success: false, message: "Xəta baş verdi" },
      { status: 500 }
    );
  }
}
