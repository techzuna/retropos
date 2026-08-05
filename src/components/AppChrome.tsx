import Link from "next/link";
import { getOutletProfile } from "@/lib/outlet";
import { roleAtLeast } from "@/lib/constants";
import type { SessionContext } from "@/lib/session";
import { LogoutButton } from "./LogoutButton";

/** Shared POS chrome: header nav by role, dhaka band, content column. */
export async function AppChrome({
  session,
  children,
}: {
  session: SessionContext;
  children: React.ReactNode;
}) {
  const outlet = await getOutletProfile(session);

  return (
    <>
      <header className="no-print bg-madder text-paper">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          {/*
            `basis-full` on a phone: the outlet name is wide enough that sharing
            line one leaves the nav ~128px, which wraps it to one item per line
            and eats half the screen. Given the whole width the nav packs into
            two tidy rows instead. From `sm` up they share a line as before.
          */}
          <Link href="/pos" className="basis-full font-display text-xl leading-none sm:basis-auto">
            {outlet.name}
          </Link>
          {/*
            `min-w-0` and `flex-wrap` are load-bearing, not decoration: a flex
            item defaults to `min-width: auto`, so without them this nav refuses
            to shrink below its content width (393px at the time of writing) and
            pushes the whole document 34px wider than a 375px phone — a
            horizontal scrollbar on every gated screen. Wrapping onto a second
            line is the right answer for a header; the row above already has
            `gap-y-2` for exactly that.
          */}
          <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1 text-sm">
            <Link href="/pos" className="rounded px-2.5 py-2 hover:bg-madder-deep">
              Tables
            </Link>
            <Link href="/pos/reservations" className="rounded px-2.5 py-2 hover:bg-madder-deep">
              Bookings
            </Link>
            {roleAtLeast(session.role, "manager") && (
              <>
                <Link href="/manage/menu" className="rounded px-2.5 py-2 hover:bg-madder-deep">
                  Menu
                </Link>
                <Link href="/manage/reports" className="rounded px-2.5 py-2 hover:bg-madder-deep">
                  Reports
                </Link>
              </>
            )}
            {session.role === "owner" && (
              <Link href="/admin" className="rounded px-2.5 py-2 hover:bg-madder-deep">
                Admin
              </Link>
            )}
            <Link
              href="/signin"
              className="ml-1 rounded-full border border-paper/40 px-3 py-1.5 font-medium"
              title="Hand over to someone else"
            >
              {session.userName}
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <div className="dhaka-band no-print" aria-hidden="true" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-16">{children}</main>
    </>
  );
}
