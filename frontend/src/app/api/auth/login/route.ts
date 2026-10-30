import { NextRequest, NextResponse } from "next/server";
import { createUserSession, type SessionUser } from "@/lib/auth";

type BackendLoginResponse = {
  success: boolean;
  user: SessionUser;
};

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("username" in body) ||
      !("password" in body) ||
      typeof body.username !== "string" ||
      typeof body.password !== "string" ||
      !body.username.trim() ||
      !body.password ||
      body.username.length > 100 ||
      body.password.length > 1024
    ) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const backendUrl = process.env.BACKEND_API_URL;

    if (!backendUrl) {
      return NextResponse.json(
        { message: "Backend is not configured" },
        { status: 500 },
      );
    }

    const response = await fetch(`${backendUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: body.username.trim(),
        password: body.password,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 401) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 },
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: "Authentication service unavailable" },
        { status: 502 },
      );
    }

    const data: BackendLoginResponse = await response.json();

    if (
      data.success !== true ||
      !data.user ||
      !Number.isSafeInteger(data.user.id) ||
      data.user.id <= 0 ||
      typeof data.user.username !== "string" ||
      !["ADMIN", "ORGANIZER", "RECEPTION"].includes(data.user.role)
    ) {
      return NextResponse.json(
        { message: "Invalid authentication response" },
        { status: 502 },
      );
    }

    await createUserSession(data.user);

    const redirectTo = {
      ADMIN: "/admin",
      ORGANIZER: "/organizer",
      RECEPTION: "/reception",
    }[data.user.role];

    return NextResponse.json({
      success: true,
      redirectTo,
    });
  } catch (error) {
    console.error("Authentication request failed:", error);

    return NextResponse.json(
      { message: "Authentication service unavailable" },
      { status: 503 },
    );
  }
}
