import { redirect } from "next/navigation";

import { getUserSession } from "@/lib/auth";
import ReceptionSessionGuard from "@/components/ReceptionSessionGuard";

export const dynamic = "force-dynamic";

export default async function ReceptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserSession();

  if (!user) {
    redirect("/");
  }

  if (
    user.role !== "ADMIN" &&
    user.role !== "ORGANIZER" &&
    user.role !== "RECEPTION"
  ) {
    redirect("/");
  }

  return (
    <ReceptionSessionGuard userId={user.id}>{children}</ReceptionSessionGuard>
  );
}
