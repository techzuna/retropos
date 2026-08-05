// Idempotent seed: skips if an organization exists, so it's safe on every
// deploy. Demo data — replace with the real business via the owner screens.
//
// Demo credentials (dev only — change in production):
//   owner:   yogalajay@gmail.com / owner1234   (no PIN — see below)
//   manager: manager@chulho.demo / manager1234 (PIN 2222, Jhamsikhel)
//   staff:   Sita (PIN 3333), Hari (PIN 4444) — Jhamsikhel floor
//
// The owner has NO PIN on purpose: PIN switching is for the floor (staff and
// managers of the attached outlet), and a 4-digit code must never unlock user
// creation or a whole-organization backup. Owners sign in at /login.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./data/app.db" }),
});

const hash = (s: string) => bcrypt.hashSync(s, 10);

const item = (
  name: string,
  priceCents: number,
  description = "",
  extra: { available?: boolean } = {},
  sortOrder = 0,
) => ({ name, priceCents, description, sortOrder, ...extra });

async function main() {
  const existing = await prisma.organization.findFirst({ select: { id: true } });
  if (existing) {
    console.log("Seed skipped — an organization already exists.");
    return;
  }

  const org = await prisma.organization.create({
    data: {
      name: "Chulho Hospitality",
      backupFrequency: "daily",
      outlets: {
        create: [
          {
            name: "Chulho — Jhamsikhel",
            address: "14 Jhamsikhel Marg, Lalitpur, Kathmandu",
            phone: "+977-1-5551434",
            currency: "NPR",
            timezone: "Asia/Kathmandu",
            tables: {
              create: [
                { name: "T1", capacity: 2, zone: "Floor", shape: "square", sortOrder: 1 },
                { name: "T2", capacity: 2, zone: "Floor", shape: "square", sortOrder: 2 },
                { name: "T3", capacity: 2, zone: "Floor", shape: "square", sortOrder: 3 },
                { name: "T4", capacity: 4, zone: "Floor", shape: "rect", sortOrder: 4 },
                { name: "T5", capacity: 4, zone: "Floor", shape: "round", sortOrder: 5 },
                { name: "T6", capacity: 4, zone: "Loft", shape: "rect", sortOrder: 6 },
                { name: "C1", capacity: 6, zone: "Courtyard", shape: "round", sortOrder: 7 },
                { name: "C2", capacity: 8, zone: "Courtyard", shape: "rect", sortOrder: 8 },
              ],
            },
            menuCategories: {
              create: [
                {
                  name: "Starters",
                  sortOrder: 1,
                  items: {
                    create: [
                      item("Chicken Momos", 45000, "Steamed, ginger and timur, sesame–tomato achar", {}, 1),
                      item("Veg Momos", 38000, "Cabbage, paneer, coriander", {}, 2),
                      item("Aloo Sadeko", 32000, "Mustard oil, toasted fenugreek, lime", {}, 3),
                      item("Chatamari", 42000, "Newari rice crêpe, minced chicken, egg", { available: false }, 4),
                    ],
                  },
                },
                {
                  name: "Mains",
                  sortOrder: 2,
                  items: {
                    create: [
                      item("Dal Bhat — garden", 75000, "Lentils, tarkari, greens, achar, papad", {}, 1),
                      item("Dal Bhat — chicken curry", 95000, "The full set, village chicken curry", {}, 2),
                      item("Thakali Thali", 110000, "Buckwheat roti, mutton curry, gundruk", {}, 3),
                      item("Sekuwa Platter", 98000, "Charcoal lamb skewers, beaten rice", {}, 4),
                      item("Butter Paneer & Basmati", 82000, "", {}, 5),
                    ],
                  },
                },
                {
                  name: "Desserts",
                  sortOrder: 3,
                  items: {
                    create: [
                      item("Juju Dhau", 28000, "Bhaktapur king curd", {}, 1),
                      item("Sikarni", 32000, "Spiced hung yogurt, pistachio", {}, 2),
                      item("Sel Roti, Honey Butter", 30000, "", {}, 3),
                    ],
                  },
                },
                {
                  name: "Drinks",
                  sortOrder: 4,
                  items: {
                    create: [
                      item("Masala Chiya", 15000, "", {}, 1),
                      item("Fresh Lime Soda", 18000, "Sweet, salted, or in between", {}, 2),
                      item("Sweet Lassi", 25000, "", {}, 3),
                      item("Everest Lager", 55000, "650ml, properly cold", {}, 4),
                    ],
                  },
                },
              ],
            },
          },
          {
            name: "Chulho — Thamel",
            address: "Saat Ghumti Marg, Thamel, Kathmandu",
            phone: "+977-1-5559876",
            currency: "NPR",
            timezone: "Asia/Kathmandu",
            tables: {
              create: [
                { name: "T1", capacity: 2, zone: "Floor", shape: "square", sortOrder: 1 },
                { name: "T2", capacity: 4, zone: "Floor", shape: "rect", sortOrder: 2 },
                { name: "T3", capacity: 4, zone: "Corridor", shape: "rect", sortOrder: 3 },
                { name: "T4", capacity: 6, zone: "Terrace", shape: "round", sortOrder: 4 },
              ],
            },
            menuCategories: {
              create: [
                {
                  name: "Quick Plates",
                  sortOrder: 1,
                  items: {
                    create: [
                      item("Chicken Momos", 48000, "Steamed or fried", {}, 1),
                      item("Chowmein", 35000, "Street-style, chicken or veg", {}, 2),
                      item("Sekuwa Roll", 42000, "", {}, 3),
                    ],
                  },
                },
                {
                  name: "Drinks",
                  sortOrder: 2,
                  items: {
                    create: [
                      item("Masala Chiya", 18000, "", {}, 1),
                      item("Everest Lager", 60000, "", {}, 2),
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    include: { outlets: { select: { id: true, name: true } } },
  });

  const jhamsikhel = org.outlets.find((o) => o.name.includes("Jhamsikhel"))!;

  // Service periods: what a host can book a table for. Every outlet gets the
  // defaults; the Jhamsikhel courtyard also does a late high tea.
  for (const outlet of org.outlets) {
    await prisma.servicePeriod.createMany({
      data: [
        { outletId: outlet.id, name: "Breakfast", startTime: "07:00", endTime: "11:00", sortOrder: 1 },
        { outletId: outlet.id, name: "Lunch", startTime: "12:00", endTime: "15:00", sortOrder: 2 },
        ...(outlet.id === jhamsikhel.id
          ? [{ outletId: outlet.id, name: "High tea", startTime: "15:30", endTime: "17:30", sortOrder: 3 }]
          : []),
        { outletId: outlet.id, name: "Dinner", startTime: "18:00", endTime: "23:00", sortOrder: 4 },
      ],
    });
  }

  // Extras: one catalogue per outlet, then attached to the dishes that offer
  // them. The order screen shows the whole list on every card and greys out the
  // rows a dish doesn't offer, so a plausible spread matters more than a long one.
  for (const outlet of org.outlets) {
    const jhamsi = outlet.id === jhamsikhel.id;
    const extras = jhamsi
      ? [
          { name: "Extra achar", priceCents: 4000, sortOrder: 1 },
          { name: "Double portion", priceCents: 12000, sortOrder: 2 },
          { name: "Extra papad", priceCents: 3500, sortOrder: 3 },
          { name: "Fried, not steamed", priceCents: 5000, sortOrder: 4 },
          { name: "Extra spicy", priceCents: 0, sortOrder: 5 },
        ]
      : [
          { name: "Extra achar", priceCents: 4500, sortOrder: 1 },
          { name: "Double portion", priceCents: 14000, sortOrder: 2 },
          { name: "Extra spicy", priceCents: 0, sortOrder: 3 },
        ];
    await prisma.modifier.createMany({
      data: extras.map((e) => ({ ...e, outletId: outlet.id })),
    });

    const catalogue = await prisma.modifier.findMany({ where: { outletId: outlet.id } });
    const idOf = (name: string) => catalogue.find((m) => m.name === name)?.id;
    const items = await prisma.menuItem.findMany({
      where: { category: { outletId: outlet.id } },
      select: { id: true, name: true, category: { select: { name: true } } },
    });

    for (const item of items) {
      const cat = item.category.name;
      const names: string[] = [];
      if (cat === "Drinks") {
        // A lager takes no achar; only the free heat option makes sense on food.
        if (item.name.includes("Chiya") || item.name.includes("Lassi")) names.push("Double portion");
      } else if (cat === "Desserts") {
        names.push("Double portion");
      } else {
        names.push("Extra achar", "Double portion", "Extra spicy");
        if (cat === "Mains" || cat === "Quick Plates") names.push("Extra papad");
        if (item.name.toLowerCase().includes("momo")) names.push("Fried, not steamed");
      }
      const modifierIds = names.map(idOf).filter((id): id is string => Boolean(id));
      if (modifierIds.length) {
        await prisma.menuItemModifier.createMany({
          data: modifierIds.map((modifierId, i) => ({ menuItemId: item.id, modifierId, sortOrder: i })),
        });
      }
    }
  }

  await prisma.user.createMany({
    data: [
      {
        organizationId: org.id,
        outletId: null, // owner spans all outlets
        name: "Ajay",
        email: "yogalajay@gmail.com",
        role: "owner",
        passwordHash: hash("owner1234"),
        pinHash: null,
      },
      {
        organizationId: org.id,
        outletId: jhamsikhel.id,
        name: "Maya",
        email: "manager@chulho.demo",
        role: "manager",
        passwordHash: hash("manager1234"),
        pinHash: hash("2222"),
      },
      {
        organizationId: org.id,
        outletId: jhamsikhel.id,
        name: "Sita",
        role: "staff",
        pinHash: hash("3333"),
      },
      {
        organizationId: org.id,
        outletId: jhamsikhel.id,
        name: "Hari",
        role: "staff",
        pinHash: hash("4444"),
      },
    ],
  });

  console.log("Seeded: Chulho Hospitality, 2 outlets, 4 users, menus, extras, service periods and tables.");
  console.log("Owner login: yogalajay@gmail.com / owner1234");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
