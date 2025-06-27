"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkIcon as OutlineBookmark } from "@heroicons/react/24/outline";
import { BookmarkIcon as SolidBookmark } from "@heroicons/react/24/solid";

type SaveButtonProps = {
  postId: number;
  saved: { userId: number }[];
  currentUserId?: number;
};

export default function SaveButton({ postId, saved, currentUserId }: SaveButtonProps) {
  const router = useRouter();

  const [savedState, setSavedState] = useState(
    currentUserId ? saved.some((save) => save.userId === currentUserId) : false
  );
  const [savedCount, setSavedCount] = useState(saved.length);
  const [loading, setLoading] = useState(false);

  async function toggleSave() {
    if (loading) return;

    if (!currentUserId) {
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/save_post/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUserId }),
      });

      const data = await res.json();

      if (res.ok) {
        setSavedState(data.saved);
        setSavedCount((count) => count + (data.saved ? 1 : -1));
      } else {
        alert(data.error || "Xəta baş verdi");
      }
    } catch {
      alert("Xəta baş verdi");
    }

    setLoading(false);
  }

  return (
    <button
      onClick={toggleSave}
      disabled={loading}
      className={`flex items-center gap-1 px-3 py-1 rounded cursor-pointer ${savedState ? "bg-white text-white" : "bg-white text-black"
        }`}
      aria-label={savedState ? "Unsave" : "Save"}
      title={savedState ? "Saxlanılıb" : "Saxla"}
    >
      {savedState ? (
        <SolidBookmark className="w-5 h-5 text-black" />
      ) : (
        <OutlineBookmark className="w-5 h-5" />
      )}

      <span className="text-black">{savedCount}</span>
    </button>
  );
}
