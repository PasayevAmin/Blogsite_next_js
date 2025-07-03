"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import  { Toaster } from 'react-hot-toast';
import { notifySuccess ,notifyError} from "@/app/lib/toast/toasthelper";
import { setTimeout } from "node:timers";
export default function LoginPage() {
  const router = useRouter();

  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const goToRegister = () => {
    router.push("/register");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      // email kimi görsənirsə email, yoxsa username olaraq göndər
      const payload: { email?: string; username?: string; password: string } = {
        password,
      };

      if (loginInput.includes("@")) {
        payload.email = loginInput;
      } else {
        payload.username = loginInput;
      }

      const res = await axios.post("/api/auth/login", payload)

      const data = res.data;
      if (data.success) {

        localStorage.setItem(
          "user",
          JSON.stringify({
            id: data.user.id,
            username: data.user.username,
            bio: data.user.bio,
            role: data.user.role,
            name: data.user.name,
            surname: data.user.surname,
            email: data.user.email,
            coverImage:data.user.coverImage
          })

        );


        setMessage("Giriş uğurludur!");
        router.push("/");
        notifySuccess("Giriş edildi!🎉") 
      } else {
        setMessage(data.message || "Email və ya şifrə yanlışdır.");

      }
    } catch (error: any) {
      notifyError('Xəta baş verdi ❌')
      // console.error("Login xətası:", error);
      const errMsg =
        error?.response?.data?.message || "Giriş zamanı xəta baş verdi.";
      setMessage(errMsg);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundImage: 'url("https://wallpapercat.com/w/full/0/c/c/126192-3840x2160-desktop-4k-game-of-thrones-wallpaper-photo.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >

      <form
        onSubmit={handleLogin}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: 20,
          border: "1px solid #ccc",
          borderRadius: 8,
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          width: "300px",
          backgroundColor: "white",
        }}
      >
        <h2>Giriş et</h2>

        <input
          type="text"
          placeholder="Email və ya istifadəçi adı"
          value={loginInput}
          onChange={(e) => setLoginInput(e.target.value)}
          className="border p-2 m-2 w-full"
          required
          autoComplete="username"
        />

        <input
          type="password"
          placeholder="Şifrə"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 m-2 w-full"
          required
          autoComplete="current-password"
        />

        <button
          type="submit"
          className="bg-blue-500 text-white p-2 m-2 rounded w-full hover:bg-blue-600 cursor-pointer"
        >
          Giriş
        </button>

        {message && (
          <p
            className="text-red-600 text-center"
            style={{ marginTop: 10, minHeight: 20 }}
          >
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={goToRegister}
          className="text-sm text-blue-500 underline mt-4 cursor-pointer bg-transparent border-none hover:text-blue-700 transition-colors duration-200"
        >
          Hesabınız yoxdur? Qeydiyyatdan keçin
        </button>
      </form>
      <Toaster />

    </div>
  );
}
