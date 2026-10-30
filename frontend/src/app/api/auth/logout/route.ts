import { NextResponse } from "next/server";
import { deleteUserSession } from "@/lib/auth";

export async function POST() {
  await deleteUserSession();

  return NextResponse.json({
    success: true,
  });
}
