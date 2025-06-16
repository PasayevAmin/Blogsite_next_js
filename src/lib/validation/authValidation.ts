import { z } from "zod";

// Qeydiyyat (register) üçün validation
export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "İstifadəçi adı ən azı 3 simvol olmalıdır.")
    .max(30, "İstifadəçi adı maksimum 30 simvol ola bilər."),
     name: z
    .string()
    .min(3, "İstifadəçi adı ən azı 3 simvol olmalıdır.")
    .max(30, "İstifadəçi adı maksimum 30 simvol ola bilər."),
     surname: z
    .string()
    .min(3, "İstifadəçi adı ən azı 3 simvol olmalıdır.")
    .max(30, "İstifadəçi adı maksimum 30 simvol ola bilər."),
     age: z
    .number()
    .min(15, "İstifadəçi yasi ən azı 15 olmalıdır.")
    .max(110, "İstifadəçi yasi maksimum 110 olmalıdır."),
  email: z
    .string()
    .email("Doğru email formatı daxil edin."),
  password: z
    .string()
    .min(6, "Şifrə ən azı 6 simvol olmalıdır."),
});

// Giriş (login) üçün validation
export const loginSchema = z.object({
  username: z.string().optional(),
  email: z.string().email("Email düzgün deyil.").optional(),
  password: z
    .string()
    .min(6, "Şifrə ən azı 6 simvol olmalıdır."),
}).refine((data) => data.email || data.username, {
  message: "Email və ya istifadəçi adı daxil edilməlidir.",
});
