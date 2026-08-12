import { PosError } from "@restro/domain/errors";
import type { SessionContext } from "./session";

// Floor-plan management: the tables themselves, their seats, and where they
// stand. Occupancy is NOT here — that stays derived from open orders
// (src/lib/orders.ts). This module only shapes the room.

export interface TableInput {
  name: string;
  capacity: number;
  zone?: string;
  shape?: string;
  sortOrder?: number;
}

/**
 * Every table including retired ones, for the management screen. Ordered so
 * the screen can group by zone without re-sorting: zone, then the manager's
 * explicit order, then name.
 */
export async function listTables(ctx: SessionContext) {
  return ctx.db.diningTable.findMany({
    where: { outletId: ctx.outletId },
    orderBy: [{ zone: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      capacity: true,
      zone: true,
      shape: true,
      sortOrder: true,
      active: true,
      _count: { select: { orders: true, reservations: true } },
    },
  });
}

/** Active tables only, for pickers: seat a party, take a booking. */
export async function listBookableTables(ctx: SessionContext) {
  return ctx.db.diningTable.findMany({
    where: { outletId: ctx.outletId, active: true },
    orderBy: [{ zone: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, capacity: true, zone: true, shape: true },
  });
}

/** Table names must be unique per outlet — staff call out "T4", not an id. */
async function assertNameFree(ctx: SessionContext, name: string, exceptId?: string) {
  const clash = await ctx.db.diningTable.findFirst({
    where: {
      outletId: ctx.outletId,
      name,
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true },
  });
  if (clash) throw new PosError("VALIDATION", `This outlet already has a table called ${name}.`);
}

export async function createTable(ctx: SessionContext, input: TableInput) {
  await assertNameFree(ctx, input.name);
  return ctx.db.diningTable.create({
    data: {
      outletId: ctx.outletId,
      name: input.name,
      capacity: input.capacity,
      zone: input.zone?.trim() ?? "",
      shape: input.shape ?? "rect",
      sortOrder: input.sortOrder ?? 0,
    },
    select: {
      id: true,
      name: true,
      capacity: true,
      zone: true,
      shape: true,
      sortOrder: true,
      active: true,
    },
  });
}

export async function updateTable(
  ctx: SessionContext,
  tableId: string,
  input: Partial<TableInput> & { active?: boolean },
) {
  const table = await ctx.db.diningTable.findFirst({
    where: { id: tableId, outletId: ctx.outletId },
    select: { id: true },
  });
  if (!table) throw new PosError("NOT_FOUND", "Table not found.");
  if (input.name !== undefined) await assertNameFree(ctx, input.name, tableId);

  // Retiring a table mid-service would strand its bill: the board drops it, but
  // the open order stays reachable only through history. Block it instead.
  if (input.active === false) {
    const open = await ctx.db.order.findFirst({
      where: { tableId, status: "open" },
      select: { id: true },
    });
    if (open) throw new PosError("TABLE_OCCUPIED", "Settle or cancel this table's order first.");
  }

  await ctx.db.diningTable.update({
    where: { id: tableId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
      ...(input.zone !== undefined ? { zone: input.zone.trim() } : {}),
      ...(input.shape !== undefined ? { shape: input.shape } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
  });
}

/**
 * Hard delete, allowed only for a table that never took an order or a booking.
 * Anything with history must be retired (`active: false`) instead — bills are
 * immutable history and a deleted table would take its orders with it
 * (`Order.tableId` has no null state).
 */
export async function deleteTable(ctx: SessionContext, tableId: string) {
  const table = await ctx.db.diningTable.findFirst({
    where: { id: tableId, outletId: ctx.outletId },
    select: { _count: { select: { orders: true, reservations: true } } },
  });
  if (!table) throw new PosError("NOT_FOUND", "Table not found.");
  if (table._count.orders > 0 || table._count.reservations > 0) {
    throw new PosError(
      "VALIDATION",
      "This table has history — retire it instead, so its past bills stay readable.",
    );
  }
  await ctx.db.diningTable.delete({ where: { id: tableId } });
}
