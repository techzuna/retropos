import { PosError } from "@restro/domain/errors";
import type { SessionContext } from "./session";

/**
 * The menu as staff see it while ordering: published only, with 86 flags,
 * thumbnails, and the ids of the extras each item offers.
 *
 * Only the ids — the order screen renders the outlet's whole extras catalogue
 * on every card (see `listModifiers`) and disables the rows an item doesn't
 * offer, so it needs the allow-list, not repeated copies of every price.
 */
export async function getOrderingMenu(ctx: SessionContext) {
  const categories = await ctx.db.menuCategory.findMany({
    where: { outletId: ctx.outletId, published: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      items: {
        where: { published: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          priceCents: true,
          imagePath: true,
          available: true,
          modifiers: { select: { modifierId: true }, orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  return categories
    .filter((c) => c.items.length > 0)
    .map((c) => ({
      ...c,
      items: c.items.map((i) => ({
        ...i,
        hasImage: i.imagePath !== "",
        modifierIds: i.modifiers.map((m) => m.modifierId),
      })),
    }));
}

/** Everything, for the manager's menu screen. */
export async function getFullMenu(ctx: SessionContext) {
  const categories = await ctx.db.menuCategory.findMany({
    where: { outletId: ctx.outletId },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: { modifiers: { select: { modifierId: true } } },
      },
    },
  });
  return categories.map((c) => ({
    ...c,
    items: c.items.map((i) => ({
      ...i,
      hasImage: i.imagePath !== "",
      modifierIds: i.modifiers.map((m) => m.modifierId),
    })),
  }));
}

export async function createCategory(ctx: SessionContext, input: { name: string; sortOrder?: number }) {
  return ctx.db.menuCategory.create({
    data: { outletId: ctx.outletId, name: input.name, sortOrder: input.sortOrder ?? 0 },
  });
}

export async function updateCategory(
  ctx: SessionContext,
  categoryId: string,
  input: { name?: string; sortOrder?: number; published?: boolean },
) {
  const { count } = await ctx.db.menuCategory.updateMany({
    where: { id: categoryId, outletId: ctx.outletId },
    data: input,
  });
  if (count === 0) throw new PosError("NOT_FOUND", "Category not found.");
}

export async function deleteCategory(ctx: SessionContext, categoryId: string) {
  // Cascades to items; past order lines keep their snapshots (menuItemId nulls).
  const { count } = await ctx.db.menuCategory.deleteMany({
    where: { id: categoryId, outletId: ctx.outletId },
  });
  if (count === 0) throw new PosError("NOT_FOUND", "Category not found.");
}

export interface MenuItemInput {
  name: string;
  description?: string;
  priceCents: number;
  available?: boolean;
  published?: boolean;
  sortOrder?: number;
}

export async function createItem(ctx: SessionContext, categoryId: string, input: MenuItemInput) {
  const category = await ctx.db.menuCategory.findFirst({
    where: { id: categoryId, outletId: ctx.outletId },
    select: { id: true },
  });
  if (!category) throw new PosError("NOT_FOUND", "Category not found.");
  return ctx.db.menuItem.create({ data: { categoryId, ...input } });
}

export async function updateItem(ctx: SessionContext, itemId: string, input: Partial<MenuItemInput>) {
  const { count } = await ctx.db.menuItem.updateMany({
    where: { id: itemId, category: { outletId: ctx.outletId } },
    data: input,
  });
  if (count === 0) throw new PosError("NOT_FOUND", "Item not found.");
}

export async function deleteItem(ctx: SessionContext, itemId: string) {
  const { count } = await ctx.db.menuItem.deleteMany({
    where: { id: itemId, category: { outletId: ctx.outletId } },
  });
  if (count === 0) throw new PosError("NOT_FOUND", "Item not found.");
}
