import { prisma } from "./db";
import { getRestaurant } from "./restaurant";

export interface PublicMenuItem {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  dietaryTags: string[];
  available: boolean;
}

export interface PublicMenuCategory {
  id: string;
  name: string;
  items: PublicMenuItem[];
}

export interface PublicMenu {
  currency: string;
  categories: PublicMenuCategory[];
}

/** Published categories and items only — drafts never reach the public site. */
export async function getPublishedMenu(): Promise<PublicMenu> {
  const restaurant = await getRestaurant();
  const categories = await prisma.menuCategory.findMany({
    where: { restaurantId: restaurant.id, published: true },
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
          dietaryTags: true,
          available: true,
        },
      },
    },
  });

  return {
    currency: restaurant.currency,
    categories: categories.filter((c) => c.items.length > 0),
  };
}
