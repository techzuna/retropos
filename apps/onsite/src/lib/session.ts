import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";
import { resolveDb, type OrgContext } from "./db";
import { PosError } from "@restro/domain/errors";
import { roleAtLeast, type Role, ROLES } from "@restro/domain/constants";

const COOKIE_NAME = "rr_session";
const SESSION_DAYS = 365;

/**
 * Two independent things live in one cookie, and keeping them separate is the
 * whole point:
 *
 * - **Device pairing** (`orgId` + `outletId`) — which outlet this tablet belongs
 *   to. Set once by an owner or manager with their password, and kept for a year.
 *   Only an explicit "unpair" (manager+) clears it.
 * - **Acting user** (`userId`) — who is currently on the floor. Set and cleared
 *   by PIN, dozens of times a shift.
 *
 * Signing out drops only the acting user, so the tablet returns to its own PIN
 * screen and the next staff member signs straight in. If sign-out unpaired the
 * device, a waiter tapping it mid-service would strand the till until someone
 * with a password walked over.
 */
/**
 * The device's outlet, plus the database handle that outlet's data lives in
 * (see `Db` in db.ts for why the handle travels on the context).
 */
export interface DeviceContext extends OrgContext {
  outletId: string;
}

export interface SessionContext extends DeviceContext {
  userId: string;
  role: Role;
  userName: string;
}

/** Ids only — what actually travels in the cookie; never a database handle. */
export interface CookieTenancy {
  orgId: string;
  outletId: string;
  userId?: string;
}

type CookiePayload = CookieTenancy;

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(s);
}

async function writeCookie(payload: CookiePayload): Promise<void> {
  const jwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
  (await cookies()).set(COOKIE_NAME, jwt, {
    httpOnly: true,
    sameSite: "lax",
    // LAN deployments are plain http; only require https when APP_URL says so.
    secure: (process.env.APP_URL ?? "").startsWith("https://"),
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

/** Pair this device to an outlet and (optionally) start acting as a user. */
export async function writeSessionCookie(data: CookieTenancy): Promise<void> {
  await writeCookie(data);
}

/** Sign the current user out but keep the device paired to its outlet. */
export async function clearActingUser(): Promise<void> {
  const device = await readCookie();
  if (!device) return;
  await writeCookie({ orgId: device.orgId, outletId: device.outletId });
}

/** Forget the outlet entirely — the device needs a password to be paired again. */
export async function unpairDevice(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

async function readCookie(): Promise<CookiePayload | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const { orgId, outletId, userId } = payload as Record<string, unknown>;
    if (typeof orgId !== "string" || typeof outletId !== "string") return null;
    return { orgId, outletId, ...(typeof userId === "string" ? { userId } : {}) };
  } catch {
    return null;
  }
}

/**
 * The outlet this device is paired to, whether or not anyone is signed in.
 * Validated against the database so a deleted or deactivated outlet can't
 * keep a stale tablet alive. Cached per request.
 */
export const getDevice = cache(async (): Promise<DeviceContext | null> => {
  const payload = await readCookie();
  if (!payload) return null;
  const db = await resolveDb();
  const outlet = await db.outlet.findFirst({
    where: { id: payload.outletId, organizationId: payload.orgId, active: true },
    select: { id: true },
  });
  if (!outlet) return null;
  return { db, orgId: payload.orgId, outletId: payload.outletId };
});

export async function requireDevice(): Promise<DeviceContext> {
  const device = await getDevice();
  if (!device) throw new PosError("FORBIDDEN", "This device isn't set up for an outlet yet.");
  return device;
}

/**
 * Resolve and validate the acting user against the database — they must still
 * exist, be active, belong to the paired organization, and (unless owner) to
 * the paired outlet. Deactivating a user therefore locks them out on their
 * next request, not their next sign-in. Cached per request.
 */
export const getSession = cache(async (): Promise<SessionContext | null> => {
  const [payload, device] = await Promise.all([readCookie(), getDevice()]);
  if (!payload?.userId || !device) return null;
  const user = await device.db.user.findUnique({
    where: { id: payload.userId },
    select: { organizationId: true, outletId: true, role: true, active: true, name: true },
  });
  if (!user || !user.active || user.organizationId !== device.orgId) return null;
  if (!ROLES.includes(user.role as Role)) return null;
  if (user.role !== "owner" && user.outletId !== device.outletId) return null;
  return { ...device, userId: payload.userId, role: user.role as Role, userName: user.name };
});

export async function requireSession(): Promise<SessionContext> {
  const session = await getSession();
  if (!session) throw new PosError("FORBIDDEN", "Sign in to continue.");
  return session;
}

export async function requireRole(required: Role): Promise<SessionContext> {
  const session = await requireSession();
  if (!roleAtLeast(session.role, required)) {
    throw new PosError("FORBIDDEN", "You don't have access to that.");
  }
  return session;
}
