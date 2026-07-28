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
