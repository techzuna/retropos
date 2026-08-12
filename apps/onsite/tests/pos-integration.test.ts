// DB-backed integration tests on a throwaway SQLite file: order lifecycle,
// tenant isolation, reports, and the backup round-trip.
import { execSync } from "node:child_process";
import { rm } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SessionContext } from "@/lib/session";

process.env.DATABASE_URL = "file:./data/test.db";

// Domain code takes its database handle on the context (`ctx.db`), so the test
// resolves one the same way a request would and builds contexts around it.
const { resolveDb } = await import("@/lib/db");
const prisma = await resolveDb();
const { seatTable, addOrderItem, updateOrderItem, settleOrder, cancelOrder, getTableBoard, getOrder } =
  await import("@/lib/orders");
const { salesSummary } = await import("@/lib/reports");
const { signInWithPin, listSwitchableUsers, hashSecret } = await import("@/lib/auth");
const { exportOrganization, restoreOrganization } = await import("@/lib/backup");
const {
  createReservation,
  listReservations,
  seatReservation,
  cancelReservation,
  markNoShow,
  confirmReservation,
  reservationHoldsByTable,
} = await import("@/lib/reservations");
const { createModifier, setItemModifiers, listModifiers, deleteModifier } = await import(
  "@/lib/modifiers"
);
const { createTable, updateTable, deleteTable, listTables } = await import("@/lib/tables");
const { createServicePeriod, listServicePeriods, updateServicePeriod, deleteServicePeriod } =
  await import("@/lib/service-periods");
const { localDate } = await import("@restro/domain/time");
const { PosError } = await import("@restro/domain/errors");

let ctxA: SessionContext; // staff at outlet A
let ctxB: SessionContext; // staff at outlet B (same org — isolation must still hold)
let tableA: string;
let tableB: string;
let momoA: string; // menu item at outlet A
let soldOutA: string;

beforeAll(async () => {
  // Fresh throwaway DB each run: removing the file + plain push avoids
  // --force-reset (which Prisma 7 gates behind interactive consent).
  await rm("data/test.db", { force: true });
  execSync('npx prisma db push --url "file:./data/test.db"', {
    env: { ...process.env },
    stdio: "ignore",
  });

  const org = await prisma.organization.create({
    data: {
      name: "Test Org",
      outlets: {
        create: [
          {
            name: "Outlet A",
            timezone: "Asia/Kathmandu",
            tables: { create: [{ name: "A1" }, { name: "A2" }] },
            menuCategories: {
              create: [
                {
                  name: "Food",
                  items: {
                    create: [
                      { name: "Momos", priceCents: 45000 },
                      { name: "Gone", priceCents: 10000, available: false },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: "Outlet B",
            timezone: "Asia/Kathmandu",
            tables: { create: [{ name: "B1" }] },
          },
        ],
      },
      users: {
        create: [
          { name: "Staff A", role: "staff" },
          { name: "Staff B", role: "staff" },
        ],
      },
    },
    include: {
      outlets: { include: { tables: true, menuCategories: { include: { items: true } } } },
      users: true,
    },
  });

  const [outletA, outletB] = org.outlets;
  const [userA, userB] = org.users;
  await prisma.user.update({ where: { id: userA.id }, data: { outletId: outletA.id } });
  await prisma.user.update({ where: { id: userB.id }, data: { outletId: outletB.id } });

  const db = prisma;
  ctxA = { db, orgId: org.id, outletId: outletA.id, userId: userA.id, role: "staff", userName: "Staff A" };
  ctxB = { db, orgId: org.id, outletId: outletB.id, userId: userB.id, role: "staff", userName: "Staff B" };
  tableA = outletA.tables[0].id;
  tableB = outletB.tables[0].id;
  momoA = outletA.menuCategories[0].items.find((i) => i.name === "Momos")!.id;
  soldOutA = outletA.menuCategories[0].items.find((i) => i.name === "Gone")!.id;
});

describe("order lifecycle", () => {
  it("seat → add/modify → settle freezes the total and frees the table", async () => {
    const order = await seatTable(ctxA, { tableId: tableA, guestCount: 3 });
    expect(order.customerName).toBe("Anonymous Customer");

    // Table now occupied: seating again fails; board shows it.
    await expect(seatTable(ctxA, { tableId: tableA })).rejects.toMatchObject({ code: "TABLE_OCCUPIED" });
    const boardBefore = await getTableBoard(ctxA);
    expect(boardBefore.find((t) => t.id === tableA)?.order?.id).toBe(order.id);

    const line = await addOrderItem(ctxA, order.id, { menuItemId: momoA, quantity: 2 });
    expect(line.priceCents).toBe(45000); // snapshot
    await updateOrderItem(ctxA, order.id, line.id, { quantity: 3 });

    // Menu price change must NOT affect the order (snapshots are law).
    await prisma.menuItem.update({ where: { id: momoA }, data: { priceCents: 99999 } });

    const settled = await settleOrder(ctxA, order.id, "qr");
    expect(settled.totalCents).toBe(3 * 45000);
    expect(settled.status).toBe("settled");

    // Double settle loses; the order is immutable now.
    await expect(settleOrder(ctxA, order.id, "cash")).rejects.toMatchObject({ code: "ORDER_NOT_OPEN" });
    await expect(addOrderItem(ctxA, order.id, { menuItemId: momoA, quantity: 1 })).rejects.toMatchObject({
      code: "ORDER_NOT_OPEN",
    });

    // Table freed automatically — occupancy is derived.
    const boardAfter = await getTableBoard(ctxA);
    expect(boardAfter.find((t) => t.id === tableA)?.order).toBeNull();
  });

  it("rejects sold-out items and empty settles; cancel voids and frees", async () => {
    const order = await seatTable(ctxA, { tableId: tableA, customerName: "  " });
    expect(order.customerName).toBe("Anonymous Customer"); // blank collapses to default

    await expect(addOrderItem(ctxA, order.id, { menuItemId: soldOutA, quantity: 1 })).rejects.toMatchObject(
      { code: "ITEM_UNAVAILABLE" },
    );
    await expect(settleOrder(ctxA, order.id, "cash")).rejects.toMatchObject({ code: "ORDER_NOT_OPEN" });

    await cancelOrder(ctxA, order.id);
    const board = await getTableBoard(ctxA);
    expect(board.find((t) => t.id === tableA)?.order).toBeNull();
  });
});

describe("tenant isolation", () => {
  it("outlet B staff cannot see or touch outlet A's tables, menu, or orders", async () => {
    const order = await seatTable(ctxA, { tableId: tableA });

    await expect(seatTable(ctxB, { tableId: tableA })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(getOrder(ctxB, order.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(settleOrder(ctxB, order.id, "cash")).rejects.toMatchObject({ code: "NOT_FOUND" });

    // B can't order A's menu items onto B's own order either.
    const orderB = await seatTable(ctxB, { tableId: tableB });
    await expect(addOrderItem(ctxB, orderB.id, { menuItemId: momoA, quantity: 1 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    await cancelOrder(ctxA, order.id);
    await cancelOrder(ctxB, orderB.id);
  });
});

describe("reports", () => {
  it("counts settled orders only, bucketed in outlet-local days", async () => {
    const managerA: SessionContext = { ...ctxA, role: "manager" };
    const order = await seatTable(ctxA, { tableId: tableA, guestCount: 4 });
    const line = await addOrderItem(ctxA, order.id, { menuItemId: momoA, quantity: 1 });
    expect(line.priceCents).toBe(99999); // fresh snapshot of the edited price
    await settleOrder(ctxA, order.id, "cash");

    const { localDate } = await import("@restro/domain/time");
    const today = localDate(new Date(), "Asia/Kathmandu");
    const summary = await salesSummary(managerA, { from: today, to: today, groupBy: "day" });

    // Earlier settled test order (135000) may share today's bucket; assert
    // this order's contribution is present and voids don't count as sales.
    expect(summary.totals.salesCents).toBeGreaterThanOrEqual(99999);
    expect(summary.totals.customerCount).toBeGreaterThanOrEqual(4);
    expect(summary.voidCount).toBeGreaterThanOrEqual(2);
    expect(summary.rows.map((r) => r.bucket)).toContain(today);
  });

  it("rejects rollover dates", async () => {
    const managerA: SessionContext = { ...ctxA, role: "manager" };
    await expect(
      salesSummary(managerA, { from: "2026-08-81", to: "2026-08-99", groupBy: "day" }),
    ).rejects.toBeInstanceOf(PosError);
  });
});

describe("PIN sign-in cannot escalate", () => {
  // A 4-digit PIN on a shared floor tablet must never unlock owner powers
  // (user creation, whole-org backup export) or reach another outlet's staff.
  it("refuses to sign in as an owner even with the correct PIN", async () => {
    const org = await prisma.organization.findFirstOrThrow({ select: { id: true } });
    const owner = await prisma.user.create({
      data: {
        organizationId: org.id,
        outletId: null,
        name: "Owner With Pin",
        email: "owner-with-pin@test.local",
        role: "owner",
        passwordHash: hashSecret("ownerpassword1"),
        pinHash: hashSecret("1111"),
      },
    });

    await expect(signInWithPin(ctxA, owner.id, "1111", null)).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });

    // ...and the owner is never offered on the sign-in screen.
    const switchable = await listSwitchableUsers(ctxA);
    expect(switchable.map((u) => u.id)).not.toContain(owner.id);
    expect(switchable.every((u) => u.role !== "owner")).toBe(true);
  });

  it("refuses to sign in a sibling outlet's staff", async () => {
    const org = await prisma.organization.findFirstOrThrow({ select: { id: true } });
    const staffB = await prisma.user.create({
      data: {
        organizationId: org.id,
        outletId: ctxB.outletId,
        name: "Staff B With Pin",
        role: "staff",
        pinHash: hashSecret("4321"),
      },
    });

    await expect(signInWithPin(ctxA, staffB.id, "4321", null)).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
    expect((await listSwitchableUsers(ctxA)).map((u) => u.id)).not.toContain(staffB.id);
  });

  it("rate-limits wrong PINs per target user, ignoring any client key", async () => {
    const org = await prisma.organization.findFirstOrThrow({ select: { id: true } });
    const victim = await prisma.user.create({
      data: {
        organizationId: org.id,
        outletId: ctxA.outletId,
        name: "Rate Limited",
        role: "staff",
        pinHash: hashSecret("5555"),
      },
    });

    // Rotating the client key (what a spoofed X-Forwarded-For would do) must
    // not buy extra attempts, because the per-user window is header-blind.
    const codes: string[] = [];
    for (let i = 0; i < 14; i++) {
      const attempt = await signInWithPin(ctxA, victim.id, "0000", `rotating-${i}`).catch(
        (err) => err.code as string,
      );
      codes.push(String(attempt));
    }
    expect(codes.filter((c) => c === "INVALID_CREDENTIALS").length).toBe(10);
    expect(codes.filter((c) => c === "RATE_LIMITED").length).toBe(4);
  });
});

describe("extras on order lines", () => {
  let bacon: string;
  let salad: string;

  beforeAll(async () => {
    bacon = (await createModifier(ctxA, { name: "Bacon", priceCents: 400 })).id;
    salad = (await createModifier(ctxA, { name: "Double salad", priceCents: 700 })).id;
    // Momos offer bacon only — salad is deliberately not on the allow-list.
    await setItemModifiers(ctxA, momoA, [bacon]);
  });

  it("refuses a duplicate extra name and scopes the catalogue to the outlet", async () => {
    await expect(createModifier(ctxA, { name: "Bacon", priceCents: 100 })).rejects.toMatchObject({
      code: "VALIDATION",
    });
    expect((await listModifiers(ctxB)).map((m) => m.name)).not.toContain("Bacon");
    await expect(setItemModifiers(ctxB, momoA, [bacon])).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("snapshots the extra's name and price onto the line", async () => {
    // The order-lifecycle suite above reprices this item, so read it live
    // rather than assuming the seeded figure.
    const { priceCents: base } = await prisma.menuItem.findUniqueOrThrow({
      where: { id: momoA },
      select: { priceCents: true },
    });
    const order = await seatTable(ctxA, { tableId: tableA });
    const line = await addOrderItem(ctxA, order.id, {
      menuItemId: momoA,
      quantity: 2,
      modifierIds: [bacon],
    });
    expect(line.modifiers).toHaveLength(1);
    expect(line.modifiers[0]).toMatchObject({ name: "Bacon", priceCents: 400 });

    // Repricing the extra must not move an order already taken.
    await prisma.modifier.update({ where: { id: bacon }, data: { priceCents: 9999, name: "Pork" } });
    const reread = await getOrder(ctxA, order.id);
    expect(reread.items[0].modifiers[0]).toMatchObject({ name: "Bacon", priceCents: 400 });

    // (item + 400) × 2 — extras are priced per unit.
    expect(reread.runningTotalCents).toBe((base + 400) * 2);
    const tile = (await getTableBoard(ctxA)).find((t) => t.id === tableA);
    expect(tile?.order?.totalCents).toBe((base + 400) * 2);

    const settled = await settleOrder(ctxA, order.id, "cash");
    expect(settled.totalCents).toBe((base + 400) * 2);
    await prisma.modifier.update({ where: { id: bacon }, data: { priceCents: 400, name: "Bacon" } });
  });

  it("refuses an extra the dish doesn't offer, or one from another outlet", async () => {
    const order = await seatTable(ctxA, { tableId: tableA });
    await expect(
      addOrderItem(ctxA, order.id, { menuItemId: momoA, quantity: 1, modifierIds: [salad] }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const foreign = await createModifier(ctxB, { name: "Outlet B extra", priceCents: 500 });
    await expect(
      addOrderItem(ctxA, order.id, { menuItemId: momoA, quantity: 1, modifierIds: [foreign.id] }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await cancelOrder(ctxA, order.id);
  });

  it("won't delete an extra that is already on a bill", async () => {
    // `bacon` went onto a settled order above, so history depends on it.
    await expect(deleteModifier(ctxA, bacon)).rejects.toMatchObject({ code: "VALIDATION" });
    // An unused one deletes cleanly.
    const spare = await createModifier(ctxA, { name: "Never used", priceCents: 100 });
    await deleteModifier(ctxA, spare.id);
    expect((await listModifiers(ctxA)).some((m) => m.id === spare.id)).toBe(false);
  });
});

describe("floor plan", () => {
  it("adds a table with a zone, refuses a duplicate name, deletes a clean one", async () => {
    const t = await createTable(ctxA, { name: "Z9", capacity: 6, zone: "Loft" });
    expect(t.zone).toBe("Loft");
    await expect(createTable(ctxA, { name: "Z9", capacity: 2 })).rejects.toMatchObject({
      code: "VALIDATION",
    });
    expect((await listTables(ctxA)).find((r) => r.id === t.id)?.zone).toBe("Loft");

    // No orders and no bookings yet, so a hard delete is allowed.
    await deleteTable(ctxA, t.id);
    expect((await listTables(ctxA)).some((r) => r.id === t.id)).toBe(false);
  });

  it("won't retire an occupied table, won't delete one with history", async () => {
    const order = await seatTable(ctxA, { tableId: tableA });
    await expect(updateTable(ctxA, tableA, { active: false })).rejects.toMatchObject({
      code: "TABLE_OCCUPIED",
    });
    await cancelOrder(ctxA, order.id);

    // History exists now — retire is the only way out, and the board drops it.
    await expect(deleteTable(ctxA, tableA)).rejects.toMatchObject({ code: "VALIDATION" });
    await updateTable(ctxA, tableA, { active: false });
    expect((await getTableBoard(ctxA)).some((t) => t.id === tableA)).toBe(false);
    await updateTable(ctxA, tableA, { active: true });
  });

  it("scopes table edits to the session's outlet", async () => {
    await expect(updateTable(ctxB, tableA, { capacity: 9 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(deleteTable(ctxB, tableA)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("reservations", () => {
  const tz = "Asia/Kathmandu";
  let bookable: string; // a 6-seat table of outlet A, used only here
  let tomorrow: string;
  let morning: string;
  let lunch: string;
  let dinner: string;
  let brunch: string;
  let tea: string;
  let dawn: string;
  let earlyBird: string;
  let overlapsEarly: string;
  let evening: string;
  let late: string;

  beforeAll(async () => {
    bookable = (await createTable(ctxA, { name: "R1", capacity: 6, zone: "Courtyard" })).id;
    tomorrow = localDate(new Date(Date.now() + 24 * 60 * 60 * 1000), tz);
    // Bookings are taken against periods, never raw clock times.
    morning = (await createServicePeriod(ctxA, { name: "Morning", startTime: "09:00", endTime: "11:00" })).id;
    brunch = (await createServicePeriod(ctxA, { name: "Brunch", startTime: "10:00", endTime: "12:00" })).id;
    tea = (await createServicePeriod(ctxA, { name: "Tea", startTime: "15:00", endTime: "16:00" })).id;
    dawn = (await createServicePeriod(ctxA, { name: "Dawn", startTime: "06:00", endTime: "07:00" })).id;
    earlyBird = (await createServicePeriod(ctxA, { name: "Early bird", startTime: "07:00", endTime: "08:00" })).id;
    overlapsEarly = (await createServicePeriod(ctxA, { name: "Overlaps early", startTime: "07:30", endTime: "08:30" })).id;
    lunch = (await createServicePeriod(ctxA, { name: "Lunch", startTime: "12:00", endTime: "14:00" })).id;
    dinner = (await createServicePeriod(ctxA, { name: "Dinner", startTime: "19:00", endTime: "21:00" })).id;
    evening = (await createServicePeriod(ctxA, { name: "Evening", startTime: "20:00", endTime: "22:00" })).id;
    late = (await createServicePeriod(ctxA, { name: "Late", startTime: "21:00", endTime: "22:30" })).id;
  });

  it("books a window and refuses an overlapping one on the same table", async () => {
    const booking = await createReservation(ctxA, {
      tableId: bookable,
      customerName: "Sharma",
      partySize: 4,
      date: tomorrow,
      servicePeriodId: dinner,
    });
    expect(booking.status).toBe("confirmed");
    // The period name is snapshotted onto the booking, like an order line's price.
    expect(booking.periodLabel).toBe("Dinner");
    expect(booking.servicePeriodId).toBe(dinner);

    await expect(
      createReservation(ctxA, {
        tableId: bookable,
        customerName: "Gurung",
        partySize: 2,
        date: tomorrow,
        servicePeriodId: evening, // 20:00–22:00 straddles dinner's 19:00–21:00
      }),
    ).rejects.toMatchObject({ code: "TABLE_DOUBLE_BOOKED" });

    // Back-to-back is not an overlap: Late starts exactly when Dinner ends.
    const after = await createReservation(ctxA, {
      tableId: bookable,
      customerName: "Rai",
      partySize: 2,
      date: tomorrow,
      servicePeriodId: late,
    });
    expect(after.id).toBeTruthy();

    await cancelReservation(ctxA, booking.id);
    await cancelReservation(ctxA, after.id);
  });

  it("a cancelled or no-show booking releases its window", async () => {
    const first = await createReservation(ctxA, {
      tableId: bookable,
      customerName: "Thapa",
      partySize: 2,
      date: tomorrow,
      servicePeriodId: lunch,
    });
    await markNoShow(ctxA, first.id);
    // Same slot, now free.
    const second = await createReservation(ctxA, {
      tableId: bookable,
      customerName: "Shakya",
      partySize: 2,
      date: tomorrow,
      servicePeriodId: lunch,
    });
    expect(second.id).not.toBe(first.id);
    await cancelReservation(ctxA, second.id);

    // Closing a closed booking is refused rather than silently repeated.
    await expect(cancelReservation(ctxA, second.id)).rejects.toMatchObject({
      code: "RESERVATION_CLOSED",
    });
  });

  it("refuses a party that doesn't fit and a window that already ended", async () => {
    await expect(
      createReservation(ctxA, {
        tableId: bookable,
        customerName: "Big group",
        partySize: 9, // table seats 6
        date: tomorrow,
        servicePeriodId: dinner,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });

    await expect(
      createReservation(ctxA, {
        tableId: bookable,
        customerName: "Yesterday",
        partySize: 2,
        date: localDate(new Date(Date.now() - 48 * 60 * 60 * 1000), tz),
        servicePeriodId: dinner,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });

    // Neither a period nor all-day: there is no window to hold.
    await expect(
      createReservation(ctxA, {
        tableId: bookable,
        customerName: "Vague",
        partySize: 2,
        date: tomorrow,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });

    // A period from another outlet can't be borrowed to book this table.
    const foreign = await createServicePeriod(ctxB, {
      name: "Outlet B brunch",
      startTime: "10:00",
      endTime: "12:00",
    });
    await expect(
      createReservation(ctxA, {
        tableId: bookable,
        customerName: "Intruder",
        partySize: 2,
        date: tomorrow,
        servicePeriodId: foreign.id,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("shows an all-day hold on the board and seats it into a linked order", async () => {
    const today = localDate(new Date(), tz);
    const booking = await createReservation(ctxA, {
      tableId: bookable,
      customerName: "Adhikari",
      partySize: 5,
      phone: "+977-1-5550000",
      date: today,
      allDay: true,
      notes: "birthday",
    });

    // Reserved is derived: the hold shows without any status column.
    const holds = await reservationHoldsByTable(ctxA);
    expect(holds.get(bookable)).toMatchObject({ customerName: "Adhikari", active: true });
    const tile = (await getTableBoard(ctxA)).find((t) => t.id === bookable);
    expect(tile?.order).toBeNull();
    expect(tile?.hold?.customerName).toBe("Adhikari");

    // Seating carries the booking's name and party onto the order.
    const order = await seatReservation(ctxA, booking.id);
    expect(order.customerName).toBe("Adhikari");
    expect(order.guestCount).toBe(5);

    const seatedTile = (await getTableBoard(ctxA)).find((t) => t.id === bookable);
    expect(seatedTile?.order?.id).toBe(order.id);
    // A seated booking is no longer a hold: the tile must not go on offering
    // "tap to seat them" for a party already at the table.
    expect(seatedTile?.hold).toBeNull();

    // The booking is closed out and linked, so it can't be seated twice.
    await expect(seatReservation(ctxA, booking.id)).rejects.toMatchObject({
      code: "RESERVATION_CLOSED",
    });
    const listed = await listReservations(ctxA, today);
    expect(listed.reservations.find((r) => r.id === booking.id)).toMatchObject({
      status: "seated",
      orderId: order.id,
      notes: "birthday",
    });

    // …and once their order closes the table reads free, not falsely reserved,
    // even though the all-day window is still running.
    await cancelOrder(ctxA, order.id);
    const afterTile = (await getTableBoard(ctxA)).find((t) => t.id === bookable);
    expect(afterTile?.order).toBeNull();
    expect(afterTile?.hold).toBeNull();
  });

  it("a seated booking still owns its window", async () => {
    // Morning slot tomorrow, so this never races the real clock.
    const held = await createReservation(ctxA, {
      tableId: bookable,
      customerName: "Early",
      partySize: 2,
      date: tomorrow,
      servicePeriodId: morning,
    });
    await seatReservation(ctxA, held.id);

    // Seated is excluded from board holds but still counted by the overlap
    // check — the party is at the table, nobody else may be promised it.
    await expect(
      createReservation(ctxA, {
        tableId: bookable,
        customerName: "Opportunist",
        partySize: 2,
        date: tomorrow,
        servicePeriodId: brunch, // 10:00–12:00 straddles Morning's 09:00–11:00
      }),
    ).rejects.toMatchObject({ code: "TABLE_DOUBLE_BOOKED" });

    const open = await prisma.order.findFirstOrThrow({
      where: { tableId: bookable, status: "open" },
    });
    await cancelOrder(ctxA, open.id);
  });

  it("a staff-taken booking is confirmed; an unconfirmed one needs confirming", async () => {
    const straight = await createReservation(ctxA, {
      tableId: bookable,
      customerName: "Direct",
      partySize: 2,
      date: tomorrow,
      servicePeriodId: dawn,
    });
    // The host taking it IS the confirmation — no ceremony for their own typing.
    expect(straight.status).toBe("confirmed");

    const tentative = await createReservation(ctxA, {
      tableId: bookable,
      customerName: "Ringing back",
      phone: "+977-9811111111",
      email: "RingBack@Example.com",
      partySize: 2,
      date: tomorrow,
      servicePeriodId: earlyBird,
      needsConfirmation: true,
    });
    expect(tentative.status).toBe("incoming");
    expect(tentative.email).toBe("ringback@example.com"); // normalised

    // An unconfirmed hold still owns its window.
    await expect(
      createReservation(ctxA, {
        tableId: bookable,
        customerName: "Chancer",
        partySize: 2,
        date: tomorrow,
        servicePeriodId: overlapsEarly, // 07:30–08:30 straddles the unconfirmed hold
      }),
    ).rejects.toMatchObject({ code: "TABLE_DOUBLE_BOOKED" });

    await confirmReservation(ctxA, tentative.id);
    const listed = await listReservations(ctxA, tomorrow);
    expect(listed.reservations.find((r) => r.id === tentative.id)?.status).toBe("confirmed");
    // Confirming twice is harmless rather than an error mid-service.
    await expect(confirmReservation(ctxA, tentative.id)).resolves.toBeUndefined();

    await cancelReservation(ctxA, straight.id);
    await cancelReservation(ctxA, tentative.id);
  });

  it("reads as completed once the seated party's order is settled", async () => {
    const today = localDate(new Date(), tz);
    // Its own table: the all-day hold above still owns today on `bookable`.
    const paidTable = (await createTable(ctxA, { name: "P1", capacity: 4 })).id;
    const booking = await createReservation(ctxA, {
      tableId: paidTable,
      customerName: "Payer",
      partySize: 2,
      date: today,
      allDay: true,
    });
    const order = await seatReservation(ctxA, booking.id);
    await addOrderItem(ctxA, order.id, { menuItemId: momoA, quantity: 1 });

    const seatedRow = (await listReservations(ctxA, today)).reservations.find(
      (r) => r.id === booking.id,
    );
    expect(seatedRow?.displayStatus).toBe("seated");

    await settleOrder(ctxA, order.id, "cash");
    const paidRow = (await listReservations(ctxA, today)).reservations.find(
      (r) => r.id === booking.id,
    );
    // Derived from the order, so the card can never disagree with the bill.
    expect(paidRow?.status).toBe("seated");
    expect(paidRow?.displayStatus).toBe("completed");
  });

  it("keeps a booking put when its period is retimed or renamed", async () => {
    const period = await createServicePeriod(ctxA, {
      name: "Supper",
      startTime: "17:00",
      endTime: "18:00",
    });
    const booking = await createReservation(ctxA, {
      tableId: bookable,
      customerName: "Snapshot",
      partySize: 2,
      date: tomorrow,
      servicePeriodId: period.id,
    });
    expect(booking.periodLabel).toBe("Supper");

    // Move the period two hours later and rename it. The booking already taken
    // must not follow — same law as a menu edit not rewriting a printed bill.
    await updateServicePeriod(ctxA, period.id, {
      name: "Early supper",
      startTime: "19:00",
      endTime: "20:00",
    });
    const after = await prisma.reservation.findUniqueOrThrow({ where: { id: booking.id } });
    expect(after.periodLabel).toBe("Supper");
    expect(after.startAt.getTime()).toBe(booking.startAt.getTime());
    expect(after.endAt.getTime()).toBe(booking.endAt.getTime());

    await cancelReservation(ctxA, booking.id);
    // A period with bookings against it can be retired but never deleted.
    await expect(deleteServicePeriod(ctxA, period.id)).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("refuses a period that ends before it starts, and a duplicate name", async () => {
    await expect(
      createServicePeriod(ctxA, { name: "Backwards", startTime: "21:00", endTime: "19:00" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      createServicePeriod(ctxA, { name: "Dinner", startTime: "19:00", endTime: "20:00" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    // Outlet B may reuse the name — the catalogue is per outlet.
    const twin = await createServicePeriod(ctxB, {
      name: "Dinner",
      startTime: "19:00",
      endTime: "21:00",
    });
    expect(twin.name).toBe("Dinner");
    expect((await listServicePeriods(ctxA)).some((p) => p.id === twin.id)).toBe(false);
  });

  it("an all-day hold marks the table taken on the board", async () => {
    const today = localDate(new Date(), tz);
    const table = (await createTable(ctxA, { name: "LIVE1", capacity: 4 })).id;
    const booking = await createReservation(ctxA, {
      tableId: table,
      customerName: "Right now",
      partySize: 2,
      date: today,
      allDay: true,
    });
    expect(booking.periodLabel).toBe("All day");

    // `active` is what the board turns into the occupied treatment: the window
    // covers this instant, so the tile must not read free.
    const hold = (await reservationHoldsByTable(ctxA)).get(table);
    expect(hold).toMatchObject({ active: true, periodLabel: "All day" });

    const tile = (await getTableBoard(ctxA)).find((t) => t.id === table);
    expect(tile?.order).toBeNull();
    expect(tile?.hold?.active).toBe(true);

    // Still seatable, though: a live hold changes what the board says, not what
    // the domain permits — a walk-in is the host's call.
    const walkIn = await seatTable(ctxA, { tableId: table, customerName: "Walk-in" });
    expect(walkIn.customerName).toBe("Walk-in");
    await cancelOrder(ctxA, walkIn.id);
    await cancelReservation(ctxA, booking.id);
  });

  it("keeps bookings inside their outlet", async () => {
    const mine = await createReservation(ctxA, {
      tableId: bookable,
      customerName: "Private",
      partySize: 2,
      date: tomorrow,
      servicePeriodId: tea,
    });

    // Outlet B can neither book A's table nor touch A's booking.
    await expect(
      createReservation(ctxB, {
        tableId: bookable,
        customerName: "Intruder",
        partySize: 2,
        date: tomorrow,
        servicePeriodId: tea,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(seatReservation(ctxB, mine.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(cancelReservation(ctxB, mine.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await listReservations(ctxB, tomorrow)).reservations).toHaveLength(0);

    await cancelReservation(ctxA, mine.id);
  });
});

describe("backup round-trip", () => {
  it("export → destroy → restore reproduces every row", async () => {
    // A booking that survived the reservation suite, so the round trip has one
    // to carry — v1 backups predate this table and lost every booking silently.
    const backupPeriod = await createServicePeriod(ctxA, {
      name: "Backup supper",
      startTime: "19:30",
      endTime: "21:30",
    });
    const sampleBooking = await createReservation(ctxA, {
      tableId: (await createTable(ctxA, { name: "B1", capacity: 4, zone: "Terrace" })).id,
      customerName: "Backup Guest",
      partySize: 3,
      date: localDate(new Date(Date.now() + 24 * 60 * 60 * 1000), "Asia/Kathmandu"),
      servicePeriodId: backupPeriod.id,
      notes: "keep me",
    });

    const backup = await exportOrganization(ctxA);
    const countsBefore = {
      orders: await prisma.order.count(),
      items: await prisma.orderItem.count(),
      users: await prisma.user.count(),
      menuItems: await prisma.menuItem.count(),
      reservations: await prisma.reservation.count(),
      modifiers: await prisma.modifier.count(),
      itemExtras: await prisma.menuItemModifier.count(),
      lineExtras: await prisma.orderItemModifier.count(),
      servicePeriods: await prisma.servicePeriod.count(),
    };
    expect(countsBefore.reservations).toBeGreaterThan(0);
    expect(countsBefore.servicePeriods).toBeGreaterThan(0);
    // v3 added the extras catalogue; a bill carrying one must survive too.
    expect(countsBefore.lineExtras).toBeGreaterThan(0);
    const sampleOrder = await prisma.order.findFirstOrThrow({ where: { status: "settled" } });

    // Wipe by restoring over a mutilated database.
    await prisma.reservation.deleteMany();
    await prisma.orderItemModifier.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.menuItemModifier.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.modifier.deleteMany();
    await prisma.servicePeriod.deleteMany();
    expect(await prisma.order.count()).toBe(0);
    expect(await prisma.servicePeriod.count()).toBe(0);
    expect(await prisma.reservation.count()).toBe(0);
    expect(await prisma.modifier.count()).toBe(0);

    await restoreOrganization(prisma, backup);

    expect({
      orders: await prisma.order.count(),
      items: await prisma.orderItem.count(),
      users: await prisma.user.count(),
      menuItems: await prisma.menuItem.count(),
      reservations: await prisma.reservation.count(),
      modifiers: await prisma.modifier.count(),
      itemExtras: await prisma.menuItemModifier.count(),
      lineExtras: await prisma.orderItemModifier.count(),
      servicePeriods: await prisma.servicePeriod.count(),
    }).toEqual(countsBefore);

    const restored = await prisma.order.findUniqueOrThrow({ where: { id: sampleOrder.id } });
    expect(restored.totalCents).toBe(sampleOrder.totalCents);
    expect(restored.status).toBe("settled");
    expect(restored.settledAt?.getTime()).toBe(sampleOrder.settledAt?.getTime());

    const booking = await prisma.reservation.findUniqueOrThrow({ where: { id: sampleBooking.id } });
    expect(booking.customerName).toBe("Backup Guest");
    expect(booking.notes).toBe("keep me");
    expect(booking.startAt.getTime()).toBe(sampleBooking.startAt.getTime());
  });

  it("restores over a populated database without wiping it first", async () => {
    // The regression: restore used to lean on a cascade from Organization, but
    // Order's required relations default to Restrict, so any org with an order
    // failed on a foreign key. This is the real admin path — no manual wipe.
    const before = await prisma.order.count();
    expect(before).toBeGreaterThan(0);
    const backup = await exportOrganization(ctxA);
    await expect(restoreOrganization(prisma, backup)).resolves.toBeUndefined();
    expect(await prisma.order.count()).toBe(before);
  });

  it("still restores a v1 file, which predates bookings and extras", async () => {
    const current = await exportOrganization(ctxA);
    const legacy = { ...current, version: 1 };
    delete (legacy as { reservations?: unknown }).reservations;
    delete (legacy as { modifiers?: unknown }).modifiers;
    delete (legacy as { menuItemModifiers?: unknown }).menuItemModifiers;
    delete (legacy as { orderItemModifiers?: unknown }).orderItemModifiers;
    delete (legacy as { servicePeriods?: unknown }).servicePeriods;
    await expect(restoreOrganization(prisma, legacy)).resolves.toBeUndefined();
    expect(await prisma.reservation.count()).toBe(0);
    expect(await prisma.modifier.count()).toBe(0);
    expect(await prisma.servicePeriod.count()).toBe(0);
  });

  it("refuses foreign or malformed backups", async () => {
    await expect(
      restoreOrganization(prisma, { version: 99 } as never),
    ).rejects.toBeInstanceOf(PosError);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  await rm("data/test.db", { force: true }).catch(() => {});
});
