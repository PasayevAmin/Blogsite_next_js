'use client';
import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation"
import Table, { Column } from '@/app/components/admin/Table';
import Link from 'next/link';

interface User { id: number; coverImage: string, name: string; surname: string; username: string; age: number; role: string; email: string; createdAt: string; }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter()
  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(json => {
        if (Array.isArray(json.users)) {
          setUsers(json.users);
        } else {
          console.error("API-dən massiv gəlmədi:", json);
          setUsers([]);
        }
      });
  }, []);
  const columns: Column<User>[] = [
    {
      key: 'coverImage',
      label: 'Image',
      render: (user) => (
        <img
          src={`/uploads/${user.coverImage}`}
          alt={user.username}
          className="w-24 h-16 object-cover rounded-full"
        />

      )
    },
    { key: 'name', label: 'Name' },
    { key: 'surname', label: 'Surname' },
    { key: 'username', label: 'Username', render: (user) => (
      <Link href={`/admin/posts/${user.id}`} className='text-black-600 hover:underline hover:text-blue-600'>
        {user.username}
      </Link>
    )
  },
    { key: 'age', label: 'Age' },
    { key: 'role', label: 'Role' },
    { key: 'email', label: 'Email' },
    { key: 'createdAt', label: 'Created At' },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Manage Users</h1>
        <button onClick={() => router.push("/register")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          New User
        </button>
      </div>
      <Table data={users} columns={columns} />
    </div>
  );
}
