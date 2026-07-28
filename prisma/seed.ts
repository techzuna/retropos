// Idempotent seed: skips entirely if a restaurant already exists, so it is
// safe to run on every deploy (see DEPLOY.md). All data here is placeholder
// demo content — the real restaurant's details are PRD.md §9.2.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const lunch = { open: "11:30", close: "14:30" };
const dinner = { open: "18:00", close: "21:30" };

async function main() {
  const existing = await prisma.restaurant.findFirst({ select: { id: true } });
  if (existing) {
    console.log("Seed skipped — a restaurant already exists.");
    return;
  }

  await prisma.restaurant.create({
    data: {
      name: "Chulho",
      description:
        "A small Nepali kitchen around a shared courtyard fire — dal bhat done properly, momos folded to order, and the kettle always on.",
      address: "14 Jhamsikhel Marg, Lalitpur, Kathmandu",
      phone: "+977-1-5551434",
      currency: "NPR",
      timezone: "Asia/Kathmandu",
      openingHours: {
        // Closed Mondays; lunch and dinner service the rest of the week.
        tue: [lunch, dinner],
        wed: [lunch, dinner],
        thu: [lunch, dinner],
        fri: [lunch, dinner],
        sat: [lunch, dinner],
        sun: [lunch, dinner],
      },
      closedDates: ["2026-10-20", "2026-10-21"], // Dashain example holidays
      tables: {
        create: [
          { name: "T1", capacity: 2 },
          { name: "T2", capacity: 2 },
          { name: "T3", capacity: 2 },
          { name: "T4", capacity: 4 },
          { name: "T5", capacity: 4 },
          { name: "T6", capacity: 4 },
          { name: "C1 (courtyard)", capacity: 6 },
          { name: "C2 (courtyard)", capacity: 8 },
        ],
      },
      users: {
        create: [{ email: "yogalajay@gmail.com", name: "Owner", role: "manager" }],
      },
      menuCategories: {
        create: [
          {
            name: "Starters",
            sortOrder: 1,
            items: {
              create: [
                {
                  name: "Chicken Momos",
                  description: "Steamed dumplings with ginger and timur, sesame–tomato achar",
                  priceCents: 45000,
                  sortOrder: 1,
                },
                {
                  name: "Veg Momos",
                  description: "Cabbage, paneer and coriander, folded to order",
                  priceCents: 38000,
                  dietaryTags: ["vegetarian"],
                  sortOrder: 2,
                },
                {
                  name: "Aloo Sadeko",
                  description: "Warm potato salad, mustard oil, toasted fenugreek, lime",
                  priceCents: 32000,
                  dietaryTags: ["vegan", "gluten-free"],
                  sortOrder: 3,
                },
                {
                  name: "Chatamari",
                  description: "Newari rice crêpe with minced chicken and egg",
                  priceCents: 42000,
                  available: false, // demo of the "86" toggle
                  sortOrder: 4,
                },
              ],
            },
          },
          {
            name: "Mains",
            sortOrder: 2,
            items: {
              create: [
                {
                  name: "Dal Bhat — garden",
                  description:
                    "Black lentils, seasonal tarkari, sautéed greens, achar, papad. Rice refills on the house.",
                  priceCents: 75000,
                  dietaryTags: ["vegetarian"],
                  sortOrder: 1,
                },
                {
                  name: "Dal Bhat — chicken curry",
                  description: "The full set with slow-cooked village chicken curry",
                  priceCents: 95000,
                  dietaryTags: ["gluten-free"],
                  sortOrder: 2,
                },
                {
                  name: "Thakali Thali",
                  description: "Buckwheat roti, mutton curry, gundruk, ghee-tempered dal",
                  priceCents: 110000,
                  sortOrder: 3,
                },
                {
                  name: "Sekuwa Platter",
                  description: "Charcoal lamb skewers, beaten rice, mustard slaw",
                  priceCents: 98000,
                  dietaryTags: ["gluten-free"],
                  sortOrder: 4,
                },
                {
                  name: "Butter Paneer & Basmati",
                  description: "For the homesick and the cautious alike",
                  priceCents: 82000,
                  dietaryTags: ["vegetarian"],
                  sortOrder: 5,
                },
              ],
            },
          },
          {
            name: "Desserts",
            sortOrder: 3,
            items: {
              create: [
                {
                  name: "Juju Dhau",
                  description: "Bhaktapur king curd, clay-pot set",
                  priceCents: 28000,
                  dietaryTags: ["vegetarian", "gluten-free"],
                  sortOrder: 1,
                },
                {
                  name: "Sikarni",
                  description: "Spiced hung yogurt, pistachio, saffron",
                  priceCents: 32000,
                  dietaryTags: ["vegetarian", "gluten-free"],
                  sortOrder: 2,
                },
                {
                  name: "Sel Roti, Honey Butter",
                  description: "Crisp rice-flour rings, still warm",
                  priceCents: 30000,
                  dietaryTags: ["vegetarian"],
                  sortOrder: 3,
                },
              ],
            },
          },
          {
            name: "Drinks",
            sortOrder: 4,
            items: {
              create: [
                {
                  name: "Masala Chiya",
                  description: "Milk tea with cardamom and black pepper",
                  priceCents: 15000,
                  dietaryTags: ["vegetarian"],
                  sortOrder: 1,
                },
                {
                  name: "Fresh Lime Soda",
                  description: "Sweet, salted, or in between",
                  priceCents: 18000,
                  dietaryTags: ["vegan", "gluten-free"],
                  sortOrder: 2,
                },
                {
                  name: "Sweet Lassi",
                  description: "Churned yogurt, cardamom",
                  priceCents: 25000,
                  dietaryTags: ["vegetarian", "gluten-free"],
                  sortOrder: 3,
                },
                {
                  name: "Everest Lager",
                  description: "650ml, properly cold",
                  priceCents: 55000,
                  sortOrder: 4,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("Seeded restaurant, 8 tables, 4 menu categories, 1 staff user.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
