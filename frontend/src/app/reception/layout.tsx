import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth";

export default async function ReceptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserSession();

  if (!user) {
    redirect("/");
  }

  if (user.role !== "ADMIN" && user.role !== "RECEPTION") {
    redirect("/");
  }

  return <>{children}</>;
}
