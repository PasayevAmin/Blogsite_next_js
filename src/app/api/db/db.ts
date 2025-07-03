// src/lib/prisma.ts (və ya harada saxlayırsansa)
import { PrismaClient } from "@/generated/prisma"; // ← bu vacibdir!

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;
