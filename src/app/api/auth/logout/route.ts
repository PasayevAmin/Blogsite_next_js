import { NextResponse } from "next/server";

export async function POST() {
  // Token cookie-sini silmək üçün, onun expiration vaxtını keçmiş kimi təyin edirik
  const response = NextResponse.json({
    success: true,
    message: "Çıxış uğurla tamamlandı.",
  });

  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(0), // keçmiş tarix - token silinir
  });

  return response;
}

