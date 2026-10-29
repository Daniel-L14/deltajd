import AdminSidebar from '@/app/components/admin/layout/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
