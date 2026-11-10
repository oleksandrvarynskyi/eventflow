import { NextResponse } from "next/server";
import { getUserSession, getBackendAuthorization } from "@/lib/auth";

export async function GET() {
  const user = await getUserSession();

  if (user?.role !== "ORGANIZER") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 },
    );
  }

  const authorization = await getBackendAuthorization();

  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
  } catch (error) {
    console.error("Failed to fetch organizer events:", error);

    return NextResponse.json(
      { message: "Unable to fetch events" },
      { status: 502 },
    );
  }
}
