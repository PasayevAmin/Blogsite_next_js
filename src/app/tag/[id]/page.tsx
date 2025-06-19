"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

type Post = {
  id: number;
  title: string;
  category?: string;
  tags: {
    id: number;
    label: string;
    color: string;
  }[];
  author: {
    id: number;
    username: string;
  };
  createdAt: string;
  likes: { userId: number }[];  // Likes - array userId-lərlə
  comments: number;
  content: string;
  image?: string;
};

type User = {
  id?: number;
};

function LikeButton({
  postId,
  likes,
  currentUserId,
}: {
  postId: number;
  likes: { userId: number }[];
  currentUserId?: number;
}) {
  const router = useRouter();

  const [liked, setLiked] = useState(
    currentUserId ? likes.some((like) => like.userId === currentUserId) : false
  );
  const [likesCount, setLikesCount] = useState(likes.length);
  const [loading, setLoading] = useState(false);

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
      className={`flex items-center gap-1 px-3 py-1 rounded cursor-pointer ${liked ? "bg-red-600 text-white" : "bg-gray-300 text-black"
        }`}
      aria-label={liked ? "Unlike" : "Like"}
    >
      {liked ? "❤️" : "🤍"} {likesCount}
    </button>
  );
}

export default function Details() {
  const router = useRouter();
  const params = useParams();
  const tagId = params?.id;

  const [user, setUser] = useState<User>({});
  const [posts, setPosts] = useState<Post[]>([]);

  async function fetchUserPostfortag(tagId: number) {
    try {
      const res = await fetch(`/api/tag/${tagId}`);
      if (!res.ok) throw new Error("Xəta baş verdi");

      const data = await res.json();
      setPosts(data.posts);
      console.log(data.posts)
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

    if (typeof window !== "undefined") {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

      if (!storedUser?.id) {
        window.location.href = "/login";
      } else {
        setUser(storedUser);
      }
    }
  }, [tagId]);

  if (!posts) {
    return (
      <div className="flex justify-center items-center mt-20 text-gray-500 text-lg">
        Yüklənir…
      </div>
    );
  }

  // Function to navigate to home page
  function goToHome() {
    router.push("/");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 text-center text-gray-800">
        Etiketə görə yazılar
      </h1>

      {/* Home düyməsi - başlıq altı, ortalanmış, mavi rəngli */}
      <div className="text-center mb-6">
        <button
          onClick={goToHome}
          className="text-blue-600 hover:underline font-semibold text-lg px-4 py-2 cursor-pointer"
        >
          Ana səhifəyə qayıt
        </button>
      </div>


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
          >
            {post.image && (
              <img
                onClick={() => router.push(`/post/${post.id}`)}
                src={`/blog/${post.image}`}
                alt={post.title}
                className="w-full h-60 object-cover"
              />
            )}
            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm text-gray-400">
                {post?.tags && post?.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-white text-xs font-medium px-2 py-1 rounded bg-blue-500 cursor-pointer hover:opacity-80 transition"
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                )}
                <span>
                  {new Date(post.createdAt).toLocaleDateString("az-AZ", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <h2
                onClick={() => router.push(`/post/${post.id}`)}
                className="text-xl font-semibold text-gray-800"
              >
                {post.title}
              </h2>

              <p
                onClick={() => router.push(`/post/${post.id}`)}
                className="text-gray-600 text-sm"
              >
                {post.content.length > 100
                  ? post.content.slice(0, 100) + "..."
                  : post.content}
              </p>

              <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                <span
                  onClick={() => {
                    const currentUserId = user?.id; // daxil olmuş istifadəçi id-si
                    const authorId = post.author.id;

                    if (currentUserId === authorId) {
                      router.push("/profile");
                    } else {
                      router.push(`/profile/${authorId}`);
                    }
                  }}
                >
                  👤 <strong>{post.author.username}</strong>
                </span>
                <div className="cursor-pointer flex gap-3 items-center">
                  <LikeButton
                    postId={post.id}
                    likes={post.likes}
                    currentUserId={user?.id}
                  />
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
