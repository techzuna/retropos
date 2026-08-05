import type { Metadata } from "next";
import Link from "next/link";
import { ErrorScreen } from "@/components/ErrorScreen";

export const metadata: Metadata = { title: "Not found" };

/**
 * Reached by `notFound()` from the table and bill screens, and by any mistyped
 * address. In a POS the honest cause is almost never "wrong URL" — it's a link
 * that has gone stale because the order was settled, cancelled, or the table
 * retired. The copy says that, because "404" tells a waiter nothing.
 */
export default function NotFound() {
  return (
    <ErrorScreen
      eyebrow="Not found"
      title="That page isn't here"
      message="The table, order or bill you followed may have been settled, cancelled, or removed from the floor plan since that link was made."
      reassure={false}
    >
      <Link href="/pos" className="btn btn-primary">
        Back to tables
      </Link>
      <Link href="/pos/reservations" className="btn btn-secondary">
        Bookings
      </Link>
    </ErrorScreen>
  );
}
