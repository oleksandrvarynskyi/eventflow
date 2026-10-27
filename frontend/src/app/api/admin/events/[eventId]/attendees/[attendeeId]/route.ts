import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    eventId: string;
    attendeeId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const isAuthenticated = await verifyAdminSession();

  if (!isAuthenticated) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_URL;
  const adminApiKey = process.env.ADMIN_API_KEY;

  if (!backendUrl || !adminApiKey) {
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 },
    );
  }

  const { eventId, attendeeId } = await context.params;

  if (!/^[1-9]\d*$/.test(eventId) || !/^[1-9]\d*$/.test(attendeeId)) {
    return NextResponse.json(
      { message: "Invalid event or attendee ID" },
      { status: 400 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${backendUrl}/events/${eventId}/attendees/${attendeeId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminApiKey,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Failed to update attendee:", error);

    return NextResponse.json(
      { message: "Unable to update attendee" },
      { status: 502 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const isAuthenticated = await verifyAdminSession();

  if (!isAuthenticated) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_URL;
  const adminApiKey = process.env.ADMIN_API_KEY;

  if (!backendUrl || !adminApiKey) {
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 },
    );
  }

  const { eventId, attendeeId } = await context.params;

  if (!/^[1-9]\d*$/.test(eventId) || !/^[1-9]\d*$/.test(attendeeId)) {
    return NextResponse.json(
      { message: "Invalid event or attendee ID" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${backendUrl}/events/${eventId}/attendees/${attendeeId}`,
      {
        method: "DELETE",
        headers: {
          "x-admin-key": adminApiKey,
        },
        cache: "no-store",
      },
    );

    if (response.status === 204) {
      return new Response(null, { status: 204 });
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Failed to delete attendee:", error);

    return NextResponse.json(
      { message: "Unable to delete attendee" },
      { status: 502 },
    );
  }
}
