"use client";

import { useEffect, useState } from "react";

type Comment = {
  id: number;
  content: string;
  author: {
    username: string;
  };
  createdAt: string;
};

export default function CommentSection({ postId ,fetchFollowedPosts}: { postId: number,fetchFollowedPosts:()=>void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchComments() {
    try {
      const res = await fetch(`/api/comment/${postId}`);
      const data = await res.json();
      setComments(data.comments);
    } catch (error) {
      console.error("Şərhlər yüklənərkən xəta baş verdi", error);
    }
  }

  useEffect(() => {
    fetchComments();
  }, []);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    try {
      const res = await fetch(`/api/comment/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          userId: user.id,   // burda userId olmalı
        }),
      });

      if (res.ok) {
        setNewComment("");
        fetchComments(); // yenidən yüklə
        fetchFollowedPosts()
      } else {
        alert("Şərh göndərilə bilmədi.");
      }
    } catch {
      alert("Xəta baş verdi.");
    }
    setLoading(false);
  }


  return (
    <div className="mt-6 border-t pt-4 relative h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-28">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Şərhlər</h3>

        {comments.length === 0 ? (
          <p className="text-gray-500">Şərh yoxdur.</p>
        ) : (
          <ul className="space-y-4">
            {comments?.map((comment) => (
              <li key={comment.id} className="bg-gray-100 p-3 rounded">
                <div className="text-sm text-gray-700">{comment.content}</div>
                <div className="text-xs text-gray-500 mt-1">
                  👤 {comment.author.username} |{" "}
                  {new Date(comment.createdAt).toLocaleDateString("az-AZ")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="absolute bottom-0 left-0 w-full border-t bg-white p-8 flex gap-2"
      >
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Şərh yaz..."
          className="flex-1 border px-3 py-2 rounded-md text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          Göndər
        </button>
      </form>
    </div>


  );
}