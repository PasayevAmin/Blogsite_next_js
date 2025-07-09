'use client';

import { useEffect, useState } from 'react';
import Table, { Column } from '@/app/components/admin/Table';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: {
    username: string;
  };
  post:{
    title:string;
  }
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    fetch('/api/admin/comment')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.comments)) {
          setComments(data.comments);
        } else {
          console.error("API-dən massiv gəlmədi:", data);
          setComments([]);
        }
      });
  }, []);

  const columns: Column<Comment>[] = [
    { key: 'content', label: 'Content' },
    { key: 'post', label: 'Post',render:(comment)=>comment.post.title },

    { key: 'author', label: 'Author', render: (comment) => comment.author.username },
    { key: 'createdAt', label: 'Created At' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Manage Posts</h1>
        <a href="/admin/posts/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          New Post
        </a>
      </div>
      <Table data={comments} columns={columns} />
    </div>
  );
}
