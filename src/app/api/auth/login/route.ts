import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@/generated/prisma";

import { loginSchema } from "@/app/lib/validation/authValidation";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, username, password } = parsed.data;

    const orConditions = [];
    if (email) orConditions.push({ email });
    if (username) orConditions.push({ username });

    const user = await prisma.user.findFirst({
      where: {
        OR: orConditions.length > 0 ? orConditions : undefined,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "İstifadəçi tapılmadı." },
        { status: 404 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Yanlış şifrə." },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        name: user.name,
        surname: user.surname,
        coverImage:user.coverImage
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ Cookie ayarları
    const response = NextResponse.json({
      success: true,
      message: "Giriş uğurludur.",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        surname: user.surname,
        role: user.role,
        coverImage:user.coverImage
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // yalnız prod-da secure olsun
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 gün
    });

    return response;

  } catch (error) {
    // console.error("Login xətası:", error);
    return NextResponse.json(
      { success: false, message: "Server xətası." },
      { status: 500 }
    );
  }
}
