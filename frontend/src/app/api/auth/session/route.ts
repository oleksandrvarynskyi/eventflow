import { NextResponse } from "next/server";

import { getUserSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUserSession();

  return NextResponse.json(
    {
      authenticated: Boolean(user),
      user,
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}
