import { NextResponse } from "next/server";
import { getUserSession, getBackendAuthorization } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getUserSession();

  if (user?.role !== "ADMIN") {
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
  const parsedEventId = Number(eventId);

  if (!Number.isSafeInteger(parsedEventId) || parsedEventId <= 0) {
    return NextResponse.json({ message: "Invalid event ID" }, { status: 400 });
  }

  const authorization = await getBackendAuthorization();

  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  try {
    const response = await fetch(`${backendUrl}/events/${parsedEventId}`, {
      method: "PATCH",
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
    console.error("Failed to update event:", error);

    return NextResponse.json(
      { message: "Unable to update event" },
      { status: 502 },
    );
  }
}
