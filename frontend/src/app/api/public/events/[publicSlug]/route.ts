import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ publicSlug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
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

  try {
    const response = await fetch(`${backendUrl}/events/${publicSlug}/public`, {
      cache: "no-store",
    });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Failed to load public event:", error);

    return NextResponse.json(
      { message: "Unable to load event" },
      { status: 502 },
    );
  }
}
