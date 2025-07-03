"use client";

import { useRouter } from "next/navigation";
import * as Popover from "@radix-ui/react-popover";
import { useEffect, useState, useCallback } from "react";
import { Home, User, Compass, Heart } from "lucide-react";
import CommentSection from "../components/Comment";
import PostSearch from "@/app/components/PostSearch";
import SaveButton from "../components/SaveButton";

type Post = {
  id: number;
  title: string;
  tags?: { id: number; label: string; color?: string }[];
  author: {
    id: number;
    username: string;
  };
  createdAt: string;
  likes: { id: number; userId: number; postId: number; createdAt: string }[];
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
  const [likesCount, setLikesCount] = useState(likes?.length);
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
      className={`flex items-center gap-1 px-3 py-1 rounded cursor-pointer ${liked ? "bg-red-600 text-white" : "bg-gray-300 text-black "
        }`}
      aria-label={liked ? "Unlike" : "Like"}
    >
      {liked ? "❤️" : "🤍"} {likesCount}
    </button>
  );
}
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
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(null);
  const [reloadCommentCount, setReloadCommentCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!storedUser?.id) {
        window.location.href = "/login";
      } else {
        setUser(storedUser);
        loadPosts(0);
      }
    }
  }, []);
  const Commentchange = () => {
    if (typeof window !== "undefined") {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!storedUser?.id) {
        window.location.href = "/login";
      } else {
        setUser(storedUser);
        loadPosts(0);
      }
    }
  }
  const loadPosts = useCallback(
    async (currentOffset: number) => {
      if (loading || !hasMore) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/post?limit=${limit}&offset=${currentOffset}`);
        if (!res.ok) throw new Error("Xəta baş verdi");

        const data = await res.json();

        if (data.posts?.length < limit) {
          setHasMore(false);
        }

        setPosts((prev) => {
          const updatedPosts = data.posts.map((newPost: Post) => {
            const existing = prev.find((p) => p.id === newPost.id);
            return existing ? newPost : null;
          }).filter(Boolean);

          const newPosts = data.posts.filter(
            (newPost: Post) => !prev.some((p) => p.id === newPost.id)
          );

          // Remove replaced ones and add updated + new
          const filteredPrev = prev.filter(
            (p) => !updatedPosts.some((up: Post | null) => up!.id === p.id)
          );

          return [...filteredPrev, ...updatedPosts.filter(Boolean), ...newPosts];
        });


        setOffset((prev) => prev + data.posts?.length);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [loading, hasMore]
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const isAtBottom =
        Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 5;

      if (isAtBottom && !loading && hasMore) {
        loadPosts(offset);
      }
    },
    [loadPosts, loading, hasMore, offset]
  );



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
  useEffect(() => {
    if (reloadCommentCount > 0) {
      loadPosts(0); // Reload posts when comment count changes
    }
  }, [reloadCommentCount]);
  const handleModalClose = () => {
    setActiveCommentPostId(null);
    setReloadCommentCount((prev) => prev + 1);
  };
  return (
    <div
      className="bg-gray-100 min-h-screen py-10 overflow-auto"
      style={{ height: "100vh" }}
      onScroll={handleScroll}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6 relative">
          <div className="text-center w-full">
            <h1 className="text-4xl font-bold mb-2">Blog</h1>
            <div className="flex justify-center gap-8">
              <button
                onClick={() => router.push(`/`)}
                className="flex items-center gap-2 text-blue-700 hover:text-blue-600 transition"
              >
                <Home className="w-5 h-5 cursor-pointer " />
                <span className="cursor-pointer font-medium text-base">Home</span>
              </button>

              <button
                onClick={() => router.push(`/profile`)}
                className="  flex items-center gap-2 text-blue-700 hover:text-gray-600 transition"
              >
                <User className="w-5 h-5 cursor-pointer" />
                <span className="cursor-pointer font-medium text-base">Profile</span>
              </button>

              <button
                onClick={() => router.push(`/explore`)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-600 transition"
              >
                <Compass className="w-5 h-5 cursor-pointer" />
                <span className="cursor-pointer font-medium text-base">Explore</span>
              </button>
            </div>
          </div>

          <div className="hidden sm:flex justify-end items-center space-x-4 mb-8 p-4">
            <span className="text-gray-700 font-semibold">Welcome, <strong>{user?.username}</strong></span>
            <Popover.Root>
              <Popover.Trigger asChild>
                {user.coverImage ? (
                  <img
                    src={`/uploads/${user.coverImage}`}
                    alt="Profil"
                    className="w-20 h-20 rounded-full border-2 border-yellow-400 object-cover cursor-pointer shadow-md hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full border-2 border-yellow-400 bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-3xl shadow-md cursor-pointer hover:scale-105 transition-transform">
                    {user.username?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content side="bottom" align="end" sideOffset={8} className="bg-white rounded-md shadow-lg p-4 w-48 z-50">
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
        <div className="flex space-x-4 w-full lg:w-[600px]">

          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-lg font-bold mb-2 pl-6">Search</h3>
            <PostSearch />
          </div>

          {/* Popular Tags Section */}
          <div className="flex-1 bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold mb-3 text-gray-800">Populyar Etiketlər</h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(
                new Map(
                  posts.flatMap((p) => p.tags || []).map((tag) => [tag.id, tag])
                ).values()
              ).map((tag) => (
                <span
                  key={tag.id}
                  onClick={() => router.push(`/tag/${tag.id}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1 rounded-full cursor-pointer transition"
                >
                  #{tag.label}
                </span>
              ))}
            </div>
          </div>
        </div>


        <br></br>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts === null && (
            <p className="col-span-full text-gray-500 text-center">
              Heç bir yazı tapılmadı.
            </p>
          )}
          {posts.map((post) => (

            <div
              key={post.id}
              className="bg-white shadow-lg rounded-2xl overflow-hidden transition-transform transform hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
            >
              {post.image && (
                <img
                  src={`/blog/${post.image}`}
                  alt={post.title}
                  className="w-full h-60 object-cover"
                  onClick={() => router.push(`/post/${post.id}`)}
                />
              )}

              <div className="p-5 flex flex-col gap-3">
                {/* Top Bar */}
                <div className="flex items-center justify-between text-sm text-gray-400">

                  <span>
                    {new Date(post.createdAt).toLocaleDateString("az-AZ", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {/* Title */}
                <h2
                  className="text-xl font-semibold text-gray-800 hover:underline"
                  onClick={() => router.push(`/post/${post.id}`)}
                >
                  {post.title}
                </h2>

                {/* Content */}
                <p
                  className="text-gray-600 text-sm"
                  onClick={() => router.push(`/post/${post.id}`)}
                >
                  {post?.content?.length > 100
                    ? post.content.slice(0, 100) + "..."
                    : post.content}
                </p>

                {/* Footer */}
                <div className="flex justify-between items-center text-sm text-gray-500 mt-2  ">
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

                  <div className="flex gap-3 items-center ">
                    <LikeButton
                      postId={post.id}
                      likes={post.likes}
                      currentUserId={user?.id}
                    />
                    <button
                      onClick={() => setActiveCommentPostId(post.id)}
                      className="hover:text-blue-600 transition cursor-pointer text-black"
                    >
                      💬  {
                        post.comments.reduce(
                          (sum, comment) => sum + 1 + (comment.replies?.length || 0),
                          0
                        )
                      }
                    </button>
                    <SaveButton
                      currentUserId={user.id ?? 0}
                      postId={post.id}
                      saved={post.saved}
                    />
                  </div>
                </div>

                {/* Tags */}
                {post?.tags && post?.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {post.tags.map((tag) => (
                      <span
                        key={tag.id}
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
          ))}
          {loading && (
            <div className="flex justify-center py-6">
              <svg
                className="animate-spin h-8 w-8 text-gray-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12" cy="12" r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            </div>
          )}

          {!hasMore && <div className="text-center py-6 text-gray-600">Daha çox post yoxdur.</div>}
        </div>


      </div>
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
                src={`/blog/${posts.find(p => p.id === activeCommentPostId)?.image}`}
                alt="Post"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="w-1/2 p-6 overflow-y-auto">
              <div className="mb-4 text-lg font-semibold">
                👤 {posts.find(p => p.id === activeCommentPostId)?.author.username}
              </div>
              <CommentSection postId={activeCommentPostId} fetchFollowedPosts={() => Commentchange()} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
