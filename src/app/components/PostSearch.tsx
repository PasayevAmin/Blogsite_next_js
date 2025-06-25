"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Post {
  id: number;
  title: string;
  content: string;
  author: {
    id: number;
    username: string;
    image?: string;
  };                                        
}

export default function PostSearch() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<{ id: number; username: string; image?: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!storedUser?.id) {
        window.location.href = "/login";
      } else {
        setUser(storedUser);
        // loadPosts(0); // Remove or implement loadPosts if needed
      }
    }
  }, []);
  useEffect(() => {
    const fetchPosts = async () => {
      const res = await fetch(`/api/post/search?title=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      setPosts(data.posts);
    };

    const timeout = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        fetchPosts();
      } else {
        setPosts([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  return (
    <div className="max-w-xl mx-auto px-4">
      {/* 🔍 Axtarış inputu */}
      <div className="relative w-full mt-4">
        <input
          type="text"
          placeholder="🔍 Post başlığı və ya istifadəçi adı ilə axtar..."
          className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none px-5 py-3 rounded-full text-sm shadow-sm transition placeholder-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* 🔽 Nəticələr */}
      <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {posts.map((post) => (
          <li
            key={post.id}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
          >
            <h3 onClick={() => router.push(`/post/${post.id}`)} className="font-semibold text-lg text-gray-800 truncate cursor-pointer">
              {post.title}
            </h3>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">

              <span
                onClick={() =>
                  router.push(
                    user?.id === post.author.id
                      ? "/profile"
                      : `/profile/${post.author.id}`
                  )
                }
                className="hover:text-blue-600 cursor-pointer"
              >
                👤 <strong>{post.author.username}</strong>
              </span>
            </div>
            <p onClick={() => router.push(`/post/${post.id}`)} className="text-sm text-gray-600 mt-2 cursor-pointer">
              {post.content.slice(0, 100)}...
            </p>
          </li>
        ))}
      </ul>

      {posts.length === 0 && searchTerm.trim() !== "" && (
        <div className="text-center text-gray-500 mt-6">
          Heç bir uyğun post tapılmadı.
        </div>
      )}
    </div>
  );
}
