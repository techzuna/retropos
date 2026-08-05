import bcrypt from "bcryptjs";
import { resolveDb } from "./db";
import { PosError } from "./errors";
import { clearRateLimit, rateLimit } from "./rate-limit";
import { writeSessionCookie, type DeviceContext, type SessionContext } from "./session";
import { type Role, ROLES } from "./constants";

const BCRYPT_ROUNDS = 10;

// A 4-digit PIN is a 10,000-value keyspace, so the throttle that matters is
// the one keyed to the identity being attempted — no request header can
// rotate it. The per-client limits below are a bonus that only exists behind
// a trusted proxy (see clientKeyOf).
const PIN_PER_USER = { max: 10, windowMs: 15 * 60_000 };
const PIN_PER_CLIENT = { max: 8, windowMs: 5 * 60_000 };
const LOGIN_PER_EMAIL = { max: 10, windowMs: 10 * 60_000 };
const LOGIN_PER_CLIENT = { max: 20, windowMs: 10 * 60_000 };

const tooMany = () =>
  new PosError("RATE_LIMITED", "Too many attempts — try again in a few minutes.");

export function hashSecret(plain: string): string {
  return bcrypt.hashSync(plain, BCRYPT_ROUNDS);
}

/**
 * Email + password sign-in for owner/manager. This is also how a device gets
 * paired to an outlet — managers to their own, owners to `outletId` (or their
 * first). Staff never come through here; they use `signInWithPin` on a device
 * that is already paired.
 */
export async function loginWithPassword(
  email: string,
  password: string,
  clientKey: string | null,
  outletId?: string,
): Promise<{ orgId: string; outletId: string; userId: string; role: Role }> {
  const normalizedEmail = email.toLowerCase().trim();
  const emailKey = `login:email:${normalizedEmail}`;
  const clientLimitKey = clientKey ? `login:client:${clientKey}` : null;

  if (!rateLimit(emailKey, LOGIN_PER_EMAIL.max, LOGIN_PER_EMAIL.windowMs)) throw tooMany();
  if (clientLimitKey && !rateLimit(clientLimitKey, LOGIN_PER_CLIENT.max, LOGIN_PER_CLIENT.windowMs)) {
    throw tooMany();
  }

  // No context yet — this call is what establishes one. Hosted, the tenant is
  // already fixed by the request host, so the same resolver applies.
  const db = await resolveDb();
  const user = await db.user.findUnique({ where: { email: normalizedEmail } });
  const failed = new PosError("INVALID_CREDENTIALS", "Email or password is wrong.");
  if (!user || !user.active || !user.passwordHash) throw failed;
  // Async compare: the sync form blocks this single-process server for ~50ms
  // per attempt, which stalls every other tablet's orders during a burst.
  if (!(await bcrypt.compare(password, user.passwordHash))) throw failed;
  const role = user.role as Role;
  if (!ROLES.includes(role) || role === "staff") {
    // Staff act via PIN on an already-attached device, never by direct login.
    throw failed;
  }

  let attachOutletId: string;
  if (role === "owner") {
    const outlet = await db.outlet.findFirst({
      where: {
        organizationId: user.organizationId,
        active: true,
        ...(outletId ? { id: outletId } : {}),
      },
      orderBy: { name: "asc" },
      select: { id: true },
    });
    if (!outlet) throw new PosError("NOT_FOUND", "No such outlet in your organization.");
    attachOutletId = outlet.id;
  } else {
    if (!user.outletId) throw failed;
    attachOutletId = user.outletId;
  }

  clearRateLimit(emailKey, ...(clientLimitKey ? [clientLimitKey] : []));
  const session = { orgId: user.organizationId, outletId: attachOutletId, userId: user.id };
  await writeSessionCookie(session);
  return { ...session, role };
}

/**
 * Sign in by PIN on a paired device — used both for a cold start of a shift
 * and for handing the tablet to the next person. Only the device pairing is
 * required, not an existing user session, so staff never need a manager to
 * unlock the till.
 *
 * Scoped to this outlet's own staff and managers. Owners are deliberately NOT
 * reachable by PIN: a 4-digit code on a shared floor tablet must not unlock
 * user creation or a full backup export (every hash in the organization).
 * Owners step back in with their email and password at /login.
 */
export async function signInWithPin(
  current: DeviceContext,
  targetUserId: string,
  pin: string,
  clientKey: string | null,
): Promise<void> {
  const userKey = `pin:user:${targetUserId}`;
  const clientLimitKey = clientKey ? `pin:client:${clientKey}:${targetUserId}` : null;

  if (!rateLimit(userKey, PIN_PER_USER.max, PIN_PER_USER.windowMs)) {
    throw new PosError("RATE_LIMITED", "Too many PIN attempts — wait a few minutes.");
  }
  if (clientLimitKey && !rateLimit(clientLimitKey, PIN_PER_CLIENT.max, PIN_PER_CLIENT.windowMs)) {
    throw new PosError("RATE_LIMITED", "Too many PIN attempts — wait a few minutes.");
  }

  const target = await current.db.user.findFirst({
    where: {
      id: targetUserId,
      organizationId: current.orgId,
      active: true,
      outletId: current.outletId,
      role: { in: ["staff", "manager"] },
    },
  });
  const failed = new PosError("INVALID_CREDENTIALS", "That PIN doesn't match.");
  if (!target?.pinHash) throw failed;
  if (!(await bcrypt.compare(pin, target.pinHash))) throw failed;

  clearRateLimit(userKey, ...(clientLimitKey ? [clientLimitKey] : []));
  await writeSessionCookie({
    orgId: current.orgId,
    outletId: current.outletId,
    userId: target.id,
  });
}

/** Owner-only: point this device at another outlet of the same organization. */
export async function switchOutlet(current: SessionContext, outletId: string): Promise<void> {
  if (current.role !== "owner") throw new PosError("FORBIDDEN", "Only the owner can switch outlets.");
  const outlet = await current.db.outlet.findFirst({
    where: { id: outletId, organizationId: current.orgId, active: true },
    select: { id: true },
  });
  if (!outlet) throw new PosError("NOT_FOUND", "No such outlet in your organization.");
  await writeSessionCookie({ orgId: current.orgId, outletId: outlet.id, userId: current.userId });
}

/**
 * Users who can sign in on this device. Mirrors the `signInWithPin` scope
 * exactly — outlet staff and managers only, never owners — so the grid never
 * offers a sign-in the API would reject.
 */
export async function listSwitchableUsers(current: DeviceContext) {
  return current.db.user.findMany({
    where: {
      organizationId: current.orgId,
      active: true,
      pinHash: { not: null },
      outletId: current.outletId,
      role: { in: ["staff", "manager"] },
    },
    orderBy: [{ role: "desc" }, { name: "asc" }],
    select: { id: true, name: true, role: true },
  });
}
