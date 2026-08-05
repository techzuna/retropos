// SQLite has no enums — these constants are the single source of truth for
// constrained string columns, enforced by Zod at the edges.

export const ROLES = ["staff", "manager", "owner"] as const;
export type Role = (typeof ROLES)[number];

/** Strictly ordered: staff < manager < owner. */
export function roleAtLeast(actual: Role, required: Role): boolean {
  return ROLES.indexOf(actual) >= ROLES.indexOf(required);
}

export const ORDER_STATUSES = ["open", "settled", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Booking lifecycle: `incoming` (taken but not yet confirmed) → `confirmed` →
 * `seated`, or closed out as `cancelled` / `no_show`.
 *
 * There is no stored `completed`. A booking reads as completed when its linked
 * order has been settled — derived, so a booking card can never disagree with
 * the bill (`displayReservationStatus`).
 */
export const RESERVATION_STATUSES = [
  "incoming",
  "confirmed",
  "seated",
  "cancelled",
  "no_show",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/** Statuses that still hold the table — the only ones an overlap check counts. */
export const ACTIVE_RESERVATION_STATUSES = ["incoming", "confirmed", "seated"] as const;

/**
 * Statuses the board offers as "tap to seat them". `seated` is excluded: that
 * party is already at the table and cannot be seated twice.
 */
export const HOLDING_RESERVATION_STATUSES = ["incoming", "confirmed"] as const;

/** What the UI shows, including the derived `completed`. */
export type ReservationDisplayStatus = ReservationStatus | "completed";

export function displayReservationStatus(
  status: string,
  orderStatus?: string | null,
): ReservationDisplayStatus {
  if (status === "seated" && orderStatus === "settled") return "completed";
  return status as ReservationDisplayStatus;
}

/** Drawn as a seat diagram on booking cards. */
export const TABLE_SHAPES = ["rect", "square", "round"] as const;
export type TableShape = (typeof TABLE_SHAPES)[number];

/**
 * Service periods a new outlet starts with — the owner can rename, retime, add
 * or retire them per outlet.
 *
 * Bookings are taken by **period**, not by clock time: a restaurant can't
 * promise a party will be seated at 19:15, but it can promise them dinner. The
 * period's wall-clock window still becomes the UTC hold under the hood, so
 * double-booking, the board and the reports all keep working unchanged.
 */
export const DEFAULT_SERVICE_PERIODS = [
  { name: "Breakfast", startTime: "07:00", endTime: "11:00", sortOrder: 1 },
  { name: "Lunch", startTime: "12:00", endTime: "15:00", sortOrder: 2 },
  { name: "Dinner", startTime: "18:00", endTime: "23:00", sortOrder: 3 },
] as const;

/** The label a whole-day hold carries in place of a period name. */
export const ALL_DAY_LABEL = "All day";

/**
 * Suggested zones, offered as autocomplete rather than enforced: every
 * restaurant names its floor differently and the owner shouldn't need a code
 * change to add "Rooftop". `DiningTable.zone` is free text.
 */
export const ZONE_SUGGESTIONS = [
  "Floor",
  "Courtyard",
  "Corridor",
  "Loft",
  "Terrace",
  "Rooftop",
  "Bar",
  "Private room",
] as const;

export const PAYMENT_METHODS = ["qr", "cash"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const BACKUP_FREQUENCIES = ["off", "daily", "weekly"] as const;
export type BackupFrequency = (typeof BACKUP_FREQUENCIES)[number];

export const DEFAULT_CUSTOMER_NAME = "Anonymous Customer";
