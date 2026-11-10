"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

type Props = {
  role: "ADMIN" | "ORGANIZER";
  username: string;
};

export default function DashboardHeader({ role, username }: Props) {
  const pathname = usePathname();

  const basePath = role === "ADMIN" ? "/admin" : "/organizer";

  const isEventDetails = new RegExp(`^${basePath}/events/[^/]+/?$`).test(
    pathname,
  );

  const links =
    role === "ADMIN"
      ? [
          { label: "Events", href: "/admin" },
          { label: "Users Management", href: "/admin/users" },
        ]
      : [];

  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
        <div className="flex flex-wrap items-center gap-8">
          <Link
            href={basePath}
            className="text-sm font-bold tracking-widest text-blue-400"
          >
            EVENTFLOW
          </Link>

          {isEventDetails ? (
            <Link
              href={basePath}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              ← Back to Events
            </Link>
          ) : role === "ADMIN" ? (
            <nav
              aria-label="Admin navigation"
              className="flex flex-wrap items-center gap-2"
            >
              {links.map((link) => {
                const isActive =
                  link.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === link.href ||
                      pathname.startsWith(`${link.href}/`);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-semibold text-blue-400">
              {username.charAt(0).toUpperCase()}
            </span>

            <span className="text-sm font-medium text-slate-300">
              {username}
            </span>
          </div>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
