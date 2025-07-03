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

  const fetchCommentsf = () => {
    if (typeof window !== "undefined") {
      const storedUserJson = localStorage.getItem("user");
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
              Welcome, <strong>{user?.username}</strong>
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
          <div className="lg:col-span-2 space-y-10">
            {posts?.map((post) => (
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
                      <span
                        onClick={() =>
                          router.push(
                            user?.id === post.author.id
                              ? "/profile"
                              : `/profile/${post.author.id}`
                          )
                        }
                        className="cursor-pointer hover:text-blue-600"
                      >
                        👤 <strong>{post.author.username}</strong>
                      </span>

                      <span>
                        📅{" "} { }
                        {new Date(post.createdAt).toLocaleDateString("az-AZ", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <LikeButton
                        postId={post.id}
                        likes={post.likes}
                        currentUserId={user?.id}
                      />
                      <span className="text-black" onClick={() => setActiveCommentPostId(post.id)}>💬
                        {
                          post.comments.reduce(
                            (sum, comment) => sum + 1 + (comment.replies?.length || 0),
                            0
                          )
                        }

                      </span>
                      <SaveButton
                        currentUserId={user.id ?? 0}
                        postId={post.id}
                        saved={post.saved}
                      />
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

                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
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
            {!hasMore && (
              <div className="text-center text-gray-400 font-medium mt-6">Daha çox post yoxdur.</div>
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
                  👤 {posts.find(p => p.id === activeCommentPostId)?.author.username}
                </div>
              </div>



              <div className=" overflow-hidden">



                <CommentSection postId={activeCommentPostId} fetchFollowedPosts={() => fetchCommentsf()} />
              </div>
            </div>

          </div>
        </div>
      )}
      <Toaster />

    </div>
  );
}
