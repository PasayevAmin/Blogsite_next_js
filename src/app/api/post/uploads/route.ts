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

  // ✅ Mövcud faylların siyahısı alınır
  const files = await readdir(uploadDir);
  const imageCount = files.length + 1;

  const ext = extname(file.name) || ".jpg"; // əgər uzantı yoxdursa, ".jpg" qəbul et
  const newFileName = `${imageCount}${ext}`;
  const filePath = join(uploadDir, newFileName);

  await writeFile(filePath, buffer);

  return NextResponse.json({
    success: true,
    message: "Fayl yükləndi",
    data: { filename: newFileName },
  });
}
