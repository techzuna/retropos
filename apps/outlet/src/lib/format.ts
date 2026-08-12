/** "NPR 450" / "$12.50" — whole amounts drop the decimals. */
export function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** "Friday, 7 August 2026 at 7:00 PM" in the restaurant's timezone. */
export function formatDateTime(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(instant);
}

/**
 * How long a table has been sitting, written the way staff say it out loud:
 * "40 min", "1 hr 6 min", "3 hr". Minutes are dropped past a day because
 * nobody reads "29 hr 14 min" — at that point the number itself is the
 * message, and it usually means an order nobody closed.
 */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.floor(minutes));
  if (total < 60) return `${total} min`;

  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const spareHours = hours % 24;
    return spareHours ? `${days}d ${spareHours} hr` : `${days}d`;
  }
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}
