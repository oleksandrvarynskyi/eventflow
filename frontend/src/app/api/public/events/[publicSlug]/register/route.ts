import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ publicSlug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { publicSlug } = await context.params;

  if (!/^[A-Za-z0-9_-]{24}$/.test(publicSlug)) {
    return NextResponse.json(
      { message: "Invalid registration link" },
      { status: 400 },
    );
  }

  const backendUrl = process.env.BACKEND_API_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 },
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
      `${backendUrl}/events/${publicSlug}/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Public registration failed:", error);

    return NextResponse.json(
      { message: "Unable to complete registration" },
      { status: 502 },
    );
  }
}
