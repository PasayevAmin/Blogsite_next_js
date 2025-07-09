'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const handleRedirectToPosts = () => router.push('/admin/posts');
  const handleRedirectToUsers = () => router.push('/admin/users');

  // Hazırki səhifə /admin/posts-dursa, "Postlara keç" düyməsini gizlət, "İstifadəçilərə keç" göstər.
  // /admin/users-dursa tərsinə.

  const isOnPostsPage = pathname === '/admin/posts';
  const isOnUsersPage = pathname === '/admin/users';

  return (
    <header className="flex justify-between items-center p-4 bg-white border-b shadow-sm">
      <h1 className="text-2xl font-semibold capitalize">
        {pathname === '/admin' || pathname === '/admin/' ? 'Dashboard' : pathname.substring(1)}
      </h1>
      <div className="space-x-4">
        {!isOnPostsPage && (
          <button
            onClick={handleRedirectToPosts}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Postlara keç
          </button>
        )}
        {!isOnUsersPage && (
          <button
            onClick={handleRedirectToUsers}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            İstifadəçilərə keç
          </button>
        )}
      </div>
    </header>
  );
}
