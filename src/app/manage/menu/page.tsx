import type { Metadata } from "next";
import { getOutletProfile } from "@/lib/outlet";
import { getFullMenu } from "@/lib/menu";
import { listModifiers } from "@/lib/modifiers";
import { requireRole } from "@/lib/session";
import { MenuManager } from "./menu-manager";

export const metadata: Metadata = { title: "Menu" };

export default async function ManageMenuPage() {
  const session = await requireRole("manager");
  const [categories, outlet, modifiers] = await Promise.all([
    getFullMenu(session),
    getOutletProfile(session),
    // Retired extras included: the manager needs to see them to restore one.
    listModifiers(session, true),
  ]);

  return (
    <div className="pt-6">
      <h1 className="font-display text-2xl">Menu</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Sold-out and hidden items disappear from the staff order screen immediately. Past bills
        never change.
      </p>
      <MenuManager
        currency={outlet.currency}
        modifiers={modifiers}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          published: c.published,
          items: c.items.map((i) => ({
            id: i.id,
            name: i.name,
            priceCents: i.priceCents,
            available: i.available,
            published: i.published,
            hasImage: i.hasImage,
            modifierIds: i.modifierIds,
          })),
        }))}
      />
    </div>
  );
}
