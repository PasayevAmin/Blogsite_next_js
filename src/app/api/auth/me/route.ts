// /api/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "Token yoxdur" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        bio: true,
        coverImage: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "İstifadəçi tapılmadı" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("ME API Xətası:", error);
    return NextResponse.json({ success: false, message: "Token xətası" }, { status: 403 });
  }
}
