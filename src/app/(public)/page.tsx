import Link from "next/link";
import { getPublishedMenu } from "@/lib/menu";
import { getRestaurant } from "@/lib/restaurant";
import { formatPrice } from "@/lib/format";

const TAG_LABELS: Record<string, { label: string; className: string }> = {
  vegetarian: { label: "veg", className: "text-leaf" },
  vegan: { label: "vegan", className: "text-leaf" },
  "gluten-free": { label: "gf", className: "text-brass" },
};

export default async function HomePage() {
  const [restaurant, menu] = await Promise.all([getRestaurant(), getPublishedMenu()]);

  return (
    <>
      <section className="mx-auto max-w-3xl px-5 pt-16 pb-12">
        {/* Intentional brand copy, not derived from Restaurant fields —
            rewrite alongside the real restaurant's identity (PRD §9.2/§9.5). */}
        <p className="eyebrow">Jhamsikhel, Lalitpur · Nepali kitchen</p>
        <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
          Dal bhat, momos, and a seat by the courtyard fire.
        </h1>
        <p className="mt-5 max-w-prose text-lg text-ink-soft">{restaurant.description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/book" className="btn btn-primary">
            Book a table
          </Link>
          <a href="#menu" className="btn btn-secondary">
            See the menu
          </a>
        </div>
      </section>

      <section id="menu" className="mx-auto max-w-3xl scroll-mt-6 px-5 pb-4">
        <h2 className="font-display text-3xl">The menu</h2>
        <p className="mt-2 text-ink-soft">
          Everything is cooked to order — tell us about allergies in your booking notes.
        </p>

        {menu.categories.map((category) => (
          <div key={category.id} className="mt-12">
            <div className="flex items-center gap-4">
              <h3 className="font-display text-2xl text-madder-deep">{category.name}</h3>
              <div className="h-px flex-1 bg-line" aria-hidden="true" />
            </div>
            <ul className="mt-5 space-y-5">
              {category.items.map((item) => (
                <li key={item.id} className={item.available ? undefined : "opacity-50"}>
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold">
                      {item.name}
                      {item.dietaryTags.map((tag) => {
                        const t = TAG_LABELS[tag];
                        return t ? (
                          <span key={tag} className={`chip ml-2 ${t.className}`}>
                            {t.label}
                          </span>
                        ) : null;
                      })}
                      {!item.available && (
                        <span className="chip ml-2 text-ink-soft">sold out today</span>
                      )}
                    </span>
                    <span className="leader" aria-hidden="true" />
                    <span className="font-mono text-sm whitespace-nowrap">
                      {formatPrice(item.priceCents, menu.currency)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-1 max-w-[52ch] text-sm text-ink-soft">{item.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-3xl px-5 pt-16">
        <div className="border border-line bg-white/60 p-6 sm:p-8">
          <h2 className="font-display text-2xl">Come hungry</h2>
          <p className="mt-2 max-w-prose text-ink-soft">
            {`Tables seat up to ${restaurant.maxPartySize} online. Bigger crowd? Call`}{" "}
            <a href={`tel:${restaurant.phone.replace(/[^+\d]/g, "")}`} className="text-madder-deep underline underline-offset-4">
              {restaurant.phone}
            </a>{" "}
            and we&apos;ll push tables together.
          </p>
          <Link href="/book" className="btn btn-primary mt-6">
            Book a table
          </Link>
        </div>
      </section>
    </>
  );
}
