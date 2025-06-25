"use client";

import { useEffect, useState } from "react";

interface Reply {
  id: number;
  content: string;
  author: { id: number; username: string };
  createdAt: string;
}

type Comment = {
  id: number;
  content: string;
  author: { id: number; username: string };
  createdAt: string;
  replies?: Reply[];
};

export default function CommentSection({
  postId,
  fetchFollowedPosts,
}: {
  postId: number;
  fetchFollowedPosts: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newReplyContent, setNewReplyContent] = useState<{ [key: number]: string }>({});
  const [showReplies, setShowReplies] = useState<{ [key: number]: boolean }>({});
  const [showReplyInput, setShowReplyInput] = useState<{ [key: number]: boolean }>({});
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
        body: JSON.stringify({ content: newComment, userId: user.id }),
      });

      if (res.ok) {
        setNewComment("");
        fetchComments();
        fetchFollowedPosts();
      } else {
        alert("Şərh göndərilə bilmədi.");
      }
    } catch {
      alert("Xəta baş verdi.");
    }
    setLoading(false);
  }

  async function handleReplySubmit(commentId: number) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const content = newReplyContent[commentId];

    if (!content?.trim()) return;

    const res = await fetch(`/api/reply/${commentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, userId: user.id }),
    });

    if (res.ok) {
      const data = await res.json();
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
              ...comment,
              replies: [...(comment.replies || []), data.reply],
            }
            : comment
        )
      );
      setNewReplyContent((prev) => ({ ...prev, [commentId]: "" }));
      fetchFollowedPosts();
    }
  }

  return (
    <div className="mt-6 border-t pt-4 relative h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-28">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Şərhlər</h3>

        {comments === null && (
          <p className="text-gray-500">Şərh yoxdur.</p>
        )}
        <ul className="space-y-4">
          {comments.map((comment) => {
            const replyCount = comment.replies?.length || 0;
            const isRepliesShown = showReplies[comment.id] || false;
            const isReplyInputShown = showReplyInput[comment.id] || false;

            return (
              <li key={comment.id} className="bg-gray-100 p-3 rounded">
                <div className="text-sm text-gray-700 mb-1">{comment.content}</div>

                <div className="text-xs text-gray-500 flex justify-between items-center">
                  <span>
                    👤 {comment.author.username} |{" "}
                    {new Date(comment.createdAt).toLocaleDateString("az-AZ")}
                  </span>

                  <button
                    onClick={() =>
                      setShowReplyInput((prev) => ({
                        ...prev,
                        [comment.id]: !prev[comment.id],
                      }))
                    }
                    className="text-blue-600 text-xs hover:underline"
                  >
                    📝 Cavab yaz
                  </button>
                </div>

                {replyCount > 0 && (
                  <button
                    onClick={() =>
                      setShowReplies((prev) => ({
                        ...prev,
                        [comment.id]: !prev[comment.id],
                      }))
                    }
                    className="text-blue-600 text-xs ml-1 mt-2 hover:underline"
                  >
                    {isRepliesShown ? "Cavabları gizlət" : `${replyCount} cavabı göstər`}
                  </button>
                )}

                {isRepliesShown && comment.replies && (
                  <div className="ml-4 mt-2 space-y-1">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="text-sm text-gray-600">
                        ↳ <strong>{reply.author.username}</strong>: {reply.content}
                      </div>
                    ))}
                  </div>
                )}

                {isReplyInputShown && (
                  <div className="mt-2 ml-4 flex gap-2">
                    <input
                      type="text"
                      value={newReplyContent[comment.id] || ""}
                      onChange={(e) =>
                        setNewReplyContent((prev) => ({
                          ...prev,
                          [comment.id]: e.target.value,
                        }))
                      }
                      placeholder="Cavab yaz..."
                      className="flex-1 border px-2 py-1 rounded-md text-sm"
                    />
                    <button
                      onClick={() => handleReplySubmit(comment.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                    >
                      Göndər
                    </button>
                  </div>
                )}
              </li>
            );
          })}
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
        </ul>
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
