import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "eventflow_admin_session";

function getSessionSecret(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be at least 32 characters");
  }

  return new TextEncoder().encode(secret);
}

export async function createAdminSession(): Promise<void> {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSessionSecret());

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
    });

    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function deleteAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

const RECEPTION_COOKIE_NAME = "eventflow_reception_session";

function getReceptionSessionSecret(): Uint8Array {
  const secret = process.env.RECEPTION_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("RECEPTION_SESSION_SECRET must be at least 32 characters");
  }

  return new TextEncoder().encode(secret);
}

export async function createReceptionSession(): Promise<void> {
  const token = await new SignJWT({ role: "reception" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getReceptionSessionSecret());

  const cookieStore = await cookies();

  cookieStore.set(RECEPTION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function verifyReceptionSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(RECEPTION_COOKIE_NAME)?.value;

  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, getReceptionSessionSecret(), {
      algorithms: ["HS256"],
    });

    return payload.role === "reception";
  } catch {
    return false;
  }
}

export async function deleteReceptionSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(RECEPTION_COOKIE_NAME);
}
