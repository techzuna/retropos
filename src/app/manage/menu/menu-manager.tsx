"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { useDialog } from "@/components/Dialog";
import { failureMessage } from "@/lib/fetch-error";

interface ItemRow {
  id: string;
  name: string;
  priceCents: number;
  available: boolean;
  published: boolean;
  hasImage: boolean;
  modifierIds: string[];
}

interface CategoryRow {
  id: string;
  name: string;
  published: boolean;
  items: ItemRow[];
}

interface ModifierRow {
  id: string;
  name: string;
  priceCents: number;
  active: boolean;
}

const ALL = "all";
type View = "grid" | "list";
type Sort = "menu" | "name" | "price-asc" | "price-desc";

export function MenuManager({
  currency,
  categories,
  modifiers,
}: {
  currency: string;
  categories: CategoryRow[];
  modifiers: ModifierRow[];
}) {
  const router = useRouter();
  const { ask, confirm, dialog } = useDialog();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("grid");
  const [tab, setTab] = useState(ALL);
  const [sort, setSort] = useState<Sort>("menu");
  const [adding, setAdding] = useState(false);
  const [editingExtras, setEditingExtras] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ name: "", price: "", categoryId: "" });
  const [newCategory, setNewCategory] = useState("");
  const [newExtra, setNewExtra] = useState({ name: "", price: "" });
  // One hidden file input per card would be a lot of DOM; a single one, retargeted.
  const fileInput = useRef<HTMLInputElement | null>(null);
  const uploadFor = useRef<string | null>(null);

  async function call(url: string, method: string, body?: unknown) {
    if (busy) return false;
    setBusy(true);
    setError(null);
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).catch(() => null);
    const ok = Boolean(res?.ok);
    if (!ok) setError(await failureMessage(res));
    setBusy(false);
    router.refresh();
    return ok;
  }

  function centsFrom(raw: string): number | null {
    const value = Math.round(Number(raw.replace(/[^\d.]/g, "")) * 100);
    return Number.isInteger(value) && value >= 0 ? value : null;
  }

  /** Name and price together — they're nearly always corrected in one go. */
  async function editItem(item: ItemRow) {
    const v = await ask({
      title: `Edit ${item.name}`,
      fields: [
        { name: "name", label: "Name", value: item.name, maxLength: 100 },
        {
          name: "price",
          label: `Price (${currency})`,
          value: String(item.priceCents / 100),
          hint: "A plain number, e.g. 450 or 450.50",
        },
      ],
      submitLabel: "Save item",
    });
    if (!v) return;
    const name = v.name.trim();
    const priceCents = centsFrom(v.price);
    if (!name) {
      setError("An item needs a name.");
      return;
    }
    if (priceCents === null) {
      setError("Enter a plain number, e.g. 450 or 450.50");
      return;
    }
    void call(`/api/menu/items/${item.id}`, "PATCH", { name, priceCents });
  }

  function addItem() {
    const priceCents = centsFrom(newItem.price);
    const categoryId = newItem.categoryId || categories[0]?.id;
    if (!newItem.name.trim() || priceCents === null || !categoryId) {
      setError("Give the new item a name, a plain-number price, and a category.");
      return;
    }
    setNewItem({ name: "", price: "", categoryId });
    setAdding(false);
    void call("/api/menu/items", "POST", { categoryId, name: newItem.name.trim(), priceCents });
  }

  function addExtra() {
    const priceCents = centsFrom(newExtra.price);
    if (!newExtra.name.trim() || priceCents === null) {
      setError("Give the extra a name and a plain-number price.");
      return;
    }
    setNewExtra({ name: "", price: "" });
    void call("/api/menu/modifiers", "POST", { name: newExtra.name.trim(), priceCents });
  }

  function pickPhoto(itemId: string) {
    uploadFor.current = itemId;
    fileInput.current?.click();
  }

  async function uploadPhoto(file: File) {
    const itemId = uploadFor.current;
    if (!itemId) return;
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`/api/menu/items/${itemId}/image`, { method: "POST", body }).catch(
      () => null,
    );
    if (!res?.ok) setError(await failureMessage(res));
    setBusy(false);
    router.refresh();
  }

  function toggleExtra(item: ItemRow, modifierId: string) {
    const next = item.modifierIds.includes(modifierId)
      ? item.modifierIds.filter((id) => id !== modifierId)
      : [...item.modifierIds, modifierId];
    void call(`/api/menu/items/${item.id}/modifiers`, "PUT", { modifierIds: next });
  }

  const tabs = [{ id: ALL, name: "All" }, ...categories.map((c) => ({ id: c.id, name: c.name }))];
  const shown = (tab === ALL ? categories : categories.filter((c) => c.id === tab)).map((c) => ({
    ...c,
    items: [...c.items].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "price-asc") return a.priceCents - b.priceCents;
      if (sort === "price-desc") return b.priceCents - a.priceCents;
      return 0; // "menu" = the manager's own sortOrder, already applied server-side
    }),
  }));

  return (
    <div className="mt-5">
      {dialog}
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // so re-picking the same file fires again
          if (file) void uploadPhoto(file);
        }}
      />

      {/* Toolbar: categories, sort, view, add */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={t.id === tab}
              className={`whitespace-nowrap border px-3 py-2 text-sm ${
                t.id === tab ? "border-madder bg-madder text-paper" : "border-line bg-white"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <label className="text-sm">
          <span className="sr-only">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="border border-line bg-white px-2 py-2 text-sm"
          >
            <option value="menu">Sort by: menu order</option>
            <option value="name">Sort by: name</option>
            <option value="price-asc">Sort by: price ↑</option>
            <option value="price-desc">Sort by: price ↓</option>
          </select>
        </label>
        <div className="flex" role="group" aria-label="View">
          <button
            type="button"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
            className={`border px-3 py-2 text-sm ${view === "list" ? "border-madder bg-madder text-paper" : "border-line bg-white"}`}
          >
            List
          </button>
          <button
            type="button"
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
            className={`-ml-px border px-3 py-2 text-sm ${view === "grid" ? "border-madder bg-madder text-paper" : "border-line bg-white"}`}
          >
            Grid
          </button>
        </div>
        <button type="button" onClick={() => setAdding((v) => !v)} className="btn btn-secondary text-sm">
          + Add new
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 border border-madder/40 bg-madder/5 px-3 py-2 text-sm text-madder-deep">
          {error}
        </p>
      )}

      {adding && (
        <div className="mt-4 border border-line bg-white p-4">
          <p className="font-medium">Add an item</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="block text-sm font-medium">Name</span>
              <input
                autoFocus
                value={newItem.name}
                onChange={(e) => setNewItem((v) => ({ ...v, name: e.target.value }))}
                className="mt-1 w-48 border border-line px-3 py-2.5"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium">{`Price (${currency})`}</span>
              <input
                inputMode="decimal"
                value={newItem.price}
                onChange={(e) => setNewItem((v) => ({ ...v, price: e.target.value }))}
                className="mt-1 w-28 border border-line px-3 py-2.5"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium">Category</span>
              <select
                value={newItem.categoryId || categories[0]?.id || ""}
                onChange={(e) => setNewItem((v) => ({ ...v, categoryId: e.target.value }))}
                className="mt-1 border border-line bg-white px-3 py-2.5"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={addItem} disabled={busy} className="btn btn-primary disabled:opacity-40">
              Add item
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4">
            <label className="block">
              <span className="block text-sm font-medium">New category</span>
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="mt-1 w-48 border border-line px-3 py-2.5"
              />
            </label>
            <button
              type="button"
              disabled={!newCategory.trim() || busy}
              className="btn btn-secondary disabled:opacity-40"
              onClick={() => {
                const name = newCategory.trim();
                setNewCategory("");
                void call("/api/menu/categories", "POST", { name, sortOrder: categories.length + 1 });
              }}
            >
              Add category
            </button>
          </div>
        </div>
      )}

      {shown.map((category) => (
        <section key={category.id} className={`mt-6 ${category.published ? "" : "opacity-60"}`}>
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl text-madder-deep">{category.name}</h2>
            <div className="h-px flex-1 bg-line" aria-hidden="true" />
            <button
              type="button"
              className="text-xs underline underline-offset-2"
              onClick={() =>
                call(`/api/menu/categories/${category.id}`, "PATCH", { published: !category.published })
              }
            >
              {category.published ? "hide" : "show"}
            </button>
            <button
              type="button"
              className="text-xs text-madder-deep underline underline-offset-2"
              onClick={async () => {
                if (
                  await confirm({
                    title: `Delete "${category.name}"?`,
                    message: "Its items go too. Past bills keep their lines.",
                    confirmLabel: "Delete",
                    danger: true,
                  })
                )
                  void call(`/api/menu/categories/${category.id}`, "DELETE");
              }}
            >
              delete
            </button>
          </div>

          {view === "grid" ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {category.items.map((item) => (
                <article
                  key={item.id}
                  className={`border border-line bg-white p-3 ${item.published ? "" : "opacity-60"}`}
                >
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => pickPhoto(item.id)}
                      title="Change photo"
                      className="size-16 shrink-0 border border-line"
                    >
                      {item.hasImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element -- our own disk, no optimizer on a LAN box */
                        <img
                          src={`/api/menu/items/${item.id}/image`}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="grid size-full place-items-center bg-paper-deep text-xs text-ink-soft">
                          photo
                        </span>
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => void editItem(item)}
                        className="block w-full truncate text-left font-medium"
                      >
                        {item.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => void editItem(item)}
                        className="font-mono text-sm underline underline-offset-2"
                      >
                        {formatPrice(item.priceCents, currency)}
                      </button>
                      <p className="mt-1 text-xs text-ink-soft">
                        {item.modifierIds.length === 0
                          ? "no extras"
                          : `${item.modifierIds.length} ${item.modifierIds.length === 1 ? "extra" : "extras"}`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      aria-pressed={!item.available}
                      className={`border px-2 py-1.5 text-xs ${
                        item.available ? "border-line" : "border-madder bg-madder/10 text-madder-deep"
                      }`}
                      onClick={() => call(`/api/menu/items/${item.id}`, "PATCH", { available: !item.available })}
                    >
                      {item.available ? "86 it" : "sold out"}
                    </button>
                    <button
                      type="button"
                      className="border border-line px-2 py-1.5 text-xs"
                      onClick={() => call(`/api/menu/items/${item.id}`, "PATCH", { published: !item.published })}
                    >
                      {item.published ? "hide" : "show"}
                    </button>
                    <button
                      type="button"
                      className="border border-line px-2 py-1.5 text-xs"
                      onClick={() => setEditingExtras(editingExtras === item.id ? null : item.id)}
                    >
                      extras
                    </button>
                    <span className="flex-1" />
                    <button
                      type="button"
                      className="px-1 text-madder-deep"
                      aria-label={`Delete ${item.name}`}
                      onClick={async () => {
                        if (
                          await confirm({
                            title: `Delete "${item.name}"?`,
                            message: "Past bills keep their lines.",
                            confirmLabel: "Delete",
                            danger: true,
                          })
                        )
                          void call(`/api/menu/items/${item.id}`, "DELETE");
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {editingExtras === item.id && (
                    <fieldset className="mt-3 border-t border-line pt-3">
                      <legend className="sr-only">{`Extras offered on ${item.name}`}</legend>
                      {modifiers.length === 0 ? (
                        <p className="text-xs text-ink-soft">
                          No extras defined yet — add some at the bottom of this page.
                        </p>
                      ) : (
                        <ul className="space-y-1 text-sm">
                          {modifiers.map((m) => (
                            <li key={m.id}>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="size-4"
                                  checked={item.modifierIds.includes(m.id)}
                                  onChange={() => toggleExtra(item, m.id)}
                                />
                                <span className="flex-1">{m.name}</span>
                                <span className="font-mono text-xs text-ink-soft">
                                  {formatPrice(m.priceCents, currency)}
                                </span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      )}
                    </fieldset>
                  )}
                </article>
              ))}
              {category.items.length === 0 && (
                <p className="text-sm text-ink-soft">Nothing in this category yet.</p>
              )}
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-line border border-line bg-white">
              {category.items.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center gap-2 px-3 py-2 ${item.published ? "" : "opacity-60"}`}
                >
                  <button
                    type="button"
                    onClick={() => void editItem(item)}
                    className="min-w-0 flex-1 truncate text-left font-medium"
                  >
                    {item.name}
                  </button>
                  <span className="text-xs text-ink-soft">{`${item.modifierIds.length} extras`}</span>
                  <button
                    type="button"
                    onClick={() => void editItem(item)}
                    className="font-mono text-sm underline underline-offset-2"
                  >
                    {formatPrice(item.priceCents, currency)}
                  </button>
                  <button
                    type="button"
                    aria-pressed={!item.available}
                    className={`border px-2 py-1.5 text-xs ${
                      item.available ? "border-line" : "border-madder bg-madder/10 text-madder-deep"
                    }`}
                    onClick={() => call(`/api/menu/items/${item.id}`, "PATCH", { available: !item.available })}
                  >
                    {item.available ? "86 it" : "sold out"}
                  </button>
                  <button
                    type="button"
                    className="px-1 text-madder-deep"
                    aria-label={`Delete ${item.name}`}
                    onClick={async () => {
                      if (
                        await confirm({
                          title: `Delete "${item.name}"?`,
                          message: "Past bills keep their lines.",
                          confirmLabel: "Delete",
                          danger: true,
                        })
                      )
                        void call(`/api/menu/items/${item.id}`, "DELETE");
                    }}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {/* The extras catalogue: shared across every item on this outlet's menu. */}
      <section className="mt-10 border border-line bg-white p-4">
        <h2 className="font-display text-xl">Extras</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Priced add-ons, shared across the menu. Tick which items offer each one from the
          &ldquo;extras&rdquo; button on a card; the order screen shows the full list and greys out the
          ones a dish doesn&rsquo;t offer.
        </p>
        <ul className="mt-3 divide-y divide-line border border-line">
          {modifiers.map((m) => (
            <li key={m.id} className="flex items-center gap-2 px-3 py-2">
              <span className="min-w-0 flex-1 truncate">{m.name}</span>
              <button
                type="button"
                className="font-mono text-sm underline underline-offset-2"
                onClick={async () => {
                  const v = await ask({
                    title: `Edit ${m.name}`,
                    fields: [
                      { name: "name", label: "Name", value: m.name, maxLength: 100 },
                      {
                        name: "price",
                        label: `Price (${currency})`,
                        value: String(m.priceCents / 100),
                        hint: "0 is allowed, for a free option.",
                      },
                    ],
                    submitLabel: "Save extra",
                  });
                  if (!v) return;
                  const name = v.name.trim();
                  const priceCents = centsFrom(v.price);
                  if (!name || priceCents === null) {
                    setError("Give the extra a name and a plain-number price.");
                    return;
                  }
                  void call(`/api/menu/modifiers/${m.id}`, "PATCH", { name, priceCents });
                }}
              >
                {formatPrice(m.priceCents, currency)}
              </button>
              <button
                type="button"
                className="border border-line px-2 py-1.5 text-xs"
                onClick={() => call(`/api/menu/modifiers/${m.id}`, "PATCH", { active: !m.active })}
              >
                {m.active ? "retire" : "restore"}
              </button>
              <button
                type="button"
                className="px-1 text-madder-deep"
                aria-label={`Delete ${m.name}`}
                onClick={async () => {
                  if (
                    await confirm({
                      title: `Delete the "${m.name}" extra?`,
                      message: "Only possible if it has never been on a bill.",
                      confirmLabel: "Delete",
                      danger: true,
                    })
                  )
                    void call(`/api/menu/modifiers/${m.id}`, "DELETE");
                }}
              >
                ×
              </button>
            </li>
          ))}
          {modifiers.length === 0 && (
            <li className="px-3 py-3 text-sm text-ink-soft">No extras yet.</li>
          )}
        </ul>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="block text-sm font-medium">Name</span>
            <input
              placeholder="Bacon"
              value={newExtra.name}
              onChange={(e) => setNewExtra((v) => ({ ...v, name: e.target.value }))}
              className="mt-1 w-40 border border-line px-3 py-2.5"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium">{`Price (${currency})`}</span>
            <input
              inputMode="decimal"
              value={newExtra.price}
              onChange={(e) => setNewExtra((v) => ({ ...v, price: e.target.value }))}
              className="mt-1 w-28 border border-line px-3 py-2.5"
            />
          </label>
          <button type="button" onClick={addExtra} disabled={busy} className="btn btn-secondary disabled:opacity-40">
            Add extra
          </button>
        </div>
      </section>
    </div>
  );
}
