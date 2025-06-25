// /api/user/[id]/route.ts

import { PrismaClient } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: userIdParam } = await params;
  const userId = parseInt(userIdParam, 10);
  const body = await request.json();
  const { username, name, surname, email } = body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        name,
        surname,
        email,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("İstifadəçi yenilənərkən xəta:", error);
    return NextResponse.json({ error: "Xəta baş verdi" }, { status: 500 });
  }
}
