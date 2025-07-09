"use client";
import Link from 'next/link';
import {useRouter} from 'next/navigation'
import { Home, FileText, Users, LogOut,MessageSquare  } from 'lucide-react';
import { notifySuccess } from '@/app/lib/toast/toasthelper';

export default function Sidebar() {
  const router=useRouter()
    const handleLogout = async () => {
      try {
        const res = await fetch("/api/auth/logout", { method: "POST" });
        if (res.ok) {
          localStorage.removeItem("user");
          router.push("/login");
          notifySuccess("Çıxış Olundu!🎉");
        } else {
          alert("Çıxış zamanı xəta baş verdi.");
        }
      } catch (error) {
        console.error("Çıxış zamanı xəta:", error);
      }
    };
  const links = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/posts', label: 'Posts', icon: FileText },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/comments', label: 'Comments', icon: MessageSquare },

  ];
  return (
    <aside  className="w-64 bg-white border-r shadow-sm">
      <div className="p-6 font-bold text-xl">Admin Panel</div>
      <nav className="flex flex-col space-y-1 px-4">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            <Icon  />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-auto p-4">
        <button onClick={handleLogout} className="w-full flex items-center space-x-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg">
          <LogOut  className="w-5 h-5" /> <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}