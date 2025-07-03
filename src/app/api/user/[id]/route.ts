import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/api/db/db"; // öz prisma client yolun
import fs from "fs";
import path from "path";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: userIdParam } = await params;
  const userId = parseInt(userIdParam, 10);
  const body = await request.json();
  const { username, name, surname, email, bio, coverImage } = body;

  try {
    // İstifadəçinin mövcud məlumatlarını al
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });
    }

    // Əgər yeni şəkil gəlirsə və əvvəlki şəkil varsa, onu sil
    if (coverImage && existingUser.coverImage && coverImage !== existingUser.coverImage) {
      const oldImagePath = path.join(process.cwd(), "public", "uploads", existingUser.coverImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath); // Şəkli sil
      }
    }

    // Verilənlər bazasını yenilə
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        name,
        surname,
        email,
        bio: bio || "",
        coverImage: coverImage || existingUser.coverImage,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("İstifadəçi yenilənərkən xəta:", error);
    return NextResponse.json({ error: "Xəta baş verdi" }, { status: 500 });
  }
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: userIdParam } = await params;
  const userId = parseInt(userIdParam, 10);

  try {
    // İstifadəçini sil
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
    });

    // Əgər istifadəçinin şəkli varsa, onu sil
    if (deletedUser.coverImage) {
      const imagePath = path.join(process.cwd(), "public", "uploads", deletedUser.coverImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath); // Şəkli sil
      }
    }

    return NextResponse.json({ message: "İstifadəçi uğurla silindi" });
  } catch (error) {
    console.error("İstifadəçi silinərkən xəta:", error);
    return NextResponse.json({ error: "Xəta baş verdi" }, { status: 500 });
  }
}