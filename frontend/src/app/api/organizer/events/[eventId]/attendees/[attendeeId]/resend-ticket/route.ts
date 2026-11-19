import { NextResponse } from "next/server";
import { getUserSession, getBackendAuthorization } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    eventId: string;
    attendeeId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await getUserSession();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "ORGANIZER") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { eventId, attendeeId } = await context.params;

  if (!/^[1-9]\d*$/.test(eventId) || !/^[1-9]\d*$/.test(attendeeId)) {
    return NextResponse.json(
      { message: "Invalid event or attendee ID" },
      { status: 400 },
    );
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
      `${backendUrl}/events/${eventId}/attendees/${attendeeId}/resend-ticket`,
      {
        method: "POST",
        headers: { Authorization: authorization },
        cache: "no-store",
      },
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Failed to resend ticket:", error);

    return NextResponse.json(
      { message: "Unable to resend ticket" },
      { status: 502 },
    );
  }
}
