import type { Metadata } from "next";
import Link from "next/link";
import { getOutletProfile } from "@/lib/outlet";
import { getDevice, getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Manager sign-in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Deliberately reachable while someone is signed in: an owner has no PIN, so
  // this screen is their only way back in — they must not have to end a staff
  // member's shift first. A password takes over the device.
  const [session, device] = await Promise.all([getSession(), getDevice()]);
  const outlet = device ? await getOutletProfile(device) : null;

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="border border-line bg-white">
          <div className="dhaka-band" aria-hidden="true" />
          <div className="p-6 sm:p-8">
            <h1 className="font-display text-2xl">
              {outlet ? "Manager sign-in" : "Set up this device"}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              {outlet
                ? `Signing in with email and password — for menu, reports, and admin work at ${outlet.name}.`
                : "Sign in as an owner or manager to pair this device with an outlet. After that, staff sign in with their PIN."}
            </p>
            {session && (
              <p className="mt-3 border border-line bg-paper px-3 py-2 text-sm">
                {`${session.userName} is signed in here. Signing in takes over this device.`}
              </p>
            )}
            <LoginForm />
          </div>
        </div>

        {outlet && (
          <p className="mt-5 text-center text-xs text-ink-soft">
            Taking orders?{" "}
            <Link href="/signin" className="underline underline-offset-4">
              Sign in with your PIN instead
            </Link>
            {session && (
              <>
                {" · "}
                <Link href="/pos" className="underline underline-offset-4">
                  Back to tables
                </Link>
              </>
            )}
          </p>
        )}
      </div>
    </main>
  );
}
