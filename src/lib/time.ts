import { TZDate } from "@date-fns/tz";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** The "YYYY-MM-DD" calendar date that `instant` falls on in `timezone`. */
export function localDate(instant: Date, timezone: string): string {
  const z = new TZDate(instant.getTime(), timezone);
  return `${z.getFullYear()}-${pad(z.getMonth() + 1)}-${pad(z.getDate())}`;
}

/** The "YYYY-MM" month that `instant` falls in, in `timezone`. */
export function localMonth(instant: Date, timezone: string): string {
  return localDate(instant, timezone).slice(0, 7);
}

/** The UTC instant at which `date` begins (00:00 wall time) in `timezone`. */
export function localDayStartUtc(date: string, timezone: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(TZDate.tz(timezone, y, mo - 1, d, 0, 0, 0).getTime());
}

/**
 * The UTC instant at which a local wall time occurs in `timezone`.
 *
 * A booking is made in wall-clock terms ("Tuesday, 7pm"), so the host's input
 * has to be anchored to the outlet's zone before it can be stored or compared.
 */
export function wallTimeToUtc(date: string, time: string, timezone: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return new Date(TZDate.tz(timezone, y, mo - 1, d, h, mi, 0).getTime());
}

/** The "HH:MM" wall-clock label of `instant` in `timezone`. */
export function localTimeLabel(instant: Date, timezone: string): string {
  const z = new TZDate(instant.getTime(), timezone);
  return `${pad(z.getHours())}:${pad(z.getMinutes())}`;
}

/** True only for a real 24-hour "HH:MM" wall time. */
export function isCanonicalTime(time: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  const [h, mi] = time.split(":").map(Number);
  return h >= 0 && h <= 23 && mi >= 0 && mi <= 59;
}

/**
 * True only for an IANA zone this runtime actually knows.
 *
 * Worth checking rather than accepting any string: the outlet timezone drives
 * report day-bucketing and every booking window, so a typo like
 * "Asia/Katmandu" would not fail loudly — it would quietly bucket a day wrong.
 */
export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Every zone this runtime supports, for a settings picker. */
export function listTimezones(): string[] {
  return [...Intl.supportedValuesOf("timeZone")];
}

/** Pure calendar arithmetic on a "YYYY-MM-DD" string; timezone-independent. */
export function addDays(date: string, days: number): string {
  const [y, mo, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/**
 * True only for real "YYYY-MM-DD" dates — the regex alone lets values like
 * "2026-08-81" through, which Date.UTC would silently roll over.
 */
export function isCanonicalDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, mo, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}
