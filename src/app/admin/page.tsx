'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Stats {
  posts: number;
  users: number;
  comments: number;
}

interface StatCardProps {
  title: string;
  count: number;
  onClick: () => void;
}

function StatCard({ title, count, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className="p-4 bg-white rounded-2xl shadow cursor-pointer hover:shadow-lg transition"
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
    >
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="text-3xl mt-2">{count}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const router=useRouter()

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => {
        if (!res.ok) throw new Error('Xəta baş verdi');
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Yüklənir...</div>;
  if (!stats) return <div>Statistika mövcud deyil</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="Posts"
        count={stats.posts}
        onClick={() => router.push('/admin/posts')}
      />
      <StatCard
        title="Users"
        count={stats.users}
        onClick={() => router.push('/admin/users')}
      />
      <StatCard
        title="Comments"
        count={stats.comments}
        onClick={() => router.push('/admin/comments')}
      />
    </div>
  );
}
