import { addDays, isCanonicalDate, localDate, localDayStartUtc, localMonth } from "./time";
import { PosError } from "./errors";
import type { SessionContext } from "./session";

export type ReportGroupBy = "day" | "month";

export interface SettledOrderFacts {
  settledAt: Date;
  totalCents: number;
  guestCount: number | null;
}

export interface ReportRow {
  /** "YYYY-MM-DD" for day grouping, "YYYY-MM" for month. */
  bucket: string;
  salesCents: number;
  orderCount: number;
  /** Guest counts where staff recorded them, else one per order. */
  customerCount: number;
  avgOrderCents: number;
}

/**
 * Pure bucketing over settled orders, in the OUTLET's timezone — a sale at
 * 11pm belongs to that evening's business day locally, wherever the server is.
 * Exported for tests.
 */
export function bucketSettledOrders(
  orders: SettledOrderFacts[],
  timezone: string,
  groupBy: ReportGroupBy,
): ReportRow[] {
  const buckets = new Map<string, { salesCents: number; orderCount: number; customerCount: number }>();
  for (const order of orders) {
    const key =
      groupBy === "day" ? localDate(order.settledAt, timezone) : localMonth(order.settledAt, timezone);
    const b = buckets.get(key) ?? { salesCents: 0, orderCount: 0, customerCount: 0 };
    b.salesCents += order.totalCents;
    b.orderCount += 1;
    b.customerCount += order.guestCount ?? 1;
    buckets.set(key, b);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([bucket, b]) => ({
      bucket,
      ...b,
      avgOrderCents: b.orderCount === 0 ? 0 : Math.round(b.salesCents / b.orderCount),
    }));
}

export interface SalesSummary {
  from: string;
  to: string;
  rows: ReportRow[];
  totals: Omit<ReportRow, "bucket">;
  voidCount: number;
}

/** Inclusive local-date range [from, to] for the session's outlet. */
export async function salesSummary(
  ctx: SessionContext,
  input: { from: string; to: string; groupBy: ReportGroupBy },
): Promise<SalesSummary> {
  if (!isCanonicalDate(input.from) || !isCanonicalDate(input.to) || input.from > input.to) {
    throw new PosError("VALIDATION", "Give a real date range as YYYY-MM-DD.");
  }
  const outlet = await ctx.db.outlet.findUniqueOrThrow({
    where: { id: ctx.outletId },
    select: { timezone: true },
  });
  const startUtc = localDayStartUtc(input.from, outlet.timezone);
  const endUtc = localDayStartUtc(addDays(input.to, 1), outlet.timezone);

  const [settled, voidCount] = await Promise.all([
    ctx.db.order.findMany({
      where: { outletId: ctx.outletId, status: "settled", settledAt: { gte: startUtc, lt: endUtc } },
      select: { settledAt: true, totalCents: true, guestCount: true },
    }),
    ctx.db.order.count({
      where: { outletId: ctx.outletId, status: "cancelled", settledAt: { gte: startUtc, lt: endUtc } },
    }),
  ]);

  const rows = bucketSettledOrders(
    settled.map((o) => ({ ...o, settledAt: o.settledAt! })),
    outlet.timezone,
    input.groupBy,
  );
  const totals = rows.reduce(
    (t, r) => ({
      salesCents: t.salesCents + r.salesCents,
      orderCount: t.orderCount + r.orderCount,
      customerCount: t.customerCount + r.customerCount,
      avgOrderCents: 0,
    }),
    { salesCents: 0, orderCount: 0, customerCount: 0, avgOrderCents: 0 },
  );
  totals.avgOrderCents = totals.orderCount === 0 ? 0 : Math.round(totals.salesCents / totals.orderCount);

  return { from: input.from, to: input.to, rows, totals, voidCount };
}
