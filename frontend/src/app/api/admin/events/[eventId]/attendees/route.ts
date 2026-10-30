import { NextResponse } from "next/server";
import { getUserSession, getBackendAuthorization } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getUserSession();
  const isAuthenticated = user?.role === "ADMIN" || user?.role === "ORGANIZER";

  if (!isAuthenticated) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 },
    );
  }

  const { eventId } = await context.params;

  if (!/^[1-9]\d*$/.test(eventId)) {
    return NextResponse.json({ message: "Invalid event ID" }, { status: 400 });
  }

  const authorization = await getBackendAuthorization();

  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const response = await fetch(`${backendUrl}/events/${eventId}/attendees`, {
      headers: {
        Authorization: authorization,
      },
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Failed to fetch attendees:", error);

    return NextResponse.json(
      { message: "Unable to fetch attendees" },
      { status: 502 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getUserSession();
  const isAuthenticated = user?.role === "ADMIN" || user?.role === "ORGANIZER";

  if (!isAuthenticated) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 },
    );
  }

  const { eventId } = await context.params;

  if (!/^[1-9]\d*$/.test(eventId)) {
    return NextResponse.json({ message: "Invalid event ID" }, { status: 400 });
  }

  try {
    const body = await request.json();

    const authorization = await getBackendAuthorization();

    if (!authorization) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${backendUrl}/events/${eventId}/attendees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Failed to create attendee:", error);

    return NextResponse.json(
      { message: "Unable to create attendee" },
      { status: 502 },
    );
  }
}
