'use client';

import { useEffect, useState } from 'react';
import Table, { Column } from '@/app/components/admin/Table';
import { useRouter } from "next/navigation";

import { notifyError, notifySuccess } from '@/app/lib/toast/toasthelper';

interface Post {
  id: number;
  title: string;
  image: string
  createdAt: string;
  author: {
    username: string;
  };
}
type Tag = {
  id: number;
  label: string;
};
export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<any>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const router = useRouter()

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!storedUser?.id) {
      router.push("/login");
    } else {
      setUser(storedUser);
      fetchTags();



    }
  }, []);
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
  useEffect(() => {
    fetch('/api/post')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.posts)) {
          setPosts(data.posts);
        } else {
          console.error("API-dən massiv gəlmədi:", data);
          setPosts([]);
        }
      });
  }, []);

  const columns: Column<Post>[] = [
    {
      key: 'image',
      label: 'Image',
      render: (post) => (
        <img
          src={`/blog/${post.image}`}
          alt={post.title}
          className="w-16 h-16 object-cover rounded"
        />
      )
    },
    { key: 'title', label: 'Title' },
    { key: 'author', label: 'Author', render: (post) => post.author.username },

    { key: 'createdAt', label: 'Created At' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Manage Posts</h1>
        <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          New Post
        </button>
      </div>
      <Table data={posts} columns={columns} onDelete={handleDeletePost} />
      {
        showCreateModal && (
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
                  {file ? (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected file: <span className="font-medium">{file.name}</span>
                    </p>
                  ) : null}
                </div>


                <div>
                  <label className="block mb-1 font-semibold">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {allTags?.map((tag) => (
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
        )
      }
    </div>

  );
}
