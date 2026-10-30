import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserSession();

  if (!user) {
    redirect("/");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return <>{children}</>;
}
