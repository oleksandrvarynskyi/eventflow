import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const isAuthenticated = await verifyAdminSession();

  if (!isAuthenticated) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_URL;
  const adminApiKey = process.env.ADMIN_API_KEY;

  if (!backendUrl || !adminApiKey) {
    console.error("Backend API configuration is missing");

    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(`${backendUrl}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminApiKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Failed to create event:", error);

    return NextResponse.json(
      { message: "Unable to create event" },
      { status: 502 },
    );
  }
}

export async function GET() {
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

  try {
    const response = await fetch(`${backendUrl}/events`, {
      headers: {
        "x-admin-key": adminApiKey,
      },
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Failed to fetch events:", error);

    return NextResponse.json(
      { message: "Unable to fetch events" },
      { status: 502 },
    );
  }
}
