import { PosError } from "@restro/domain/errors";
import type { SessionContext } from "./session";

/**
 * Extras: the outlet's catalogue of priced add-ons ("Bacon +4.00", "Double
 * salad +7.00") and which menu items offer each one.
 *
 * The catalogue is per outlet rather than per item because the same handful of
 * extras recurs across a menu, and the ordering screen shows the whole list on
 * every card so the rows sit in the same place each time. An item's allow-list
 * decides which rows are tickable; the rest render disabled rather than hidden,
 * which is what keeps the cards scannable.
 */

export interface ModifierInput {
  name: string;
  priceCents: number;
  sortOrder?: number;
}

/** The outlet's whole catalogue, active first, for the order screen and manager. */
export async function listModifiers(ctx: SessionContext, includeRetired = false) {
  return ctx.db.modifier.findMany({
    where: { outletId: ctx.outletId, ...(includeRetired ? {} : { active: true }) },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, priceCents: true, sortOrder: true, active: true },
  });
}

async function assertNameFree(ctx: SessionContext, name: string, exceptId?: string) {
  const clash = await ctx.db.modifier.findFirst({
    where: { outletId: ctx.outletId, name, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  });
  if (clash) throw new PosError("VALIDATION", `This outlet already has an extra called ${name}.`);
}

export async function createModifier(ctx: SessionContext, input: ModifierInput) {
  await assertNameFree(ctx, input.name);
  return ctx.db.modifier.create({
    data: {
      outletId: ctx.outletId,
      name: input.name,
      priceCents: input.priceCents,
      sortOrder: input.sortOrder ?? 0,
    },
    select: { id: true, name: true, priceCents: true, sortOrder: true, active: true },
  });
}

export async function updateModifier(
  ctx: SessionContext,
  modifierId: string,
  input: Partial<ModifierInput> & { active?: boolean },
) {
  if (input.name !== undefined) await assertNameFree(ctx, input.name, modifierId);
  const { count } = await ctx.db.modifier.updateMany({
    where: { id: modifierId, outletId: ctx.outletId },
    data: input,
  });
  if (count === 0) throw new PosError("NOT_FOUND", "Extra not found.");
}

/**
 * Retire rather than delete once an extra appears on a bill: `OrderItemModifier`
 * keeps its own name and price snapshots, so history survives either way, but
 * retiring also keeps the id resolvable for anyone reading an old order.
 */
export async function deleteModifier(ctx: SessionContext, modifierId: string) {
  const modifier = await ctx.db.modifier.findFirst({
    where: { id: modifierId, outletId: ctx.outletId },
    select: { _count: { select: { orderLines: true } } },
  });
  if (!modifier) throw new PosError("NOT_FOUND", "Extra not found.");
  if (modifier._count.orderLines > 0) {
    throw new PosError(
      "VALIDATION",
      "This extra is on past bills — retire it instead of deleting it.",
    );
  }
  await ctx.db.modifier.delete({ where: { id: modifierId } });
}

/**
 * Replace an item's allow-list wholesale. The manager screen sends the full set
 * of ticked extras, so a diff would only invent ways to disagree with the UI.
 */
export async function setItemModifiers(
  ctx: SessionContext,
  menuItemId: string,
  modifierIds: string[],
) {
  const item = await ctx.db.menuItem.findFirst({
    where: { id: menuItemId, category: { outletId: ctx.outletId } },
    select: { id: true },
  });
  if (!item) throw new PosError("NOT_FOUND", "Item not found.");

  // Every id must be this outlet's, or a crafted request could attach another
  // outlet's extra — and its price — to this menu.
  const owned = await ctx.db.modifier.findMany({
    where: { id: { in: modifierIds }, outletId: ctx.outletId },
    select: { id: true },
  });
  if (owned.length !== new Set(modifierIds).size) {
    throw new PosError("NOT_FOUND", "One of those extras isn't on this outlet's list.");
  }

  await ctx.db.$transaction(async (tx) => {
    await tx.menuItemModifier.deleteMany({ where: { menuItemId } });
    if (owned.length) {
      await tx.menuItemModifier.createMany({
        data: owned.map((m, i) => ({ menuItemId, modifierId: m.id, sortOrder: i })),
      });
    }
  });
}
