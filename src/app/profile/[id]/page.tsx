"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CommentSection from "@/app/comment/page";
import { Compass, Home, User } from "lucide-react";

// --- Types

type Post = {
  id: number;
  title: string;
  category?: string;
  image?: string;
  tags?: { id: number; label: string; color?: string }[];
  author: {
    id: number;
    username: string;
  };
  createdAt: string;
  likes: { userId: number }[]; // Changed from number to array of objects
  comments: { id: number; userId: number; postId: number; createdAt: string }[];
  content: string;
};

type Tag = {
  id: number;
  label: string;
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





export default function Profile() {
  const router = useRouter();
  const params = useParams();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(null);
  const [reloadCommentCount, setReloadCommentCount] = useState(0);
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
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [followed, setFollowed] = useState<boolean | null>(null);

  useEffect(() => {
    const userIdParam = params?.id;
    const userId = userIdParam ? Number(userIdParam) : undefined;

    if (userId !== undefined && !isNaN(userId)) {
      fetchUserPosts(userId);
    }

    fetchTags();

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.id) {
          setCurrentUserId(parsedUser.id);
        }
      } catch (error) {
        console.error("Invalid user object in localStorage");
      }
    }
  }, []);
  const Commentchange=()=>{
    const userIdParam = params?.id;
    const userId = userIdParam ? Number(userIdParam) : undefined;

    if (userId !== undefined && !isNaN(userId)) {
      fetchUserPosts(userId);
    }

    fetchTags();

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.id) {
          setCurrentUserId(parsedUser.id);
        }
      } catch (error) {
        console.error("Invalid user object in localStorage");
      }
    }
  }

  useEffect(() => {
    if (currentUserId && user.id && currentUserId !== user.id) {
      checkIfFollowing();
    }
  }, [currentUserId, user.id]);

  async function fetchUserPosts(userId: number) {
    try {
      const res = await fetch(`/api/profile/${userId}`);
      const data = await res.json();
      setPosts(data.posts.filter((p: Post) => p.author.id !== currentUserId));
      if (!!data.user.length) {
        setUser(data.user[0]);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchTags() {
    try {
      const res = await fetch("/api/tag");
      const data = await res.json();
      setAllTags(data.tags);
    } catch (err) {
      console.error("Tag yüklənmədi:", err);
    }
  }

  async function checkIfFollowing() {
    try {
      const res = await fetch("/api/isfollowing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followerId: currentUserId,
          followingId: user.id,
        }),
      });
      const data = await res.json();
      setFollowed(data.isFollowing);
    } catch (error) {
      console.error("Follow status yoxlanılmadı:", error);
    }
  }

  const handleFollowToggle = async () => {
    if (!currentUserId || !user.id) return;

    const res = await fetch(`/api/${followed ? "unfollow" : "follow"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        followerId: currentUserId,
        followingId: user.id,
      }),
    });

    if (res.ok) {
      setFollowed((prev) => !prev);
    } else {
      console.error("Follow/Unfollow əməliyyatı uğursuz oldu");
    }
  };
const handleModalClose = () => {
    setActiveCommentPostId(null);
    setReloadCommentCount((prev) => prev + 1);
  };
  return (
    <div className="bg-gray-100 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Blog</h1>
          <div className="flex justify-center gap-8">
            <button
              onClick={() => router.push(`/`)}
              className="flex items-center gap-2 text-blue-700 hover:text-blue-600 transition"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium text-base">Home</span>
            </button>

            <button
              onClick={() => router.push(`/profile`)}
              className="flex items-center gap-2 text-blue-700 hover:text-blue-600 transition"
            >
              <User className="w-5 h-5" />
              <span className="font-medium text-base">Profile</span>
            </button>

            <button
              onClick={() => router.push(`/explore`)}
              className="flex items-center gap-2 text-blue-700 hover:text-gray-600 transition"
            >
              <Compass className="w-5 h-5" />
              <span className="font-medium text-base">Explore</span>
            </button>
          </div>

          {user?.username && (
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 font-semibold">
                  <strong>{user.username}</strong>
                </span>
                {user.coverImage && (
                  <img src={`/uploads/${user.coverImage}`} alt="User Avatar" className="w-16 h-16 rounded-full border object-cover" />
                )}
              </div>
              {currentUserId !== user.id && followed !== null && (
                <button
                  onClick={handleFollowToggle}
                  className={`px-5 py-2 rounded-full font-medium text-sm transition duration-300 ${followed ? "bg-gray-300 text-gray-700 hover:bg-gray-400" : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                  {followed ? "Following" : "Follow"}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.length === 0 && <p className="col-span-full text-gray-500 text-center">No posts found.</p>}

          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white shadow-lg rounded-2xl overflow-hidden transition-transform transform hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
            >
              <div className="p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  {post.category && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{post.category}</span>
                  )}
                  <span>{new Date(post.createdAt).toLocaleDateString("az-AZ", { year: "numeric", month: "short", day: "numeric" })}</span>
                </div>

                {post.image && (
                  <img
                    src={`/blog/${post.image}`}
                    alt={post.title}
                    className="w-full h-60 object-cover"
                    onClick={() => router.push(`/post/${post.id}`)}
                  />
                )}

                <h2 className="text-xl font-semibold text-gray-800" onClick={() => router.push(`/post/${post.id}`)}>
                  {post.title}
                </h2>

                <p className="text-gray-600 text-sm">
                  {post.content.length > 100 ? post.content.slice(0, 100) + "..." : post.content}
                </p>

                <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                  <span
                    className="hover:underline text-blue-600 cursor-pointer"
                    onClick={() => router.push(`/profile/${post.author.username}`)}
                  >
                    👤 {post.author.username}
                  </span>
                  <div className="cursor-pointer flex gap-3 ">
                   <LikeButton
                      postId={post.id}
                      likes={post.likes}
                      currentUserId={user?.id}
                    />

                    <span onClick={() => setActiveCommentPostId(post.id)}>💬 {post.comments.length}</span>
                  </div>
                </div>

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
          ))}
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
              <CommentSection postId={activeCommentPostId} fetchFollowedPosts={()=>Commentchange()}  />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}