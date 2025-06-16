// app/api/tags/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma"; // öz yoluna uyğun düzəlt

const prisma = new PrismaClient();

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      select: { id: true, label: true },
    });
    return NextResponse.json({ tags });
  } catch (error) {
    return NextResponse.json(
      { message: "Tag-ləri almaq olmadı" },
      { status: 500 }
    );
  }
}
