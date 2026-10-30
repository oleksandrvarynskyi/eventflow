import { NextResponse } from "next/server";
import { getUserSession, getBackendAuthorization } from "@/lib/auth";

export async function GET() {
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
    const response = await fetch(`${backendUrl}/events`, {
      headers: {
        Authorization: authorization,
      },
      cache: "no-store",
    });

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
