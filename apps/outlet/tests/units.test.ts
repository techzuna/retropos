import { describe, expect, it } from "vitest";
import { lineTotalCents, orderTotalCents } from "@/lib/orders";
import { formatDuration } from "@/lib/format";
import { displayReservationStatus } from "@/lib/constants";
import { bucketSettledOrders } from "@/lib/reports";
import { windowsOverlap } from "@/lib/reservations";
import { roleAtLeast } from "@/lib/constants";
import {
  addDays,
  isCanonicalDate,
  isCanonicalTime,
  localDate,
  localDayStartUtc,
  localTimeLabel,
  wallTimeToUtc,
} from "@/lib/time";
import {
  outletPatchSchema,
  pinSwitchSchema,
  reservationSchema,
  servicePeriodSchema,
  tableSchema,
  userCreateSchema,
  userPatchSchema,
} from "@/lib/validation";

describe("orderTotalCents", () => {
  it("sums line snapshots as integers", () => {
    expect(
      orderTotalCents([
        { priceCents: 45000, quantity: 2 },
        { priceCents: 15000, quantity: 3 },
      ]),
    ).toBe(135000);
  });

  it("is zero for an empty order", () => {
    expect(orderTotalCents([])).toBe(0);
  });

  it("prices extras per unit, not per line", () => {
    // Two toasts with bacon is two bacons: (1600 + 400) × 2.
    expect(lineTotalCents({ priceCents: 1600, quantity: 2, modifiers: [{ priceCents: 400 }] })).toBe(
      4000,
    );
    // The screenshot's case: 2000 + 600 + 700 = 3300 for one bagel.
    expect(
      lineTotalCents({
        priceCents: 2000,
        quantity: 1,
        modifiers: [{ priceCents: 600 }, { priceCents: 700 }],
      }),
    ).toBe(3300);
  });

  it("treats a line with no extras exactly as before", () => {
    expect(lineTotalCents({ priceCents: 45000, quantity: 3 })).toBe(135000);
    expect(lineTotalCents({ priceCents: 45000, quantity: 3, modifiers: [] })).toBe(135000);
  });

  it("sums extras across every line of an order", () => {
    expect(
      orderTotalCents([
        { priceCents: 1600, quantity: 1, modifiers: [{ priceCents: 700 }] },
        { priceCents: 1900, quantity: 1, modifiers: [{ priceCents: 700 }, { priceCents: 450 }] },
      ]),
    ).toBe(2300 + 3050);
  });

  it("counts a zero-priced extra without changing the money", () => {
    // "Extra spicy" is free but still a real choice on the line.
    expect(lineTotalCents({ priceCents: 5000, quantity: 2, modifiers: [{ priceCents: 0 }] })).toBe(
      10000,
    );
  });
});

describe("displayReservationStatus — completed is derived, never stored", () => {
  it("reads a seated booking as completed once its order is settled", () => {
    expect(displayReservationStatus("seated", "settled")).toBe("completed");
  });

  it("leaves a seated booking alone while its order is still open", () => {
    expect(displayReservationStatus("seated", "open")).toBe("seated");
    expect(displayReservationStatus("seated", null)).toBe("seated");
    expect(displayReservationStatus("seated", undefined)).toBe("seated");
  });

  it("never invents completed for a booking that was never seated", () => {
    expect(displayReservationStatus("incoming", "settled")).toBe("incoming");
    expect(displayReservationStatus("confirmed", "settled")).toBe("confirmed");
    expect(displayReservationStatus("cancelled", "settled")).toBe("cancelled");
  });
});

describe("bucketSettledOrders — outlet-local buckets", () => {
  // Kathmandu is UTC+5:45 — awkward on purpose.
  const tz = "Asia/Kathmandu";

  it("assigns a late-evening UTC sale to the next local day", () => {
    // 18:30 UTC = 00:15 the NEXT day in Kathmandu.
    const rows = bucketSettledOrders(
      [
        { settledAt: new Date("2026-07-28T18:30:00Z"), totalCents: 100000, guestCount: 2 },
        { settledAt: new Date("2026-07-28T10:00:00Z"), totalCents: 50000, guestCount: null },
      ],
      tz,
      "day",
    );
    expect(rows.map((r) => r.bucket)).toEqual(["2026-07-28", "2026-07-29"]);
    expect(rows[0]).toMatchObject({ salesCents: 50000, orderCount: 1, customerCount: 1 });
    expect(rows[1]).toMatchObject({ salesCents: 100000, orderCount: 1, customerCount: 2 });
  });

  it("groups by month with correct averages", () => {
    const rows = bucketSettledOrders(
      [
        { settledAt: new Date("2026-07-05T12:00:00Z"), totalCents: 30000, guestCount: null },
        { settledAt: new Date("2026-07-20T12:00:00Z"), totalCents: 50000, guestCount: 4 },
        { settledAt: new Date("2026-08-01T12:00:00Z"), totalCents: 70000, guestCount: null },
      ],
      tz,
      "month",
    );
    expect(rows).toEqual([
      { bucket: "2026-07", salesCents: 80000, orderCount: 2, customerCount: 5, avgOrderCents: 40000 },
      { bucket: "2026-08", salesCents: 70000, orderCount: 1, customerCount: 1, avgOrderCents: 70000 },
    ]);
  });
});

describe("PIN rule — exactly 4 digits, everywhere", () => {
  // The UI renders one box per digit, so all three schemas must agree on the
  // count; a drift here silently breaks either entry or admin.
  const cases: Array<[string, boolean]> = [
    ["1234", true],
    ["0000", true],
    ["123", false],
    ["12345", false],
    ["abcd", false],
    ["12 4", false],
    ["12.4", false],
    ["", false],
    ["１２３４", false], // full-width digits
  ];

  it.each(cases)("pinSwitchSchema accepts %j: %s", (pin, ok) => {
    expect(pinSwitchSchema.safeParse({ userId: "u1", pin }).success).toBe(ok);
  });

  it.each(cases)("userCreateSchema accepts %j: %s", (pin, ok) => {
    expect(userCreateSchema.safeParse({ name: "Sita", role: "staff", pin }).success).toBe(ok);
  });

  it.each(cases)("userPatchSchema accepts %j: %s", (pin, ok) => {
    expect(userPatchSchema.safeParse({ pin }).success).toBe(ok);
  });

  it("gives a human message rather than a raw regex", () => {
    const result = pinSwitchSchema.safeParse({ userId: "u1", pin: "12" });
    expect(result.success).toBe(false);
    const message = result.error!.issues[0].message;
    expect(message).toBe("PIN is 4 digits.");
    expect(message).not.toContain("\\d");
  });

  it("staff still require a PIN; managers require email and password", () => {
    expect(userCreateSchema.safeParse({ name: "Sita", role: "staff" }).success).toBe(false);
    expect(
      userCreateSchema.safeParse({ name: "Maya", role: "manager", pin: "2222" }).success,
    ).toBe(false);
    expect(
      userCreateSchema.safeParse({
        name: "Maya",
        role: "manager",
        email: "m@x.com",
        password: "longenough1",
        pin: "2222",
      }).success,
    ).toBe(true);
  });
});

describe("roles", () => {
  it("orders staff < manager < owner", () => {
    expect(roleAtLeast("owner", "manager")).toBe(true);
    expect(roleAtLeast("manager", "manager")).toBe(true);
    expect(roleAtLeast("staff", "manager")).toBe(false);
    expect(roleAtLeast("manager", "owner")).toBe(false);
  });
});

describe("time helpers", () => {
  it("localDate respects the timezone across midnight", () => {
    expect(localDate(new Date("2026-07-28T18:30:00Z"), "Asia/Kathmandu")).toBe("2026-07-29");
    expect(localDate(new Date("2026-07-28T18:30:00Z"), "UTC")).toBe("2026-07-28");
  });

  it("localDayStartUtc inverts localDate at the boundary", () => {
    const start = localDayStartUtc("2026-07-29", "Asia/Kathmandu");
    expect(start.toISOString()).toBe("2026-07-28T18:15:00.000Z"); // +5:45 offset
  });

  it("addDays crosses month boundaries; isCanonicalDate rejects rollovers", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(isCanonicalDate("2026-08-81")).toBe(false);
    expect(isCanonicalDate("2026-02-30")).toBe(false);
    expect(isCanonicalDate("2026-02-28")).toBe(true);
  });

  it("wallTimeToUtc anchors a booking to the outlet's zone", () => {
    // 19:00 in Kathmandu (+5:45) is 13:15 UTC the same day.
    expect(wallTimeToUtc("2026-07-29", "19:00", "Asia/Kathmandu").toISOString()).toBe(
      "2026-07-29T13:15:00.000Z",
    );
    expect(localTimeLabel(new Date("2026-07-29T13:15:00Z"), "Asia/Kathmandu")).toBe("19:00");
  });

  it("isCanonicalTime rejects impossible clock times", () => {
    expect(isCanonicalTime("19:00")).toBe(true);
    expect(isCanonicalTime("00:00")).toBe(true);
    expect(isCanonicalTime("23:59")).toBe(true);
    expect(isCanonicalTime("24:00")).toBe(false);
    expect(isCanonicalTime("19:60")).toBe(false);
    expect(isCanonicalTime("7:00")).toBe(false);
  });
});

describe("windowsOverlap — the whole double-booking guarantee", () => {
  const w = (from: string, to: string) => ({
    startAt: new Date(`2026-07-29T${from}:00Z`),
    endAt: new Date(`2026-07-29T${to}:00Z`),
  });

  it("treats back-to-back windows as free, not clashing", () => {
    // The half-open interval is the point: 18–20 and 20–22 must both be bookable.
    expect(windowsOverlap(w("18:00", "20:00"), w("20:00", "22:00"))).toBe(false);
    expect(windowsOverlap(w("20:00", "22:00"), w("18:00", "20:00"))).toBe(false);
  });

  it("catches every genuine collision, whichever way round", () => {
    const dinner = w("19:00", "21:00");
    expect(windowsOverlap(dinner, w("20:00", "22:00"))).toBe(true); // late overlap
    expect(windowsOverlap(dinner, w("18:00", "20:00"))).toBe(true); // early overlap
    expect(windowsOverlap(dinner, w("19:30", "20:00"))).toBe(true); // fully inside
    expect(windowsOverlap(dinner, w("18:00", "23:00"))).toBe(true); // fully covering
    expect(windowsOverlap(dinner, dinner)).toBe(true); // identical
  });

  it("leaves non-touching windows alone", () => {
    expect(windowsOverlap(w("12:00", "14:00"), w("19:00", "21:00"))).toBe(false);
  });
});

describe("table & reservation input validation", () => {
  it("a table needs a name and at least one seat", () => {
    expect(tableSchema.safeParse({ name: "T7", capacity: 4 }).success).toBe(true);
    expect(tableSchema.safeParse({ name: "T7", capacity: 0 }).success).toBe(false);
    expect(tableSchema.safeParse({ name: "", capacity: 4 }).success).toBe(false);
  });

  it("a booking needs a service period or all-day, never neither", () => {
    const base = { tableId: "t1", customerName: "Sharma", partySize: 4, date: "2026-07-29" };
    expect(reservationSchema.safeParse({ ...base, servicePeriodId: "dinner" }).success).toBe(true);
    expect(reservationSchema.safeParse({ ...base, allDay: true }).success).toBe(true);
    expect(reservationSchema.safeParse(base).success).toBe(false); // no window at all
    // Clock times are deliberately not part of the contract any more.
    expect(
      reservationSchema.safeParse({ ...base, startTime: "19:00", endTime: "21:00" }).success,
    ).toBe(false);
    expect(
      reservationSchema.safeParse({ ...base, date: "29-07-2026", allDay: true }).success,
    ).toBe(false);
  });

  it("a service period needs a name and a forward window", () => {
    expect(servicePeriodSchema.safeParse({ name: "Dinner", startTime: "18:00", endTime: "23:00" }).success).toBe(true);
    expect(servicePeriodSchema.safeParse({ name: "", startTime: "18:00", endTime: "23:00" }).success).toBe(false);
    expect(servicePeriodSchema.safeParse({ name: "Dinner", startTime: "6:00", endTime: "23:00" }).success).toBe(false);
  });

  it("an outlet timezone must be a zone this runtime knows", () => {
    expect(outletPatchSchema.safeParse({ timezone: "UTC" }).success).toBe(true);
    expect(outletPatchSchema.safeParse({ timezone: "Asia/Kathmandu" }).success).toBe(true);
    // "Asia/Katmandu" is a real IANA alias for the same zone, so it is accepted
    // on purpose — the check is "does this runtime know it", not "is it the
    // canonical spelling". A junk zone is what must be refused, because an
    // unchecked one would silently mis-bucket every report day.
    expect(outletPatchSchema.safeParse({ timezone: "Asia/Katmandu" }).success).toBe(true);
    expect(outletPatchSchema.safeParse({ timezone: "Mars/Olympus" }).success).toBe(false);
    expect(outletPatchSchema.safeParse({ timezone: "Kathmandu" }).success).toBe(false);
    expect(outletPatchSchema.safeParse({ timezone: "" }).success).toBe(false);
  });
});

describe("formatDuration — how long a table has been sitting", () => {
  it("reads as staff would say it", () => {
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(40)).toBe("40 min");
    expect(formatDuration(59)).toBe("59 min");
    expect(formatDuration(60)).toBe("1 hr");
    expect(formatDuration(66)).toBe("1 hr 6 min");
    expect(formatDuration(125)).toBe("2 hr 5 min");
  });

  it("switches to days rather than printing 29 hr 14 min", () => {
    expect(formatDuration(1439)).toBe("23 hr 59 min");
    expect(formatDuration(1440)).toBe("1d");
    expect(formatDuration(1500)).toBe("1d 1 hr");
    expect(formatDuration(17626)).toBe("12d 5 hr");
  });

  it("never renders a negative or fractional duration", () => {
    expect(formatDuration(-5)).toBe("0 min");
    expect(formatDuration(66.9)).toBe("1 hr 6 min");
  });
});
