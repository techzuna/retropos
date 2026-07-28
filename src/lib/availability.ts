import { TZDate } from "@date-fns/tz";

export type WeekdayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export interface OpeningWindow {
  /** Wall-clock "HH:MM" in the restaurant's timezone. */
  open: string;
  /** Wall-clock "HH:MM", same calendar day, must be later than `open`. */
  close: string;
}

export type WeeklyHours = Partial<Record<WeekdayKey, OpeningWindow[]>>;

export interface AvailabilityConfig {
  /** IANA timezone, e.g. "Asia/Kolkata". */
  timezone: string;
  weeklyHours: WeeklyHours;
  /** One-off closed days, "YYYY-MM-DD" in the restaurant's local calendar. */
  closedDates: string[];
  diningDurationMin: number;
  slotIntervalMin: number;
  bookingHorizonDays: number;
}

export interface TableInfo {
  id: string;
  capacity: number;
}

/** A non-cancelled reservation's claim on a table. Instants are UTC. */
export interface BusyInterval {
  tableId: string;
  startsAt: Date;
  endsAt: Date;
}

export interface Slot {
  /** UTC instant. */
  startsAt: Date;
  endsAt: Date;
  /** Wall-clock "HH:MM" label in the restaurant's timezone. */
  label: string;
  /** Free tables that fit the party, smallest sufficient capacity first. */
  tableIds: string[];
}

const WEEKDAY_KEYS: readonly WeekdayKey[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_MIN = 60_000;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** The UTC instant at which a local wall time occurs in `timezone`. */
export function wallTimeToUtc(date: string, time: string, timezone: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return new Date(TZDate.tz(timezone, y, mo - 1, d, h, mi, 0).getTime());
}

/** The "YYYY-MM-DD" calendar date that `instant` falls on in `timezone`. */
export function localDate(instant: Date, timezone: string): string {
  const z = new TZDate(instant.getTime(), timezone);
  return `${z.getFullYear()}-${pad(z.getMonth() + 1)}-${pad(z.getDate())}`;
}

/** The "HH:MM" wall-clock label of `instant` in `timezone`. */
export function localTimeLabel(instant: Date, timezone: string): string {
  const z = new TZDate(instant.getTime(), timezone);
  return `${pad(z.getHours())}:${pad(z.getMinutes())}`;
}

/** Pure calendar arithmetic on a "YYYY-MM-DD" string; timezone-independent. */
export function addDays(date: string, days: number): string {
  const [y, mo, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function weekdayKeyOf(date: string): WeekdayKey {
  const [y, mo, d] = date.split("-").map(Number);
  return WEEKDAY_KEYS[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
}

/**
 * True only for real "YYYY-MM-DD" dates. The regex alone lets values like
 * "2026-08-81" through, which Date.UTC silently rolls over into a different
 * month — past the horizon and closed-date checks, since those compare
 * strings. Round-trip the components to reject rollovers.
 */
export function isCanonicalDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const [y, mo, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** Half-open interval intersection: [aStart, aEnd) ∩ [bStart, bEnd) ≠ ∅. */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Compute bookable slots for one calendar date. Pure: the clock is injected
 * via `now`, and `reservations` must already exclude cancelled/no-show rows.
 *
 * Slots step through UTC instants (not wall-clock labels), so DST days stay
 * honest: skipped wall times produce no phantom slots, repeated wall times
 * yield distinct instants that happen to share a label.
 */
export function computeSlots(params: {
  config: AvailabilityConfig;
  tables: TableInfo[];
  reservations: BusyInterval[];
  /** "YYYY-MM-DD" in the restaurant's local calendar. */
  date: string;
  partySize: number;
  now: Date;
}): Slot[] {
  const { config, tables, reservations, date, partySize, now } = params;
  if (!isCanonicalDate(date) || !Number.isInteger(partySize) || partySize < 1) return [];

  const today = localDate(now, config.timezone);
  if (date < today || date > addDays(today, config.bookingHorizonDays)) return [];
  if (config.closedDates.includes(date)) return [];

  const windows = config.weeklyHours[weekdayKeyOf(date)] ?? [];
  const candidates = tables
    .filter((t) => t.capacity >= partySize)
    .sort((a, b) => a.capacity - b.capacity || a.id.localeCompare(b.id));
  if (candidates.length === 0) return [];

  const durationMs = config.diningDurationMin * MS_PER_MIN;
  const stepMs = config.slotIntervalMin * MS_PER_MIN;
  const slots: Slot[] = [];

  for (const w of windows) {
    const open = wallTimeToUtc(date, w.open, config.timezone).getTime();
    const close = wallTimeToUtc(date, w.close, config.timezone).getTime();

    for (let t = open; t + durationMs <= close; t += stepMs) {
      if (t <= now.getTime()) continue;
      const startsAt = new Date(t);
      const endsAt = new Date(t + durationMs);
      const free = candidates.filter(
        (c) =>
          !reservations.some(
            (r) => r.tableId === c.id && overlaps(startsAt, endsAt, r.startsAt, r.endsAt),
          ),
      );
      if (free.length > 0) {
        slots.push({
          startsAt,
          endsAt,
          label: localTimeLabel(startsAt, config.timezone),
          tableIds: free.map((f) => f.id),
        });
      }
    }
  }
  return slots;
}
