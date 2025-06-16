"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

type Post = {
  id: number;
  title: string;
  category?: string;
  author: {
    username: string;
  };
  createdAt: string;
  likes: number;
  comments: number;
  content: string;
  image?: string;
};

export default function Details() {
  const router=useRouter()
  const params = useParams();
  const tagId = params?.id;
  const [posts, setPosts] = useState<Post[]>([]);
  const [showModal, setShowModal] = useState(false);

  async function fetchUserPostfortag(tagId: number) {
    try {
      const res = await fetch(`/api/tag/${tagId}`);
      if (!res.ok) throw new Error("Xəta baş verdi");

      const data = await res.json();
      setPosts(data.posts);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if (!tagId) return;

    const id = Number(tagId);
    if (!isNaN(id)) {
      fetchUserPostfortag(id);
    }
  }, [tagId]);

  if (!posts) {
    return (
      <div className="flex justify-center items-center mt-20 text-gray-500 text-lg">
        Yüklənir…
      </div>
    );

  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Etiketə görə yazılar
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.length === 0 && (
          <div className="col-span-full text-center text-gray-500 text-lg">
            Heç bir yazı tapılmadı.
          </div>
        )}

        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white shadow-lg rounded-2xl overflow-hidden transition-transform transform hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
            onClick={()=>router.push(`/post/${post.id}`)}
          >
            {post.image && (
              <img
                src={`/blog/${post.image}`}
                alt={post.title}
                className="w-full h-60 object-cover"
              />
            )}
            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm text-gray-400">
                {post.category && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                    {post.category}
                  </span>
                )}
                <span>
                  {new Date(post.createdAt).toLocaleDateString("az-AZ", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <h2 className="text-xl font-semibold text-gray-800">
                {post.title}
              </h2>

              <p className="text-gray-600 text-sm">
                {post.content.length > 100
                  ? post.content.slice(0, 100) + "..."
                  : post.content}
              </p>

              <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                <span>👤 {post.author.username}</span>
                <div className="flex gap-3">
                  <span>❤️ {post.likes}</span>
                  <span>💬 {post.comments}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
