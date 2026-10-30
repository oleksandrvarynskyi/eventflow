import { NextRequest, NextResponse } from "next/server";

import { getUserSession, getBackendAuthorization } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const user = await getUserSession();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (
    user.role !== "ADMIN" &&
    user.role !== "RECEPTION" &&
    user.role !== "ORGANIZER"
  ) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { eventId } = await context.params;

  if (!/^[1-9]\d*$/.test(eventId)) {
    return NextResponse.json({ message: "Invalid event ID" }, { status: 400 });
  }

  const authorization = await getBackendAuthorization();

  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Backend is not configured" },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      `${backendUrl}/events/${eventId}/reception/attendees`,
      {
        headers: {
          Authorization: authorization,
        },
        cache: "no-store",
      },
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Backend unavailable" },
      { status: 502 },
    );
  }
}
