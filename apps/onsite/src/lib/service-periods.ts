import { PosError } from "@restro/domain/errors";
import { DEFAULT_SERVICE_PERIODS } from "@restro/domain/constants";
import { isCanonicalTime } from "@restro/domain/time";
import type { SessionContext } from "./session";

/**
 * Service periods: the named stretches of the trading day a booking can be
 * taken against — Breakfast, Lunch, Dinner, or whatever this outlet calls them.
 *
 * The reason bookings work this way rather than by clock time: a restaurant
 * can't promise a party will sit down at 19:15. It can promise them dinner. The
 * period's wall-clock window is still what becomes the booking's UTC hold, so
 * the overlap rule, the board and the reports are unchanged underneath — only
 * the thing a host is asked to choose has changed.
 */

export interface ServicePeriodInput {
  name: string;
  startTime: string;
  endTime: string;
  sortOrder?: number;
}

export async function listServicePeriods(ctx: SessionContext, includeRetired = false) {
  return ctx.db.servicePeriod.findMany({
    where: { outletId: ctx.outletId, ...(includeRetired ? {} : { active: true }) },
    orderBy: [{ sortOrder: "asc" }, { startTime: "asc" }],
    select: {
      id: true,
      name: true,
      startTime: true,
      endTime: true,
      sortOrder: true,
      active: true,
    },
  });
}

function assertWindow(input: Pick<ServicePeriodInput, "startTime" | "endTime">) {
  if (!isCanonicalTime(input.startTime) || !isCanonicalTime(input.endTime)) {
    throw new PosError("VALIDATION", "Give times as HH:MM on a 24-hour clock.");
  }
  if (input.endTime <= input.startTime) {
    // A period that wraps midnight would need a second date to be unambiguous;
    // an outlet that trades past midnight can use an all-day hold instead.
    throw new PosError("VALIDATION", "A period has to end after it starts, on the same day.");
  }
}

async function assertNameFree(ctx: SessionContext, name: string, exceptId?: string) {
  const clash = await ctx.db.servicePeriod.findFirst({
    where: { outletId: ctx.outletId, name, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  });
  if (clash) throw new PosError("VALIDATION", `This outlet already has a period called ${name}.`);
}

export async function createServicePeriod(ctx: SessionContext, input: ServicePeriodInput) {
  assertWindow(input);
  await assertNameFree(ctx, input.name);
  return ctx.db.servicePeriod.create({
    data: {
      outletId: ctx.outletId,
      name: input.name,
      startTime: input.startTime,
      endTime: input.endTime,
      sortOrder: input.sortOrder ?? 0,
    },
    select: { id: true, name: true, startTime: true, endTime: true, sortOrder: true, active: true },
  });
}

export async function updateServicePeriod(
  ctx: SessionContext,
  periodId: string,
  input: Partial<ServicePeriodInput> & { active?: boolean },
) {
  const current = await ctx.db.servicePeriod.findFirst({
    where: { id: periodId, outletId: ctx.outletId },
    select: { startTime: true, endTime: true },
  });
  if (!current) throw new PosError("NOT_FOUND", "Service period not found.");
  if (input.startTime !== undefined || input.endTime !== undefined) {
    assertWindow({
      startTime: input.startTime ?? current.startTime,
      endTime: input.endTime ?? current.endTime,
    });
  }
  if (input.name !== undefined) await assertNameFree(ctx, input.name, periodId);

  // Retiming a period deliberately does NOT move existing bookings: their UTC
  // window and label are already snapshotted, exactly as an order line's price
  // is. Moving tonight's dinner because someone edited the schedule would be
  // the same class of bug as a menu edit rewriting a printed bill.
  await ctx.db.servicePeriod.update({ where: { id: periodId }, data: input });
}

/**
 * Retire rather than delete once bookings reference a period — the reservation
 * keeps its own label and window either way, but a live pointer is worth
 * keeping resolvable.
 */
export async function deleteServicePeriod(ctx: SessionContext, periodId: string) {
  const period = await ctx.db.servicePeriod.findFirst({
    where: { id: periodId, outletId: ctx.outletId },
    select: { _count: { select: { reservations: true } } },
  });
  if (!period) throw new PosError("NOT_FOUND", "Service period not found.");
  if (period._count.reservations > 0) {
    throw new PosError(
      "VALIDATION",
      "Bookings have been taken for this period — retire it instead of deleting it.",
    );
  }
  await ctx.db.servicePeriod.delete({ where: { id: periodId } });
}

/** Give a brand-new outlet a workable day so bookings can be taken at once. */
export async function seedDefaultServicePeriods(ctx: SessionContext, outletId: string) {
  await ctx.db.servicePeriod.createMany({
    data: DEFAULT_SERVICE_PERIODS.map((p) => ({ ...p, outletId })),
  });
}
