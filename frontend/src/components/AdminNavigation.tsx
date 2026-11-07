"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import LogoutButton from "@/components/LogoutButton";

export default function AdminNavigation() {
  const pathname = usePathname();

  const links = [
    { label: "Dashboard", href: "/admin" },
    { label: "Users Management", href: "/admin/users" },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
        <div className="flex flex-wrap items-center gap-8">
          <Link
            href="/admin"
            className="text-sm font-bold tracking-widest text-blue-400"
          >
            EVENTFLOW
          </Link>

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
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-semibold text-blue-400">
              A
            </span>

            <span className="text-sm font-medium text-slate-300">admin</span>
          </div>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
