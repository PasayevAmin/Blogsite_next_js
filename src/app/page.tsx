"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { userAgent } from "next/server";

type Post = {
  id: number;
  title: string;
  tags?: { id: number; label: string; color?: string }[];
  author: {
    id:number;
    username: string;
  };
  createdAt: string;
  likes: number;
  comments: number;
  content: string;
  image?: string;
};

export default function BlogPage() {
  const router = useRouter();

  const [user, setUser] = useState<{
    id?: number;
    username?: string;
    role?: string;
    name?: string;
    surname?: string;
    email?: string;
    coverImage?: string;
  }>({});

  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

      if (!storedUser?.id) {
        window.location.href = "/login";
      } else {
        setUser(storedUser);
        fetchUserPosts();
      }
    }

    async function fetchUserPosts() {
      try {
        const res = await fetch("/api/post", {
          method: "GET",
        });
        if (!res.ok) throw new Error("Xəta baş verdi");

        const data = await res.json();

        setPosts(data.posts);
      } catch (error) {
        console.error(error);
      }
    }
  }, []);

  const goToHome = () => {
    router.push("/");
  };

  const goToProfile = () => {
    router.push("/profile");
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (res.ok) {
        localStorage.removeItem("user");
        window.location.href = "/login";
      } else {
        console.error("Çıxış uğursuz oldu.");
      }
    } catch (error) {
      console.error("Çıxış zamanı xəta:", error);
    }
  };

  // Unikal tag-ları çıxarırıq
  const uniqueTags = useMemo(() => {
    const tagMap = new Map<number, { id: number; label: string }>();
    posts.forEach(post => {
      post.tags?.forEach(tag => {
        if (!tagMap.has(tag.id)) {
          tagMap.set(tag.id, tag);
        }
      });
    });
    return Array.from(tagMap.values());
  }, [posts]);

  return (
    <div className="bg-gray-100 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6 relative">
          <div className="text-center w-full">
            <h1 className="text-4xl font-bold mb-2">Blog</h1>
            <div className="space-x-4">
              <a
                onClick={goToHome}
                className="hover:underline font-medium cursor-pointer "
              >
                Home
              </a>
              <a
                onClick={goToProfile}
                className="text-blue-600 hover:underline font-medium cursor-pointer"
              >
                Profile
              </a>
              <a className="text-blue-600 hover:underline font-medium cursor-pointer">
                Explore
              </a>
            </div>
          </div>

          <div className="hidden sm:flex justify-end items-center space-x-4 mb-8 p-4">
            <span className="text-gray-700 font-semibold">
              Welcome, <strong>{user?.username}</strong>
            </span>

            <Popover.Root>
              <Popover.Trigger asChild>
                {user.coverImage ? (
                  <img
                    src={`/uploads/${user.coverImage}`}
                    alt="User Avatar"
                    className="w-16 h-16 rounded-full border object-cover cursor-pointer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full border bg-gray-300 flex items-center justify-center cursor-pointer">
                    <span className="text-gray-600 font-bold text-xl">
                      {user.username?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
              </Popover.Trigger>

              <Popover.Portal>
                <Popover.Content
                  side="bottom"
                  align="end"
                  sideOffset={8}
                  className="bg-white rounded-md shadow-lg p-4 w-48 z-50"
                >
                  <div className="mb-2 text-gray-800 font-semibold text-center">
                    {user.name} {user.surname}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-800 transition"
                  >
                    Çıxış
                  </button>
                  <Popover.Arrow className="fill-white" />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg cursor-pointer hover:shadow-xl transition-shadow duration-300"
              >
                <div className="bg-white rounded-lg overflow-hidden">
                  {post.image && (
                    <img
                      src={`/blog/${post.image}`}
                      alt={post.title}
                      className="w-full h-68 object-cover rounded-t-lg"
                      onClick={() => router.push(`/post/${post.id}`)}
                    />
                  )}
                  <div className="p-6">
                    <h2
                      className="text-xl font-bold mb-2 text-center"
                      onClick={() => router.push(`/post/${post.id}`)}
                    >
                      {post.title}
                    </h2>
                    <div className="flex justify-center items-center text-gray-500 text-sm gap-4 mb-6">
                      <span onClick={() => router.push(`/profile/${post.author.id}`)}>
                        👤 <strong>{post.author.username}</strong>
                      </span>
                      <span>
                        📅{" "}
                        {new Date(post.createdAt).toLocaleDateString("az-AZ", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span className="cursor-pointer">❤️ {post.likes}</span>
                      <span className="cursor-pointer">💬 {post.comments}</span>
                    </div>
                    <p className="text-gray-700 mb-4">
                      {post.content.length > 100
                        ? post.content.substring(0, 100) + "..."
                        : post.content}
                    </p>
                    <div className="text-center">
                      <button
                        onClick={() => router.push(`/post/${post.id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Read More
                      </button>

                      {post?.tags && post?.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {post.tags.map((tag, index) => (
                            <span
                              key={index}
                              onClick={() => router.push(`/tag/${tag.id}`)}
                              className="text-white text-xs font-medium px-2 py-1 rounded bg-blue-500 cursor-pointer hover:opacity-80 transition"
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-lg font-bold mb-2">Search</h3>
              <input
                type="text"
                placeholder="Type and hit enter"
                className="w-full border rounded px-3 py-2 mt-2"
              />
            </div>

            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-lg font-bold mb-2">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {uniqueTags.map((tag) => (
                  <span
                    key={tag.id}
                    onClick={() => router.push(`/tag/${tag.id}`)}
                    className="bg-blue-600 text-white px-3 py-1 rounded-full cursor-pointer hover:bg-blue-700 transition text-sm"
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
