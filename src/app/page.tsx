"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Home, User, Compass, Heart } from "lucide-react";
import dynamic from "next/dynamic";
import { Toaster } from "react-hot-toast";
import { notifySuccess } from "@/app/lib/toast/toasthelper";
import PostSearch from "./components/PostSearch";
import SaveButton from "./components/SaveButton";
import { userAgent } from "next/server";
import axios from "axios";
const CommentSection = dynamic(() => import("@/app/components/Comment"), { ssr: false });
type Tag = {
  id: number;
  label: string;
  color?: string;
};

type Post = {
  id: number;
  title: string;
  tags?: Tag[];
  author: {
    id: number;
    username: string;
    coverImage?: string;
  };
  createdAt: string;
  likes: { userId: number }[];
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
  views:  number  // Added views property
};



type User = {
  id?: number;
  username?: string;
  role?: string;
  name?: string;
  surname?: string;
  email?: string;
  coverImage?: string;

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




export default function BlogPage() {
  const router = useRouter();
  const [user, setUser] = useState<User>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(null);
  const [reloadCommentCount, setReloadCommentCount] = useState(0);

  const fetchFollowedPosts = async (userId: number, pageNumber = 1) => {

    setLoading(true);

    try {
      const res = await fetch("/api/following_post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, page: pageNumber }),
      });

      if (!res.ok) throw new Error("Xəta baş verdi");

      const data = await res.json();

      if (data.posts.length < 10) {
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


      setPage((prev) => prev + 1);
    } catch (error) {
      console.error("Postlar gətirilə bilmədi:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentsf = async () => {
    if (typeof window !== "undefined") {
      const storedUserJson = localStorage.getItem("user");
      const res = await axios.get("/api/auth/me", { withCredentials: true });
      console.log("res:", res.data);
      if (!storedUserJson) {
        router.push("/login");
        return;
      }

      const storedUser: User = JSON.parse(storedUserJson);
      if (!storedUser?.id) {
        router.push("/login");
        return;
      }

      setUser(storedUser);
      fetchFollowedPosts(storedUser.id, 1);
    }
  };

  useEffect(() => {
    if (!user.id) return; // user.id undefined olduqda fetch çağırma

    fetchFollowedPosts(user.id, 1);
  }, [reloadCommentCount, user.id]);
  useEffect(() => {
    fetchCommentsf(); // yalnız bir dəfə login olmuş user-i localStorage-dan çəkir
  }, []);


  const handleModalClose = () => {
    setActiveCommentPostId(null);
    setReloadCommentCount((prev) => prev + 1);
    if (user.id !== undefined) {
      fetchFollowedPosts(user.id); // Refresh posts after closing modal
    }
  };





  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 &&
        !loading &&
        hasMore
      ) {
        if (user.id) {
          fetchFollowedPosts(user.id, page);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore, page, user.id]);

  const goToHome = () => router.push("/");
  const goToProfile = () => router.push("/profile");
  const gotoExplore = () => router.push("/explore");

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        localStorage.removeItem("user");
        router.push("/login");
        notifySuccess("Çıxış Olundu!🎉");
      } else {
        alert("Çıxış zamanı xəta baş verdi.");
      }
    } catch (error) {
      console.error("Çıxış zamanı xəta:", error);
    }
  };

  const uniqueTags = useMemo(() => {
    const tagMap = new Map<number, Tag>();
    posts.forEach((post) => {
      post.tags?.forEach((tag) => {
        if (!tagMap.has(tag.id)) {
          tagMap.set(tag.id, tag);
        }
      });
    });
    return Array.from(tagMap.values());
  }, [posts]);
useEffect(() => {
  console.log("Posts:", posts.map(post => post.author.coverImage));


  
}, [])

  return (
    <div className="bg-gray-100 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 relative">
          <div className="text-center w-full">
            <h1 className="text-4xl font-bold mb-2">Blog</h1>
            <div className="flex justify-center gap-8">
              <button
                onClick={goToHome}
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
              >
                <Home className="w-5 h-5 cursor-pointer" />
                <span className="cursor-pointer font-medium text-base">Home</span>
              </button>

              <button
                onClick={goToProfile}
                className="flex items-center gap-2 text-blue-700 hover:text-gray-600 transition"
              >
                <User className="w-5 h-5 cursor-pointer" />
                <span className="cursor-pointer font-medium text-base">Profile</span>
              </button>

              <button
                onClick={gotoExplore}
                className="flex items-center gap-2 text-blue-700 hover:text-gray-600 transition"
              >
                <Compass className="w-5 h-5 cursor-pointer" />
                <span className="cursor-pointer font-medium text-base">Explore</span>
              </button>
            </div>
          </div>

          <div className="hidden sm:flex justify-end items-center space-x-4 mb-8 p-4">
            <span className="text-gray-700 font-semibold">
              <strong>{user?.username}</strong>
            </span>

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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feed */}
          <div className="lg:col-span-2 space-y-10">
            <div className="space-y-8">
              {posts?.map((post) => (
                console.log("author image:", post.author.coverImage?.length),
                <div
                  key={post.id}
                  className="max-w-xl mx-auto border border-gray-200 rounded-xl bg-white shadow-md"
                >
                  {/* Author info */}
                  <div className="flex items-center px-4 py-3">
                    <img
                      src={`/uploads/${post.author.coverImage || "default-avatar.png"}`}
                      alt={post.author.username}
                      className="w-9 h-9 rounded-full object-cover mr-3"
                    />
                    <span
                      onClick={() =>
                        router.push(
                          user?.id === post.author.id
                            ? "/profile"
                            : `/profile/${post.author.id}`
                        )
                      }
                      className="font-medium text-sm text-gray-800 cursor-pointer hover:text-blue-500 transition"
                    >
                      {post.author.username}
                    </span>
                  </div>

                  {/* Image */}
                  {post.image && (
                    <img
                      src={`/blog/${post.image}`}
                      alt={post.title}
                      className="w-full max-h-[500px] object-cover cursor-pointer"
                      onClick={() => router.push(`/post/${post.id}`)}
                    />
                  )}

                  {/* Footer (like/comment/save) */}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2 sm:gap-3 text-base sm:text-sm mb-2">
                      <LikeButton
                        postId={post.id}
                        likes={post.likes}
                        currentUserId={user?.id}
                      />
                      <span
                        className="cursor-pointer"
                        onClick={() => setActiveCommentPostId(post.id)}
                      >
                        💬{post.comments.length}
                      </span>
                      <SaveButton
                        currentUserId={user.id ?? 0}
                        postId={post.id}
                        saved={post.saved}
                      />
                    </div>

                    {/* Like count */}
                    <p className="text-sm text-gray-800 font-medium mb-1">
                      {post.views} Views
                    </p>

                    {/* Caption */}
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold mr-1 text-gray-800">
                        {post.author.username}
                      </span>
                      {post.content.length > 100
                        ? post.content.substring(0, 100) + "..."
                        : post.content}
                    </p>

                    {/* Date */}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(post.createdAt).toLocaleDateString("az-AZ", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex justify-center py-6">
                <svg
                  className="animate-spin h-6 w-6 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx={12}
                    cy={12}
                    r={10}
                    stroke="currentColor"
                    strokeWidth={4}
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              </div>
            )}

            {/* No more posts */}
            {!hasMore && (
              <div className="text-center text-gray-400 font-medium mt-6">
                Daha çox post yoxdur.
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-lg font-bold mb-2 pl-6">Search</h3>
              <PostSearch />
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

            <div className="flex flex-col w-1/2 p-6">


              <div className=" overflow-hidden">
                <div className="mb-4 text-lg font-semibold">
                  {posts.find(p => p.id === activeCommentPostId)?.author.coverImage && (
                    <img
                      src={`/uploads/${posts.find(p => p.id === activeCommentPostId)?.author.coverImage}`}
                      alt={posts.find(p => p.id === activeCommentPostId)?.author.username}
                      className="inline-block w-10 h-10 rounded-full mr-2 object-cover"
                    />
                  )}
                  {posts.find(p => p.id === activeCommentPostId)?.author.username}
                </div>
                <div className="mb-4 text-lg font-semibold">
                  {posts.find(p => p.id === activeCommentPostId)?.title}

                </div>
              </div>



             



                <CommentSection postId={activeCommentPostId} fetchFollowedPosts={() => fetchCommentsf()} />
            </div>

          </div>
        </div>
      )}
      <Toaster />

    </div>
  );
}
