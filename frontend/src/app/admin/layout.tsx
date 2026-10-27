import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAuthenticated = await verifyAdminSession();

  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
