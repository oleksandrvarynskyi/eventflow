"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Скрываем интерфейс предыдущего пользователя
      // после успешного удаления сессии.
      document.body.style.visibility = "hidden";

      // Полная навигация сбрасывает React-состояние.
      window.location.replace("/");
    } catch (error) {
      console.error("Logout error:", error);

      document.body.style.visibility = "";
      setLoggingOut(false);

      alert("Failed to log out. Please try again.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      aria-label="Log out"
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-blue-500 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>

      <span>{loggingOut ? "Logging out..." : "Logout"}</span>
    </button>
  );
}
