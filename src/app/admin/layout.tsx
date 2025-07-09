import Sidebar from '@/app/components/admin/Sidebar';
import Header from '@/app/components/admin/Header';

export const metadata = {
  title: 'Admin Panel',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}