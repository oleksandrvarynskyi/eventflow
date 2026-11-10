import { redirect } from "next/navigation";

import { getUserSession } from "@/lib/auth";
import DashboardHeader from "@/components/DashboardHeader";

export const dynamic = "force-dynamic";

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserSession();

  if (!user) {
    redirect("/");
  }

  if (user.role !== "ORGANIZER") {
    redirect(user.role === "ADMIN" ? "/admin" : "/reception");
  }

  return (
    <>
      <DashboardHeader role="ORGANIZER" username={user.username} />
      {children}
    </>
  );
}
