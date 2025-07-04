"use client";

import CommentSection from "@/app/components/Comment";
import SaveButton from "@/app/components/SaveButton";
import timeAgo from "@/app/components/TimeAgo";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

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
    id: string;
    username: string;
  };
  createdAt: string;
  likes: { userId: number }[]; // Added likes property
  comments: {
    id: number;
    userId: number;
    postId: number;
    createdAt: string;
    replies?: { id: number }[];
  }[];
  content: string;
  image?: string;
  saved: { userId: number }[];
  views: number;
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
  const postId = params?.id;

  const [post, setPost] = useState<Post | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(null);
  const [reloadCommentCount, setReloadCommentCount] = useState(0);
  const [isViewed, setIsViewed] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useTransition();

  // ✅ Istifadəçi və Post View logic
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (!parsedUser?.id) {
      router.push("/login");
      return;
    }

    setUser(parsedUser);

    // ✅ Post view artırma
    if (postId) {
      const sessionKey = `viewed_post_${postId}`;
      const alreadyViewed = sessionStorage.getItem(sessionKey);

      if (!alreadyViewed) {
        fetch(`/api/post/views/${postId}`, { method: "POST" })
          .then((res) => {
            if (res.ok) {
              sessionStorage.setItem(sessionKey, "true");
              setIsViewed(true);
            }
          })
          .catch((err) => console.error("Baxış artırıla bilmədi:", err));
      } else {
        setIsViewed(true);
      }
    }
  }, [postId]);

  // ✅ Postu backend-dən fetch et
  async function fetchUserPost(id: number) {
    setLoading(async () => {
      try {
        const res = await fetch(`/api/post/${id}`);
        if (!res.ok) throw new Error("Post alınarkən xəta baş verdi.");
        const data = await res.json();
        setPost(data.posts);
      } catch (error) {
        console.error(error);
      }
    });
  }

  // ✅ Post yükləmə
  useEffect(() => {
    if (!postId) return;
    const id = Number(postId);
    if (!isNaN(id)) {
      fetchUserPost(id);
    }
  }, [postId]);

  // ✅ Comment modal bağlananda postu yenilə
  const handleModalClose = () => {
    setActiveCommentPostId(null);
    setReloadCommentCount((prev) => prev + 1);
  };

  // ✅ Manual comment dəyişməsi (tək-tük istifadə)
  const CommentChange = () => {
    if (!postId) return;
    const id = Number(postId);
    if (!isNaN(id)) {
      fetchUserPost(id);
    }
  };

  // ✅ Yüklənmə zamanı skeleton göstərin
  if (!post) {
    return loading ? (
      <div className="flex justify-center py-6">
        <svg className="animate-spin h-8 w-8 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    ) : null;
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
            <span className="cursor-pointer" onClick={() =>
              router.push(
                user?.id === post.author.id
                  ? "/profile"
                  : `/profile/${post.author.id}`
              )
            }>👤 <strong>{post.author.username}</strong></span>

            <span>📅 {new Date(post.createdAt).toLocaleDateString("az-AZ", { day: "2-digit", month: "long", year: "numeric" })}</span>
            <LikeButton
              postId={post.id}
              likes={post.likes}
            />
            <span className="cursor-pointer text-black" onClick={() => setActiveCommentPostId(post.id)}>💬  {
              post.comments.reduce(
                (sum, comment) => sum + 1 + (comment.replies?.length || 0),
                0
              )
            }</span>
            <SaveButton
              currentUserId={user ? Number(user.id) : 0}
              postId={post.id}
              saved={post.saved}
            />
          </div>
          <p>
            {post.views} baxış
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {timeAgo(post.createdAt)}
          </p>
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
      {activeCommentPostId && (
        <div className="fixed inset-0 z-50 flex justify-center items-center  bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl h-[80vh] rounded-2xl flex overflow-hidden relative">
            <button
              onClick={handleModalClose}
              className="absolute top-3 right-4 text-xl text-gray-600 hover:text-black"
            >
              ✖
            </button>

            <div className="w-1/2 ">
              <img
                src={`/blog/${post?.image}`}
                alt="Post"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="w-1/2 p-6 overflow-y-auto">
              <div className="mb-4 text-lg font-semibold">
                👤 {post?.author.username}
              </div>
              <CommentSection postId={activeCommentPostId} fetchFollowedPosts={() => CommentChange()} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
