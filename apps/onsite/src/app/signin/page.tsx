import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listSwitchableUsers } from "@/lib/auth";
import { getOutletProfile } from "@/lib/outlet";
import { getDevice, getSession } from "@/lib/session";
import { PinSignIn } from "./pin-sign-in";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

/**
 * The floor sign-in screen: whoever is on shift picks their name and types
 * their PIN. Reachable on any device already paired to an outlet, whether or
 * not someone is currently signed in — so staff never wait for a manager.
 */
export default async function SignInPage() {
  const device = await getDevice();
  if (!device) redirect("/login");

  const [session, outlet, users] = await Promise.all([
    getSession(),
    getOutletProfile(device),
    listSwitchableUsers(device),
  ]);

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="border border-line bg-white">
          <div className="dhaka-band" aria-hidden="true" />
          <div className="p-6">
            <p className="eyebrow">{outlet?.name ?? "RestroReserve"}</p>
            <h1 className="mt-2 font-display text-2xl">Who&apos;s on?</h1>
            <p className="mt-1 text-sm text-ink-soft">
              {session
                ? `${session.userName} is signed in. Pick your name to take over.`
                : "Pick your name and enter your PIN."}
            </p>

            {users.length === 0 ? (
              <p className="mt-5 border border-line bg-paper px-3 py-2 text-sm text-ink-soft">
                Nobody at this outlet has a PIN yet. A manager or owner can add people and set
                PINs under Admin.
              </p>
            ) : (
              <PinSignIn users={users} currentUserId={session?.userId ?? null} />
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-ink-soft">
          Manager or owner?{" "}
          <Link href="/login" className="underline underline-offset-4">
            Sign in with email and password
          </Link>{" "}
          — owners aren&apos;t in the PIN list.
        </p>
      </div>
    </main>
  );
}
