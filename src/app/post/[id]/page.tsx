"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Post = {
  id: number;
  title: string;
  category?: string;
  tags?: {
    id: number;
    label: string;
    color: string
  }[]
  author: {
    id:string;
    username: string;
  };
  createdAt: string;
  likes: { userId: number }[]; // Added likes property
  // comments: number;
  content: string;
  image?: string;
};

function LikeButton({
  postId,
  likes,
}: {
  postId: number;
  likes: { userId: number }[];
}) {
  const router = useRouter();

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(likes.length);
  const [loading, setLoading] = useState(false);

  // LocalStorage-dən istifadəçi ID-ni al
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!storedUser?.id) {
      router.push("/login");
    } else {
      const id = Number(storedUser?.id);
      setCurrentUserId(id);

      const userLiked = likes.some((like) => like.userId === id);
      setLiked(userLiked);
    }
  }, []);

  async function toggleLike() {
    if (loading) return;

    if (!currentUserId) {
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/like/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUserId }),
      });

      const data = await res.json();

      if (res.ok) {
        setLiked(data.liked);
        setLikesCount((count) => count + (data.liked ? 1 : -1));
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
      onClick={toggleLike}
      disabled={loading}
      className={`flex items-center gap-1 px-3 py-1 rounded cursor-pointer ${
        liked ? "bg-red-600 text-white" : "bg-gray-300 text-black"
      }`}
      aria-label={liked ? "Unlike" : "Like"}
    >
      {liked ? "❤️" : "🤍"} {likesCount}
    </button>
  );
}

export default function Details() {
  const router = useRouter()
  const params = useParams();
  const postId = params?.id;
  const [post, setPost] = useState<Post | null>(null);
  const [showModal, setShowModal] = useState(false);

  async function fetchUserPost(id: number) {
    try {
      const res = await fetch(`/api/post/${id}`);
      if (!res.ok) throw new Error("Xəta baş verdi");

      const data = await res.json();
      setPost(data.posts);

    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if (!postId) return;

    const id = Number(postId);
    if (!isNaN(id)) {
      fetchUserPost(id);
    }
  }, [postId]);

  if (!post) {
    return <p className="text-center mt-10 text-gray-500">Yüklənir…</p>;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Şəkil hissəsi */}
        {post.image && (
          <div className="w-full h-[500px] overflow-hidden">
            <img
              src={`/blog/${post.image}`}
              alt={post.title}
              className="w-full h-full object-cover object-center rounded-xl transition-transform duration-300 hover:scale-105 cursor-pointer"
              onClick={() => setShowModal(true)}
            />
          </div>
        )}

        {/* Məlumatlar */}
        <div className="p-6 ">


          <div className="flex flex-wrap justify-center gap-2 mt-4 mb-4">
            {post.tags?.map((tag, index) => (
              <span
                key={index}
                onClick={() => router.push(`/tag/${tag.id}`)}
                className="text-white text-xs font-medium px-2 py-1 rounded bg-blue-500 cursor-pointer hover:opacity-80 transition"
              >
                {tag.label}
              </span>
            ))}
          </div>



          <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
            {post.title}
          </h1>
          <div className="flex justify-center items-center text-gray-500 text-sm gap-4 mb-6 ">
            <span className="cursor-pointer" onClick={() => router.push(`/profile/${post.author.id}`)}>👤 <strong>{post.author.username}</strong></span>
            <span>📅 {new Date(post.createdAt).toLocaleDateString("az-AZ", { day: "2-digit", month: "long", year: "numeric" })}</span>
             <LikeButton 
                    postId={post.id}
                    likes={post.likes}
                  />
            {/* <span className="cursor-pointer">❤️ {post.likes}</span>
            <span className="cursor-pointer">💬 {post.comments}</span> */}
          </div>
          <p className="text-gray-700 leading-relaxed text-lg mb-6">
            {post.content}
          </p>

        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <img
            src={`/blog/${post.image}`}
            alt={post.title}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()} // Modal içində klik close etməsin
          />
        </div>
      )}
    </div>
  );
}
