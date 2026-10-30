import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "eventflow_session";

export type UserRole = "ADMIN" | "ORGANIZER" | "RECEPTION";

export type SessionUser = {
  id: number;
  username: string;
  role: UserRole;
};

function getSessionSecret(): Uint8Array {
  const secret = process.env.USER_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("USER_SESSION_SECRET must be at least 32 characters");
  }

  return new TextEncoder().encode(secret);
}

export async function createUserSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
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

export async function getUserSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
    });

    const id = Number(payload.sub);
    const username = payload.username;
    const role = payload.role;

    if (
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      typeof username !== "string" ||
      !["ADMIN", "ORGANIZER", "RECEPTION"].includes(role as string)
    ) {
      return null;
    }

    return {
      id,
      username,
      role: role as UserRole,
    };
  } catch {
    return null;
  }
}

export async function deleteUserSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getBackendAuthorization(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const user = await getUserSession();

  if (!user) {
    return null;
  }

  return `Bearer ${token}`;
}
