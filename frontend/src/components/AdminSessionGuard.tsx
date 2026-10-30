"use client";

import { useEffect, useState } from "react";

type Props = {
  userId: number;
  children: React.ReactNode;
};

export default function AdminSessionGuard({ userId, children }: Props) {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      if (active) {
        setAuthorized(false);
      }

      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Session verification failed");
        }

        const data = await response.json();

        const valid =
          data.authenticated === true &&
          data.user?.role === "ADMIN" &&
          data.user?.id === userId;

        if (!valid) {
          window.location.replace("/");
          return;
        }

        if (active) {
          setAuthorized(true);
        }
      } catch {
        window.location.replace("/");
      }
    }

    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        void verifySession();
      }
    }

    function handleFocus() {
      void verifySession();
    }

    void verifySession();

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handleFocus);

    return () => {
      active = false;

      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handleFocus);
    };
  }, [userId]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">
        Verifying session...
      </div>
    );
  }

  return <>{children}</>;
}
