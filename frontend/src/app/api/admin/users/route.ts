import { NextRequest, NextResponse } from "next/server";
import { getUserSession, getBackendAuthorization } from "@/lib/auth";

const backendUrl = process.env.BACKEND_API_URL;

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  const user = await getUserSession();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json(
      { message: "Forbidden" },
      {
        status: 403,
        headers: PRIVATE_HEADERS,
      },
    );
  }

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Backend URL is not configured" },
      {
        status: 500,
        headers: PRIVATE_HEADERS,
      },
    );
  }

  const authorization = await getBackendAuthorization();

  if (!authorization) {
    return NextResponse.json(
      { message: "Unauthorized" },
      {
        status: 401,
        headers: PRIVATE_HEADERS,
      },
    );
  }

  try {
    const response = await fetch(`${backendUrl}/users`, {
      headers: {
        Authorization: authorization,
      },
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: PRIVATE_HEADERS,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch users" },
      {
        status: 502,
        headers: PRIVATE_HEADERS,
      },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserSession();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Backend URL is not configured" },
      { status: 500 },
    );
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
    const response = await fetch(`${backendUrl}/users`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to create user" },
      { status: 502 },
    );
  }
}
