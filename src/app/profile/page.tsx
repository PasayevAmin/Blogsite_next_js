"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Popover from "@radix-ui/react-popover";
import { Home, User, Compass, Heart, X } from "lucide-react";
import CommentSection from "../comment/page";
import { notifyError, notifySuccess } from "@/app/lib/toast/toasthelper";
import { Toaster } from "react-hot-toast";



type Post = {
  id: number;
  title: string;
  category?: string;
  author: {
    id: string;
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
  currentUserId,
}: {
  postId: number;
  likes: { userId: number }[];
  currentUserId?: number;
}) {
  const router = useRouter();

  const [liked, setLiked] = useState(
    currentUserId ? likes?.some((like) => like.userId === currentUserId) : false
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

  const [user, setUser] = useState<any>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useTransition()

  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(null);
  const [reloadCommentCount, setReloadCommentCount] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    surname: "",
    email: "",
  });


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
  const Commentchange = () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!storedUser?.id) {
      router.push("/login");
    } else {
      setUser(storedUser);
      fetchUserPosts(storedUser.id);
      fetchTags();
    }
  }
  async function fetchUserPosts(userId: number) {
    setLoading(async () => {
      try {
        const res = await fetch(`/api/profile/${userId}`);
        const data = await res.json();
        setPosts(data.posts);
      } catch (error) {
        console.error(error);
      }
    })

  }
  const handleDeletePost = async (postId: number) => {
    if (!confirm("Bu postu silmək istədiyinizə əminsiniz?")) {
      return;
    }

    try {
      const res = await fetch(`/api/post/${postId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
        notifySuccess(data.message || "Post uğurla silindi!🗑️");
      } else {
        notifyError(data.error || "Post silinərkən xəta baş verdi.");
      }
    } catch (error) {
      console.error("Post silinərkən xəta:", error);
      notifyError("Post silinərkən server xətası baş verdi.");
    }
  };
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
      notifySuccess("Post Yaradıldı!🎉")

    } catch (error) {
      console.error("Post yaradılmadı:", error);
      notifyError("Post Yaradılabilmədi!❌")
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
          <div className="flex justify-between items-center mb-8 p-4">
            {/* Sol tərəf: Welcome və Profilə düzəliş */}
            <div className="flex flex-col">
              <span className="text-gray-700 font-semibold text-lg ">
                Welcome,<strong>{user?.username}</strong>
              </span>
              <button
                onClick={() => {
                  setFormData({
                    username: user.username,
                    name: user.name,
                    surname: user.surname,
                    email: user.email,
                  });
                  setShowEditModal(true);
                }}
                className="mt-2 bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 w-fit"
              >
                Edit Profile
              </button>
            </div>

            {/* Sağ tərəf: Avatar və çıxış menyusu */}
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
          {posts === null && (
            <p className="col-span-full text-gray-500 text-center">
              No Posts Yet
            </p>
          )}

          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white shadow-lg rounded-2xl overflow-hidden transition-transform transform hover:scale-[1.02] hover:shadow-2xl"
            // cursor-pointer burada artıq idi, çünki kartın özünün birbaşa klik hadisəsi yoxdur.
            // İçərisindəki elementlər (şəkil, başlıq, məzmun) kliklənə bilər.
            >
              {post.image && (
                <div className="relative"> {/* Şəkil üçün relative konteyner */}
                  <img
                    src={`/blog/${post.image}`}
                    alt={post.title}
                    className="w-full h-60 object-cover cursor-pointer"
                    onClick={() => router.push(`/post/${post.id}`)}
                  />
                  {/* Silmə düyməsi */}
                  {user?.id === post.author.id && ( // Yalnız postun müəllifi görsün
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Şəkilin click hadisəsinin işə düşməsini dayandırır
                        handleDeletePost(post.id);
                      }}
                      className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg z-10 transition-transform transform hover:scale-110"
                      aria-label="Postu sil" // Ekran oxuyucular üçün əlçatanlıq
                    >
                      <X className="w-5 h-5" /> {/* 'X' ikonu */}
                    </button>
                  )}
                </div>
              )}

              <div className="p-5 flex flex-col gap-3">
                {/* Top Bar */}
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

                {/* Title */}
                <h2
                  className="text-xl font-semibold text-gray-800 hover:underline cursor-pointer"
                  onClick={() => router.push(`/post/${post.id}`)}
                >
                  {post.title}
                </h2>

                {/* Content */}
                <p
                  className="text-gray-600 text-sm cursor-pointer"
                  onClick={() => router.push(`/post/${post.id}`)}
                >
                  {post?.content?.length > 100
                    ? post.content.slice(0, 100) + "..."
                    : post.content}
                </p>

                {/* Footer */}
                <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
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

                  <div className="flex gap-3 items-center">
                    <LikeButton
                      postId={post.id}
                      likes={post.likes}
                      currentUserId={user?.id}
                    />
                    <button
                      onClick={() => setActiveCommentPostId(post.id)}
                      className="hover:text-blue-600 transition cursor-pointer flex items-center gap-1 text-black"
                    >
                      💬  {post?.comments?.reduce(
                        (sum, comment) => sum + 1 + (comment.replies?.length || 0),
                        0
                      )
                      }
                    </button>
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
        </div>
        {showEditModal && (
          <div
            className="fixed inset-0 backdrop-blur-sm bg-opacity-40 flex items-center justify-center z-50"
            onClick={() => setShowEditModal(false)}
          >
            <div
              className="bg-white p-6 rounded w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await fetch(`/api/user/${user.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                  });

                  const data = await res.json();
                  if (res.ok) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                    setUser(data.user);
                    notifySuccess("Profil uğurla yeniləndi! ✅");
                    setShowEditModal(false);
                  } else {
                    notifyError(data.error || "Xəta baş verdi ❌");
                  }
                }}
                className="space-y-4"
              >
                {(["username", "name", "surname", "email"] as Array<keyof typeof formData>).map((field) => (
                  <div key={field}>
                    <label className="block font-medium capitalize">{field}</label>
                    <input
                      type="text"
                      value={formData[field]}
                      onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>
                ))}
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border rounded"
                  >
                    İmtina
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Yadda saxla
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 b flex justify-center items-center z-50 backdrop-blur-sm"
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
                  onChange={(e) => setFile(e.target?.files ? e.target?.files[0] : null)}
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
      <Toaster />
    </div>
  );
}
