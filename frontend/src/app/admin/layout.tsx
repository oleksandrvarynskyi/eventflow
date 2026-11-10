import { redirect } from "next/navigation";

import { getUserSession } from "@/lib/auth";
import AdminSessionGuard from "@/components/AdminSessionGuard";
import DashboardHeader from "@/components/DashboardHeader";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserSession();

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <AdminSessionGuard userId={user.id}>
      <DashboardHeader role="ADMIN" username={user.username} />
      {children}
    </AdminSessionGuard>
  );
}
