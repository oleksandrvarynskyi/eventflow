import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createReceptionSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("password" in body) ||
      typeof body.password !== "string"
    ) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    const password = body.password;

    if (!password || password.length > 1024) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const passwordHash = process.env.RECEPTION_PASSWORD_HASH;

    if (!passwordHash) {
      console.error("RECEPTION_PASSWORD_HASH is not configured");

      return NextResponse.json(
        { message: "Authentication is not configured" },
        { status: 500 },
      );
    }

    const isValid = await bcrypt.compare(password, passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    await createReceptionSession();

    return NextResponse.json({
      success: true,
      message: "Reception login successful",
    });
  } catch (error) {
    console.error("Reception login failed:", error);

    return NextResponse.json(
      { message: "Unable to process login" },
      { status: 500 },
    );
  }
}
