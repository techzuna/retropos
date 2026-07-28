import Link from "next/link";
import { getRestaurant } from "@/lib/restaurant";
import type { WeeklyHours, WeekdayKey } from "@/lib/availability";

// Menu and availability must always be current (PRD §4).
export const dynamic = "force-dynamic";

const DAY_LABELS: Array<[WeekdayKey, string]> = [
  ["mon", "Monday"],
  ["tue", "Tuesday"],
  ["wed", "Wednesday"],
  ["thu", "Thursday"],
  ["fri", "Friday"],
  ["sat", "Saturday"],
  ["sun", "Sunday"],
];

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const restaurant = await getRestaurant();
  const hours = restaurant.openingHours as WeeklyHours;

  return (
    <>
      <header className="bg-madder text-paper">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/" className="font-display text-2xl">
            {restaurant.name}
          </Link>
          <Link
            href="/book"
            className="btn bg-paper text-madder-deep hover:bg-paper-deep py-2"
          >
            Book a table
          </Link>
        </div>
      </header>
      <div className="dhaka-band" aria-hidden="true" />

      <main className="flex-1">{children}</main>

      <footer className="mt-20 bg-ink text-paper/90">
        <div className="mx-auto grid max-w-3xl gap-10 px-5 py-12 sm:grid-cols-2">
          <div>
            <p className="font-display text-xl">{restaurant.name}</p>
            <p className="mt-3 text-sm leading-relaxed">{restaurant.address}</p>
            <p className="mt-2 text-sm">
              <a href={`tel:${restaurant.phone.replace(/[^+\d]/g, "")}`} className="underline underline-offset-4">
                {restaurant.phone}
              </a>
            </p>
          </div>
          <div>
            <p className="eyebrow">Hours</p>
            <dl className="mt-3 space-y-1 text-sm">
              {DAY_LABELS.map(([key, label]) => {
                const windows = hours[key] ?? [];
                return (
                  <div key={key} className="flex justify-between gap-4">
                    <dt>{label}</dt>
                    <dd className="font-mono text-paper/75">
                      {windows.length === 0
                        ? "Closed"
                        : windows.map((w) => `${w.open}–${w.close}`).join(", ")}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
        <div className="border-t border-paper/15 py-4 text-center text-xs text-paper/50">
          Powered by RestroReserve
        </div>
      </footer>
    </>
  );
}
