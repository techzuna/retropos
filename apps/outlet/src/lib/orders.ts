import { PosError } from "./errors";
import { DEFAULT_CUSTOMER_NAME, type PaymentMethod } from "./constants";
import { reservationHoldsByTable } from "./reservations";
import type { SessionContext } from "./session";

/** A priced line: the item snapshot, its chosen extras, and how many. */
export interface LineForTotal {
  priceCents: number;
  quantity: number;
  modifiers?: Array<{ priceCents: number }>;
}

/**
 * What one line costs: (item + its extras) × quantity. Extras are priced per
 * unit — two toasts with bacon is two bacons.
 */
export function lineTotalCents(line: LineForTotal): number {
  const extras = (line.modifiers ?? []).reduce((sum, m) => sum + m.priceCents, 0);
  return (line.priceCents + extras) * line.quantity;
}

/**
 * Pure money math: an order's total is always the sum of its line snapshots.
 * Exported for tests; every bill/report figure traces back to this.
 */
export function orderTotalCents(items: LineForTotal[]): number {
  return items.reduce((sum, it) => sum + lineTotalCents(it), 0);
}

/**
 * Table board. Both states on a tile are derived, never stored:
 * **occupied** iff an open order exists, **reserved** iff an active booking
 * covers now (or starts within the lead window). They are independent — a table
 * can be occupied by a walk-in and still carry a hold for later tonight.
 */
export async function getTableBoard(ctx: SessionContext) {
  const [tables, openOrders, holds] = await Promise.all([
    ctx.db.diningTable.findMany({
      where: { outletId: ctx.outletId, active: true },
      orderBy: [{ zone: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, capacity: true, zone: true, shape: true },
    }),
    ctx.db.order.findMany({
      where: { outletId: ctx.outletId, status: "open" },
      select: {
        id: true,
        tableId: true,
        customerName: true,
        guestCount: true,
        openedAt: true,
        items: {
          select: {
            priceCents: true,
            quantity: true,
            modifiers: { select: { priceCents: true } },
          },
        },
      },
    }),
    reservationHoldsByTable(ctx),
  ]);

  const byTable = new Map(openOrders.map((o) => [o.tableId, o]));
  return tables.map((t) => {
    const order = byTable.get(t.id);
    return {
      ...t,
      order: order
        ? {
            id: order.id,
            customerName: order.customerName,
            guestCount: order.guestCount,
            openedAt: order.openedAt,
            itemCount: order.items.reduce((n, it) => n + it.quantity, 0),
            totalCents: orderTotalCents(order.items),
          }
        : null,
      hold: holds.get(t.id) ?? null,
    };
  });
}

/**
 * One table plus the id of its open order, if any — what the order screen
 * needs to decide between the seat form and the order form. Null when the
 * table isn't this outlet's, which the page turns into a 404.
 *
 * Also returns the current hold, so the seat form can offer "Seat <the booking>"
 * as the one-tap path instead of making the host retype a name they already
 * have.
 */
export async function getTableForOrdering(ctx: SessionContext, tableId: string) {
  const table = await ctx.db.diningTable.findFirst({
    where: { id: tableId, outletId: ctx.outletId, active: true },
    select: { id: true, name: true, capacity: true, zone: true },
  });
  if (!table) return null;
  const [openOrder, holds] = await Promise.all([
    ctx.db.order.findFirst({
      where: { tableId: table.id, status: "open" },
      select: { id: true },
    }),
    reservationHoldsByTable(ctx),
  ]);
  return { table, openOrderId: openOrder?.id ?? null, hold: holds.get(table.id) ?? null };
}

export async function seatTable(
  ctx: SessionContext,
  input: { tableId: string; customerName?: string; guestCount?: number },
) {
  const table = await ctx.db.diningTable.findFirst({
    where: { id: input.tableId, outletId: ctx.outletId, active: true },
    select: { id: true },
  });
  if (!table) throw new PosError("NOT_FOUND", "No such table in this outlet.");

  // SQLite serializes writes, so the check-then-create inside one transaction
  // cannot interleave with another seat of the same table.
  return ctx.db.$transaction(async (tx) => {
    const existing = await tx.order.findFirst({
      where: { tableId: table.id, status: "open" },
      select: { id: true },
    });
    if (existing) throw new PosError("TABLE_OCCUPIED", "That table already has an open order.");
    return tx.order.create({
      data: {
        outletId: ctx.outletId,
        tableId: table.id,
        customerName: input.customerName?.trim() || DEFAULT_CUSTOMER_NAME,
        guestCount: input.guestCount,
        openedById: ctx.userId,
      },
    });
  });
}

export async function getOrder(ctx: SessionContext, orderId: string) {
  const order = await ctx.db.order.findFirst({
    where: { id: orderId, outletId: ctx.outletId },
    include: {
      items: {
        orderBy: { addedAt: "asc" },
        include: { modifiers: { select: { id: true, name: true, priceCents: true } } },
      },
      table: { select: { name: true } },
      openedBy: { select: { name: true } },
      settledBy: { select: { name: true } },
    },
  });
  if (!order) throw new PosError("NOT_FOUND", "Order not found.");
  return {
    ...order,
    // Live total for open orders; settled/cancelled orders show frozen state.
    runningTotalCents: order.status === "open" ? orderTotalCents(order.items) : order.totalCents,
  };
}

async function getOpenOrder(ctx: SessionContext, orderId: string) {
  const order = await ctx.db.order.findFirst({
    where: { id: orderId, outletId: ctx.outletId },
    select: { id: true, status: true },
  });
  if (!order) throw new PosError("NOT_FOUND", "Order not found.");
  if (order.status !== "open") {
    throw new PosError("ORDER_NOT_OPEN", "This order is closed and can't be changed.");
  }
  return order;
}

export async function addOrderItem(
  ctx: SessionContext,
  orderId: string,
  input: { menuItemId: string; quantity: number; notes?: string; modifierIds?: string[] },
) {
  await getOpenOrder(ctx, orderId);
  const item = await ctx.db.menuItem.findFirst({
    where: {
      id: input.menuItemId,
      published: true,
      category: { outletId: ctx.outletId, published: true },
    },
    select: { id: true, name: true, priceCents: true, available: true },
  });
  if (!item) throw new PosError("NOT_FOUND", "That item isn't on this outlet's menu.");
  if (!item.available) throw new PosError("ITEM_UNAVAILABLE", `${item.name} is sold out today.`);

  // Extras are resolved from the item's own allow-list, so a client can neither
  // invent a price nor attach an extra this dish doesn't offer. Prices come
  // from the database at add-time, exactly as the base item's does.
  const wanted = [...new Set(input.modifierIds ?? [])];
  const extras = wanted.length
    ? await ctx.db.modifier.findMany({
        where: {
          id: { in: wanted },
          outletId: ctx.outletId,
          active: true,
          items: { some: { menuItemId: item.id } },
        },
        select: { id: true, name: true, priceCents: true },
      })
    : [];
  if (extras.length !== wanted.length) {
    throw new PosError("NOT_FOUND", `One of those extras isn't offered on ${item.name}.`);
  }

  // Snapshot name and price: later menu edits must never change this order.
  return ctx.db.orderItem.create({
    data: {
      orderId,
      menuItemId: item.id,
      name: item.name,
      priceCents: item.priceCents,
      quantity: input.quantity,
      notes: input.notes?.trim() ?? "",
      modifiers: {
        create: extras.map((m) => ({
          modifierId: m.id,
          name: m.name,
          priceCents: m.priceCents,
        })),
      },
    },
    include: { modifiers: { select: { id: true, name: true, priceCents: true } } },
  });
}

export async function updateOrderItem(
  ctx: SessionContext,
  orderId: string,
  itemId: string,
  input: { quantity?: number; notes?: string },
) {
  await getOpenOrder(ctx, orderId);
  const { count } = await ctx.db.orderItem.updateMany({
    where: { id: itemId, orderId },
    data: {
      ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
      ...(input.notes !== undefined ? { notes: input.notes.trim() } : {}),
    },
  });
  if (count === 0) throw new PosError("NOT_FOUND", "That line isn't on this order.");
}

export async function removeOrderItem(ctx: SessionContext, orderId: string, itemId: string) {
  await getOpenOrder(ctx, orderId);
  const { count } = await ctx.db.orderItem.deleteMany({ where: { id: itemId, orderId } });
  if (count === 0) throw new PosError("NOT_FOUND", "That line isn't on this order.");
}

/**
 * Settle: freeze the total from line snapshots, record method and settler,
 * release the table (occupancy is derived, so the update IS the release).
 * The guarded `status: "open"` update makes concurrent double-settles lose.
 */
export async function settleOrder(ctx: SessionContext, orderId: string, method: PaymentMethod) {
  return ctx.db.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, outletId: ctx.outletId },
      include: {
        items: {
          select: {
            priceCents: true,
            quantity: true,
            modifiers: { select: { priceCents: true } },
          },
        },
      },
    });
    if (!order) throw new PosError("NOT_FOUND", "Order not found.");
    if (order.status !== "open") throw new PosError("ORDER_NOT_OPEN", "Already settled or cancelled.");
    if (order.items.length === 0) {
      throw new PosError("ORDER_NOT_OPEN", "Nothing on this order yet — add items or cancel it.");
    }

    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: "open" },
      data: {
        status: "settled",
        paymentMethod: method,
        totalCents: orderTotalCents(order.items),
        settledById: ctx.userId,
        settledAt: new Date(),
      },
    });
    if (count === 0) throw new PosError("ORDER_NOT_OPEN", "Already settled or cancelled.");
    return tx.order.findUniqueOrThrow({ where: { id: orderId } });
  });
}

/** Void an order: excluded from sales, kept for audit, table released. */
export async function cancelOrder(ctx: SessionContext, orderId: string) {
  const order = await ctx.db.order.findFirst({
    where: { id: orderId, outletId: ctx.outletId },
    select: { id: true },
  });
  if (!order) throw new PosError("NOT_FOUND", "Order not found.");
  const { count } = await ctx.db.order.updateMany({
    where: { id: orderId, status: "open" },
    data: { status: "cancelled", settledById: ctx.userId, settledAt: new Date() },
  });
  if (count === 0) throw new PosError("ORDER_NOT_OPEN", "Already settled or cancelled.");
}
