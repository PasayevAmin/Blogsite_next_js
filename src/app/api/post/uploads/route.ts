import { mkdir, readdir, writeFile } from "fs/promises";
import { join, extname } from "path";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const file = data.get("file") as File;

  if (!file) {
    return NextResponse.json({ success: false, message: "Fayl yoxdur" });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = join(process.cwd(), "public", "blog");
  await mkdir(uploadDir, { recursive: true });

  const ext = extname(file.name) || ".jpg";

  // ✅ 5 rəqəmli təsadüfi ədəd yaradılır
  const randomCode = Math.floor(10000 + Math.random() * 90000); // 10000–99999

  // ✅ Yeni fayl adı
  const newFileName = `${randomCode}${ext}`;
  const filePath = join(uploadDir, newFileName);

  await writeFile(filePath, buffer);

  return NextResponse.json({
    success: true,
    message: "Fayl yükləndi",
    data: { filename: newFileName },
  });
}
