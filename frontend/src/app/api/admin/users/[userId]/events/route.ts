import { NextRequest, NextResponse } from "next/server";
import { getUserSession, getBackendAuthorization } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await getUserSession();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const authorization = await getBackendAuthorization();

  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Backend URL is not configured" },
      { status: 500 },
    );
  }

  const { userId } = await context.params;

  if (!/^[1-9]\d*$/.test(userId)) {
    return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("eventIds" in body) ||
    !Array.isArray(body.eventIds) ||
    body.eventIds.some(
      (id: unknown) => !Number.isSafeInteger(id) || Number(id) <= 0,
    ) ||
    new Set(body.eventIds).size !== body.eventIds.length
  ) {
    return NextResponse.json({ message: "Invalid event IDs" }, { status: 400 });
  }

  try {
    const response = await fetch(`${backendUrl}/users/${userId}/events`, {
      method: "PATCH",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventIds: body.eventIds }),
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to update event assignments" },
      { status: 502 },
    );
  }
}
