"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as Popover from "@radix-ui/react-popover";
import { Home, User, Compass, Heart } from "lucide-react";



type Post = {
  id: number;
  title: string;
  category?: string;
  author: {
    id: string;
    username: string;
  };
  createdAt: string;
  likes: number;
  comments: { id: number; userId: number; postId: number; createdAt: string }[];
  tags: { id: number; label: string; color?: string }[];
  content: string;
  image?: string;
};

type Tag = {
  id: number;
  label: string;
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
      className={`flex items-center gap-1 px-3 py-1 rounded ${
        liked ? "bg-red-600 text-white" : "bg-gray-300 text-black"
      }`}
      aria-label={liked ? "Unlike" : "Like"}
    >
      {liked ? "❤️" : "🤍"} {likesCount}
    </button>
  );
}
export default function Profile() {
  const router = useRouter();

  const [user, setUser] = useState<any>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!storedUser?.id) {
      router.push("/login");
    } else {
      setUser(storedUser);
      fetchUserPosts(storedUser.id);
      fetchTags();
    }
  }, []);

  async function fetchUserPosts(userId: number) {
    try {
      const res = await fetch(`/api/profile/${userId}`);
      const data = await res.json();
      setPosts(data.posts);
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

  async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/post/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      return data.success ? data.data.filename : null;
    } catch (error) {
      console.error("Şəkil yüklənmədi:", error);
      return null;
    }
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();

    let uploadedImageFilename = null;

    if (file) {
      uploadedImageFilename = await uploadImage(file);
      if (!uploadedImageFilename) {
        alert("Şəkil yüklənmədi, yenidən cəhd edin.");
        return;
      }
    }

    try {
      const res = await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent,
          authorId: user.id,
          image: uploadedImageFilename,
          tags: selectedTags,
        }),
      });

      const data = await res.json();
      setPosts((prev) => [data.post, ...prev]);
      setNewPostTitle("");
      setNewPostContent("");
      setFile(null);
      setSelectedTags([]);
      setShowCreateModal(false);

    } catch (error) {
      console.error("Post yaradılmadı:", error);
      alert("Xəta baş verdi");
    }

  }
  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });

      if (res.ok) {
        localStorage.removeItem("user");
        router.push("/login");
      } else {
        alert("Çıxış zamanı xəta baş verdi.");
      }
    } catch (error) {
      console.error("Çıxış zamanı xəta:", error);
    }
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
                onClick={() => router.push(`/Profile`)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-600 transition"
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

        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Create New Post
          </button>
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
              {post.image && (
                <img
                  src={`/blog/${post.image}`}
                  alt={post.title}
                  className="w-full h-60 object-cover"
                  onClick={() => router.push(`/post/${post.id}`)}

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

                <h2 className="text-xl font-semibold text-gray-800"
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
                  <span >👤 {post.author.username}</span>
                  <div className="flex gap-3">
                      <LikeButton
                      postId={post.id}
                      likes={Array.isArray(post.likes) ? post.likes : []}
                    />
                   
                    <span>💬 {post?.comments.length}</span>
                  </div>
                </div>
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
          ))}
        </div>
      </div>

      {/* Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded p-6 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">Create New Post</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block mb-1 font-semibold">Title</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Content</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-semibold text-gray-700">Image</label>
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
                >
                  Choose Image
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                />
                {file && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected file: <span className="font-medium">{file.name}</span>
                  </p>
                )}
              </div>


              <div>
                <label className="block mb-1 font-semibold">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        setSelectedTags((prev) =>
                          prev.includes(tag.id)
                            ? prev.filter((id) => id !== tag.id)
                            : [...prev, tag.id]
                        )
                      }
                      className={`px-3 py-1 rounded-full border ${selectedTags.includes(tag.id)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      {tag.label}
                    </button>
                  ))}

                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="px-4 py-2 border rounded"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
