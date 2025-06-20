"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { notifySuccess } from "@/app/lib/toast/toasthelper";
import axios from "axios";
import FileUploaderMultiple, { FileWithPreview } from "./uploader";

export default function RegisterPage() {
  const router = useRouter();

  const [image_files, set_image_files] = useState<FileWithPreview[]>([]);
  const [form, setForm] = useState({
    name: "",
    surname: "",
    username: "",
    email: "",
    age: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({});

  const on_add_image_files = (files: FileWithPreview[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    set_image_files(imageFiles); // yalnız bir şəkil yüklə
  };

  const handle_remove_image_file = (file: FileWithPreview) => {
    set_image_files((prev) => prev.filter((i) => i.name !== file.name));
  };

  const upload_files = async () => {
    if (!image_files.length) return null;

    try {
      const uploadPromises = image_files.map(async (file) => {
        const data = new FormData();
        data.set("file", file);

        const res = await fetch("/api/auth/uploads", {
          method: "POST",
          body: data,
        });

        if (!res.ok) throw new Error(await res.text());

        const result = await res.json();
        return result;
      });

      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error("Yükləmə xətası:", error);
      alert("Şəkil yüklənərkən xəta baş verdi.");
      return null;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "age" ? (value === "" ? "" : value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setErrors({});

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const image_result = await upload_files();
if (image_result?.length && image_result[0].success) {
  const fullPath = image_result[0].data?.filename || "";
  const filename = fullPath.split("/").pop() || "";
  formData.append("coverImage", filename);
}


      const res = await axios.post("/api/auth/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      const data = res.data;

      if (!data.success) {
        if (data.errors) {
          const fieldErrors: { [key: string]: string[] } = {};
          for (const key in data.errors) {
            fieldErrors[key] = data.errors[key]._errors;
          }
          setErrors(fieldErrors);
        } else {
          setMessage(data.message || "Xəta baş verdi.");
        }
        return;
      }

      notifySuccess("Siz Qeydiyyatdan uğurla keçdiniz!", "🎉");
      setMessage("Qeydiyyat uğurla tamamlandı.");
      router.push("/login");
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const fieldErrors: { [key: string]: string[] } = {};
        for (const key in error.response.data.errors) {
          fieldErrors[key] = error.response.data.errors[key]._errors;
        }
        setErrors(fieldErrors);
      } else {
        setMessage("Server xətası baş verdi.");
        console.error("Qeydiyyat xətası:", error);
      }
    }
  };

  const goToLogin = () => {
    router.push("/login");
  };

  return (
    <div
      className="flex justify-center items-center min-h-screen overflow-auto bg-cover bg-center"
      style={{
        backgroundImage:
          'url("https://wallpapercat.com/w/full/0/c/c/126192-3840x2160-desktop-4k-game-of-thrones-wallpaper-photo.jpg")',
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
        encType="multipart/form-data"
      >
        <h1 className="text-xl font-bold mb-4 text-center">Qeydiyyat</h1>

        {["name", "surname", "username", "email", "age", "password"].map(
          (field) => (
            <div key={field} className="mb-2">
              <input
                name={field}
                type={field === "password" ? "password" : field === "age" ? "number" : "text"}
                placeholder={
                  field === "name"
                    ? "Ad"
                    : field === "surname"
                    ? "Soyad"
                    : field === "username"
                    ? "İstifadəçi adı"
                    : field === "email"
                    ? "Email"
                    : field === "age"
                    ? "Yaş"
                    : "Şifrə"
                }
                className="border p-2 w-full rounded"
                onChange={handleChange}
                value={form[field as keyof typeof form]}
              />
              {errors[field] && (
                <p className="text-red-500 text-sm">{errors[field][0]}</p>
              )}
            </div>
          )
        )}

        {/* Şəkil yükləmə */}
        <div className="mb-4">
          <FileUploaderMultiple
            files={image_files}
            on_add={on_add_image_files}
            on_remove={handle_remove_image_file}
            on_remove_existing={() => {}}
            multiple={false}
            header="Profil Şəkli"
            icon="📸"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition duration-200"
        >
          Qeydiyyatdan keç
        </button>

        <button
          type="button"
          onClick={goToLogin}
          className="w-full text-center text-sm text-blue-500 underline mt-4 hover:text-blue-700"
        >
          Artıq hesabınız var? Giriş edin
        </button>

        {message && (
          <p className="mt-4 text-center text-red-600">{message}</p>
        )}
      </form>

      <Toaster />
    </div>
  );
}
