"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";


type Post = {
  id: number;
  title: string;
  category?: string;
  author: {
    id:string;
    username: string;
  };
  createdAt: string;
  likes: number;
  comments: number;
  tags:{ id: number; label: string; color?: string }[];
  content: string;
  image?: string;
};

type Tag = {
  id: number;
  label: string;
};

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
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-semibold">
              Welcome, <strong>{user?.username}</strong>
            </span>
            {user.coverImage && (
              <img
                src={`/uploads/${user.coverImage}`}
                alt="User Avatar"
                className="w-16 h-16 rounded-full border object-cover"
              />
            )}
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
                    <span>❤️ {post.likes}</span>
                    <span>💬 {post.comments}</span>
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

              <div>
                <label className="block mb-1 font-semibold">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFile(e.target.files ? e.target.files[0] : null)
                  }
                />
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
