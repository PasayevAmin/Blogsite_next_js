"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Post = {
  id: number;
  title: string;
  category?: string;
  image?: string;
  tags?: { id: number; label: string; color?: string }[];
  author: {
    username: string;
  };
  createdAt: string;
  likes: number;
  comments: number;
  content: string;
};

type Tag = {
  id: number;
  label: string;
};

export default function Profile() {
  const router = useRouter();
  const params = useParams();
const [currentUserId, setCurrentUserId] = useState<number | null>(null);

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
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [followed, setFollowed] = useState(false);



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

  async function fetchUserPosts(userId: number) {
    try {
      const res = await fetch(`/api/profile/${userId}`);
      const data = await res.json();
      setPosts(data.posts);

      if (!!data.user.length) {

        setUser(data.user[0])
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

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();

    try {
      const res = await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent,
          authorId: user.id,
          tags: selectedTags,
        }),
      });

      const data = await res.json();
      setPosts((prev) => [data.post, ...prev]);
      setNewPostTitle("");
      setNewPostContent("");
      setSelectedTags([]);
      setShowCreateModal(false);
      

    } catch (error) {
      console.error("Post yaradılmadı:", error);
      alert("Xəta baş verdi");
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
    setFollowed(!followed);
  } else {
    console.error("Follow/Unfollow əməliyyatı uğursuz oldu");
  }
};



  return (
    <div className="bg-gray-100 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Blog</h1>
          <div className="space-x-4">
            <button
              onClick={() => router.push("/")}
              className="text-blue-600 hover:underline font-medium"
            >
              Home
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="hover:underline font-medium"
            >
              Profile
            </button>
            <button className="text-blue-600 hover:underline font-medium">
              Explore
            </button>
          </div>

          {user?.username && (
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 font-semibold">
                  <strong>{user.username}</strong>
                </span>
                {user.coverImage && (
                  <img
                    src={`/uploads/${user.coverImage}`}
                    alt="User Avatar"
                    className="w-16 h-16 rounded-full border object-cover"
                  />
                )}
              </div>
              <button
                onClick={() => handleFollowToggle()}
                className={`px-5 py-2 rounded-full font-medium text-sm transition duration-300 ${followed
                  ? "bg-gray-300 text-gray-700 hover:bg-gray-400"
                  : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
              >
                {followed ? "Following" : "Follow"}
              </button>
            </div>
          )}


        </div>


        {/* Posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.length === 0 && (
            <p className="col-span-full text-gray-500 text-center">
              No posts found.
            </p>
          )}
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white shadow-lg rounded-2xl overflow-hidden transition-transform transform hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
            >
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
                <div>
                  {post.image && (
                    <img
                      src={`/blog/${post.image}`}
                      alt={post.title}
                      className="w-full h-60 object-cover"
                      onClick={() => router.push(`/post/${post.id}`)}

                    />
                  )}
                </div>
                <h2
                  className="text-xl font-semibold text-gray-800"
                  onClick={() => router.push(`/post/${post.id}`)}
                >
                  {post.title}
                </h2>

                <p className="text-gray-600 text-sm">
                  {post.content.length > 100
                    ? post.content.slice(0, 100) + "..."
                    : post.content}
                </p>

                <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                  <span
                    className="hover:underline text-blue-600 cursor-pointer"
                    onClick={() => router.push(`/profile/${post.author.username}`)}
                  >
                    👤 {post.author.username}
                  </span>
                  <div className="flex gap-3">
                    <span>❤️ {post.likes}</span>
                    <span>💬 {post.comments}</span>
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
    </div>
  );
}
