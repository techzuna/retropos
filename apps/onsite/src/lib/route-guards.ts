import { redirect } from "next/navigation";
import { getDevice, getSession, type SessionContext } from "./session";
import { roleAtLeast, type Role } from "@restro/domain/constants";

/**
 * Gate a page on someone being signed in, and optionally on their role.
 *
 * Sends an unpaired device to /login (needs a password to pick an outlet) and
 * a paired one to /signin (staff can start their own shift with a PIN).
 */
export async function requirePageSession(minRole: Role = "staff"): Promise<SessionContext> {
  const session = await getSession();
  if (!session) redirect((await getDevice()) ? "/signin" : "/login");
  if (!roleAtLeast(session.role, minRole)) redirect("/pos");
  return session;
}
