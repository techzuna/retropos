import { describe, expect, it } from "vitest";
import {
  addDays,
  computeSlots,
  localDate,
  wallTimeToUtc,
  type AvailabilityConfig,
  type BusyInterval,
  type TableInfo,
} from "@/lib/availability";

// America/New_York exercises DST; the engine must work for any IANA zone.
const config: AvailabilityConfig = {
  timezone: "America/New_York",
  weeklyHours: {
    tue: [
      { open: "12:00", close: "15:00" },
      { open: "18:00", close: "22:30" },
    ],
    wed: [
      { open: "12:00", close: "15:00" },
      { open: "18:00", close: "22:30" },
    ],
    sat: [{ open: "18:00", close: "22:30" }],
  },
  closedDates: ["2026-08-12"],
  diningDurationMin: 90,
  slotIntervalMin: 30,
  bookingHorizonDays: 60,
};

const tables: TableInfo[] = [
  { id: "t6", capacity: 6 },
  { id: "t2a", capacity: 2 },
  { id: "t4", capacity: 4 },
  { id: "t2b", capacity: 2 },
];

// A quiet moment well before the dates under test. 2026-08-05 is a Wednesday.
const now = new Date("2026-08-01T12:00:00Z");

function slotsFor(
  overrides: Partial<Parameters<typeof computeSlots>[0]> = {},
): ReturnType<typeof computeSlots> {
  return computeSlots({
    config,
    tables,
    reservations: [],
    date: "2026-08-05",
    partySize: 2,
    now,
    ...overrides,
  });
}

describe("computeSlots — windows and stepping", () => {
  it("produces slots only where start + duration fits inside a window", () => {
    const labels = slotsFor().map((s) => s.label);
    // Lunch 12:00–15:00 with 90-min dining: last seating 13:30.
    // Dinner 18:00–22:30: last seating 21:00.
    expect(labels).toEqual([
      "12:00", "12:30", "13:00", "13:30",
      "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00",
    ]);
  });

  it("computes UTC instants from the restaurant's wall clock", () => {
    const first = slotsFor()[0];
    // 12:00 EDT (UTC-4) on 2026-08-05.
    expect(first.startsAt.toISOString()).toBe("2026-08-05T16:00:00.000Z");
    expect(first.endsAt.toISOString()).toBe("2026-08-05T17:30:00.000Z");
  });

  it("returns nothing on weekdays with no windows", () => {
    expect(slotsFor({ date: "2026-08-03" })).toEqual([]); // Monday
  });

  it("returns nothing on one-off closed dates", () => {
    expect(slotsFor({ date: "2026-08-12" })).toEqual([]); // Wednesday, closed
  });
});

describe("computeSlots — date bounds", () => {
  it("rejects past dates and malformed input", () => {
    expect(slotsFor({ date: "2026-07-29" })).toEqual([]);
    expect(slotsFor({ date: "not-a-date" })).toEqual([]);
    expect(slotsFor({ partySize: 0 })).toEqual([]);
    expect(slotsFor({ partySize: 2.5 })).toEqual([]);
  });

  it("rejects non-canonical dates that would roll over past policy checks", () => {
    // "2026-08-81" beats the string horizon check but rolls to 2026-10-20.
    expect(slotsFor({ date: "2026-08-81" })).toEqual([]);
    expect(slotsFor({ date: "2026-02-30" })).toEqual([]);
    expect(slotsFor({ date: "2026-13-01" })).toEqual([]);
  });

  it("allows the horizon boundary and rejects one day past it", () => {
    // today in New York at `now` is 2026-08-01; horizon 60 → 2026-09-30 ok.
    expect(slotsFor({ date: "2026-09-30" }).length).toBeGreaterThan(0); // Wednesday
    expect(slotsFor({ date: "2026-10-03" })).toEqual([]); // Saturday, day 63
  });

  it("uses the restaurant's calendar, not the server's, for 'today'", () => {
    // 02:00 UTC on Aug 6 is still 22:00 Aug 5 in New York.
    const lateNow = new Date("2026-08-06T02:00:00Z");
    expect(localDate(lateNow, config.timezone)).toBe("2026-08-05");
    // A booking for "today" (Aug 5 local) must not be treated as past.
    const slots = slotsFor({ date: "2026-08-05", now: lateNow });
    expect(slots).toEqual([]); // all of today's seatings have passed by 22:00
  });

  it("hides slots that have already started today", () => {
    // 17:30 UTC = 13:30 EDT: lunch is over (13:30 itself excluded), dinner remains.
    const labels = slotsFor({ now: new Date("2026-08-05T17:30:00Z") }).map((s) => s.label);
    expect(labels[0]).toBe("18:00");
    expect(labels).toHaveLength(7);
  });
});

describe("computeSlots — tables and conflicts", () => {
  it("offers only tables that fit the party, smallest first", () => {
    const slots = slotsFor({ partySize: 3 });
    expect(slots[0].tableIds).toEqual(["t4", "t6"]);
  });

  it("returns nothing when no table fits the party", () => {
    expect(slotsFor({ partySize: 7 })).toEqual([]);
  });

  it("removes only conflicted tables from overlapping slots", () => {
    const reservations: BusyInterval[] = [
      {
        tableId: "t4",
        startsAt: wallTimeToUtc("2026-08-05", "18:00", config.timezone),
        endsAt: wallTimeToUtc("2026-08-05", "19:30", config.timezone),
      },
    ];
    const slots = slotsFor({ partySize: 3, reservations });
    const at = (label: string) => slots.find((s) => s.label === label);
    expect(at("18:00")?.tableIds).toEqual(["t6"]);
    expect(at("18:30")?.tableIds).toEqual(["t6"]); // 18:30–20:00 overlaps
    expect(at("19:30")?.tableIds).toEqual(["t4", "t6"]); // adjacent, not overlapping
  });

  it("drops a slot entirely when every fitting table is taken", () => {
    const busy = (tableId: string): BusyInterval => ({
      tableId,
      startsAt: wallTimeToUtc("2026-08-05", "18:00", config.timezone),
      endsAt: wallTimeToUtc("2026-08-05", "19:30", config.timezone),
    });
    const slots = slotsFor({ partySize: 3, reservations: [busy("t4"), busy("t6")] });
    const labels = slots.map((s) => s.label);
    expect(labels).not.toContain("18:00");
    expect(labels).not.toContain("18:30");
    expect(labels).not.toContain("19:00");
    expect(labels).toContain("19:30");
  });
});

describe("computeSlots — DST boundaries", () => {
  // An artificial overnight window makes the transition hours visible.
  const dstConfig: AvailabilityConfig = {
    ...config,
    weeklyHours: { sun: [{ open: "00:00", close: "06:00" }] },
    closedDates: [],
    diningDurationMin: 60,
    slotIntervalMin: 60,
  };
  const winterNow = new Date("2026-03-01T12:00:00Z");
  const autumnNow = new Date("2026-10-25T12:00:00Z");

  it("spring forward: the skipped hour yields no phantom slot", () => {
    // 2026-03-08: 02:00 EST jumps to 03:00 EDT — a 6-hour wall window is 5 real hours.
    const slots = computeSlots({
      config: dstConfig,
      tables,
      reservations: [],
      date: "2026-03-08",
      partySize: 2,
      now: winterNow,
    });
    expect(slots.map((s) => s.label)).toEqual(["00:00", "01:00", "03:00", "04:00", "05:00"]);
  });

  it("fall back: the repeated hour yields two distinct slots", () => {
    // 2026-11-01: 02:00 EDT falls back to 01:00 EST — 6 wall hours are 7 real hours.
    const slots = computeSlots({
      config: dstConfig,
      tables,
      reservations: [],
      date: "2026-11-01",
      partySize: 2,
      now: autumnNow,
    });
    expect(slots).toHaveLength(7);
    const oneAm = slots.filter((s) => s.label === "01:00");
    expect(oneAm).toHaveLength(2);
    expect(oneAm[0].startsAt.getTime()).not.toBe(oneAm[1].startsAt.getTime());
  });
});

describe("calendar helpers", () => {
  it("addDays crosses month and year boundaries", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});
