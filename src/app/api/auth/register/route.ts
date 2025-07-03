import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@/generated/prisma";

import { registerSchema } from "@/app/lib/validation/authValidation";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // formData alınır
    const formData = await request.formData();

    // FormData-dan məlumatları string kimi götürürük
    const email = formData.get("email")?.toString() || "";
    const name = formData.get("name")?.toString() || "";
    const username = formData.get("username")?.toString() || "";
    const ageStr = formData.get("age")?.toString() || "";
    const password = formData.get("password")?.toString() || "";
    const surname = formData.get("surname")?.toString() || "";
    const coverImage=formData.get("coverImage")?.toString()||""

    // age say olaraq parse edilir
    const age = ageStr ? Number(ageStr) : null;

    // Objekti validation üçün qururuq
    const dataToValidate = { email, name, username, age, password, surname,coverImage };

    // Validation
    const parsed = registerSchema.safeParse(dataToValidate);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email: validEmail, name: validName, username: validUsername, age: validAge, password: validPassword, surname: validSurname } = parsed.data;

    // İstifadəçi axtarılır
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: validEmail }, { username: validUsername }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email və ya istifadəçi adı artıq mövcuddur." },
        { status: 400 }
      );
    }

    // Şifrə hash edilir
    const hashedPassword = await bcrypt.hash(validPassword, 10);

    // Yeni istifadəçi yaradılır
    const newUser = await prisma.user.create({
      data: {
        email: validEmail,
        name: validName,
        username: validUsername,
        age: validAge,
        surname: validSurname,
        password: hashedPassword,
        coverImage: coverImage,
        updatedAt: new Date()
      },
    });

    // JWT token yaradılır
    const tokenPayload = {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
      expiresIn: "30d",
    });

    // Cookie ayarları
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    };

    const response = NextResponse.json({
      success: true,
      message: "Qeydiyyat uğurla tamamlandı.",
      user: {
        id: newUser.id,
        username: newUser.username,
        age: newUser.age,
        email: newUser.email,
        name: newUser.name,
        surname: newUser.surname,
        coverImage:newUser.coverImage
      },
    });

    response.cookies.set("token", token, cookieOptions);

    return response;
  } catch (error) {
    console.error("Qeydiyyat xətası:", error);
    return NextResponse.json(
      { success: false, message: "Server xətası." },
      { status: 500 }
    );
  }
}
