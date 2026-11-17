import { connection } from "next/server";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import AdminShell from "@/app/components/admin/AdminShell";
async function Protected({ children }: { children: React.ReactNode }) {
  await connection();
  try {
    await requireAdmin();
  } catch {
    redirect("/login?next=/admin");
  }
  return <AdminShell>{children}</AdminShell>;
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8">Verificando acceso…</p>}>
      <Protected>{children}</Protected>
    </Suspense>
  );
}
