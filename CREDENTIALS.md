# Access & Demo Credentials

Who can get in, where, and with what. Accounts below are created by
`npx prisma db seed` (see [prisma/seed.ts](prisma/seed.ts)).

> **Dev only.** These passwords and PINs are public — they live in a
> checked-in seed file. Change every one before the app faces a real
> restaurant, and never seed demo data onto a production `data/app.db`. The
> seed is idempotent: it skips entirely if an organization already exists.

Links assume the dev server at `APP_URL` — **http://localhost:3111**
(`npm run dev -- -p 3111`; port 3000 is usually taken on this machine). On a
real deployment substitute the LAN address from [DEPLOY.md](DEPLOY.md).

## There is no super admin

**`owner` is the highest role that exists**, and it is scoped to one
organization. There is no platform-wide account, no cross-organization
console, and no login that reaches a second organization — `ROLES` is
`["staff", "manager", "owner"]` ([constants.ts:4](src/lib/constants.ts#L4)) and
every domain function pins its queries to the session's `orgId`
([admin.ts:7](src/lib/admin.ts#L7): *"an owner can never touch another org"*).

Today organizations are created only by the seed or by restoring a backup, so
provisioning a tenant is a shell operation on the box — `npx prisma`, the
`data/` directory, the backup JSONs — not a screen. Whoever has that shell is
the closest thing to a super admin.

A real platform admin is **designed but not built**: see
[DESIGN.md](DESIGN.md) → "Proposed: Hosted Multi-Tenant Platform". It would
live in a separate control-plane database, deliberately *not* as a fourth entry
in `ROLES`, and would reach tenant data only through an expiring, audited
impersonation grant. Do not expect a credential for it — none exists.

## Accounts

| Role | Name | Email | Password | PIN | Outlet |
| --- | --- | --- | --- | --- | --- |
| Owner | Ajay | `yogalajay@gmail.com` | `owner1234` | — *(none, deliberately)* | all outlets |
| Manager | Maya | `manager@chulho.demo` | `manager1234` | `2222` | Chulho — Jhamsikhel |
| Staff | Sita | — | — | `3333` | Chulho — Jhamsikhel |
| Staff | Hari | — | — | `4444` | Chulho — Jhamsikhel |

Chulho — Thamel is seeded with tables and a menu but no users of its own; pair a
device to it as the owner.

## The two doors

Access is two independent facts in one cookie: which outlet the **device** is
paired to, and who is **acting** on it ([session.ts:11-25](src/lib/session.ts#L11-L25)).

| Door | Credential | What it does |
| --- | --- | --- |
| [/login](http://localhost:3111/login) | email + password | Owner/manager sign-in. On a fresh device this also **pairs it to an outlet** — a new device must come through here once before any PIN works. |
| [/signin](http://localhost:3111/signin) | name + 4-digit PIN | The floor screen, on an already-paired device. Serves both a cold shift start and mid-service handover. |

[http://localhost:3111/](http://localhost:3111/) routes you automatically:
signed in → `/pos`; paired but nobody on shift → `/signin`; unpaired →
`/login` ([page.tsx:6-10](src/app/page.tsx#L6-L10)).

"End shift" clears only the acting user, so the tablet returns to its own PIN
screen. Only an explicit **Unpair** (manager+, in `/admin`) forgets the outlet.

## Access by role

Roles are strictly ordered — `staff < manager < owner` — and each higher role
inherits everything below it. Enforcement is `requireRole()` server-side on
every API route plus `requirePageSession(minRole)` on the three gated layouts
([route-guards.ts:11-16](src/lib/route-guards.ts#L11-L16)); hitting a page above
your role redirects to `/pos`, it does not just hide a link.

*Verified against the running app. **2026-07-29**, service periods and the
timezone: staff `GET /api/settings/service-periods` 200 but `POST` 403; a junk
timezone is refused 422 and a real one applied (moving the outlet to
`Europe/London` made the same Dinner period resolve to 17:00Z instead of
12:15Z); a booking sent with raw `startTime`/`endTime` is rejected by the
schema. **2026-07-28:** staff get `/pos` 200 and a
307 to `/pos` from `/manage/*` and `/admin`, with `FORBIDDEN` from
`/api/users`, `/api/backups` and `/api/auth/unpair`; managers get `/manage/*`
200 and a 307 from `/admin`. **2026-07-29**, the routes added with extras,
photos and the booking flow: staff `GET /api/menu/modifiers` 200 and `GET` a
dish image 200 (both needed to draw the order screen), but 403 on `POST
/api/menu/modifiers`, `POST` a dish image, `PUT` an item's allow-list and `POST
/api/tables`; `POST /api/reservations/[id]/confirm` reaches the handler as
staff.*

### Staff — Sita (PIN `3333`) or Hari (PIN `4444`)

Sign in at [/signin](http://localhost:3111/signin) on a paired device. No
password, no email — by design.

| Can reach | |
| --- | --- |
| [/pos](http://localhost:3111/pos) | table board in zone sections (`Courtyard · 2 tables`), each tile a seat diagram: free / reserved / occupied, with name, total, minutes |
| `/pos/tables/[id]` | seat a table (one tap for a booked party), compose dishes with **extras** and quantities, add/change/remove lines, settle by QR or cash, cancel |
| [/pos/reservations](http://localhost:3111/pos/reservations) | take bookings **by service period** (Lunch, Dinner…) or all day — never a clock time — then confirm / seat / move period / move table / no-show / cancel |
| `/pos/bill/[orderId]` | printable bill (80mm thermal / A4), extras itemised under each line |
| *reads only* | the outlet's extras catalogue, dish photos and service periods — the order cards and the booking picker can't be drawn without them |

Bookings are staff-level on purpose: whoever answers the phone takes them.

Blocked: **editing** extras, photos or service times, the floor plan (no *Edit
floor* toggle, and the writes 403 regardless), menu editing, reports, users,
outlets, backups, unpair.

### Manager — `manager@chulho.demo` / `manager1234`, or PIN `2222`

Two ways in: password at [/login](http://localhost:3111/login) (which can also
pair a device to their own outlet), or PIN `2222` at
[/signin](http://localhost:3111/signin) on a device already paired to
Jhamsikhel. Everything staff can do, plus:

| Can reach | |
| --- | --- |
| [/manage/menu](http://localhost:3111/manage/menu) | categories and items, prices, dish photos, the "86" sold-out toggle, publish/hide, and the shared **extras** catalogue (which dishes offer which add-on) |
| **Edit floor** on [/pos](http://localhost:3111/pos) | the floor plan lives on the board itself: toggle *Edit floor* to add tables and set **seats**, **zone** (Floor, Courtyard, Loft…) and **shape** (long/square/round), rename, retire/restore. Staff never see the toggle |
| **Edit service times** on [/pos/reservations](http://localhost:3111/pos/reservations) | the periods a booking can be taken for: add, rename, retime, retire, restore. Retiming never moves bookings already taken |
| [/manage/reports](http://localhost:3111/manage/reports) | sales, orders, customers, AOV — day or month buckets in outlet-local time |
| Payment QR upload | `POST /api/settings/qr` (manager+; staff can read it to show at settle) |

Blocked: users, outlets, backups, restore.

**Known gap:** `POST /api/auth/unpair` accepts manager+
([unpair/route.ts:12](src/app/api/auth/unpair/route.ts#L12)), but the only
button for it lives in the owner-only `/admin` panel
([admin-panel.tsx:165](src/app/admin/admin-panel.tsx#L165)) — so in practice a
manager can unpair only by calling the API directly. Either the control belongs
somewhere a manager can reach, or the route should be owner-only. Not yet
decided.

### Owner — `yogalajay@gmail.com` / `owner1234`

**Password only, at [/login](http://localhost:3111/login).** The owner has no
PIN and is not PIN-reachable at all: a 4-digit code on a shared floor tablet
must never unlock user creation or a whole-organization backup, which contains
every credential hash. `/login` stays reachable while staff are signed in, so
an owner never has to end someone's shift to get back in. Everything manager
can do, plus:

| Can reach | |
| --- | --- |
| [/admin](http://localhost:3111/admin) | the owner console |
| Outlets | create and edit, across the whole organization |
| Users | create staff/manager accounts, reset PINs and passwords, deactivate |
| Backups | back up now, change the daily/weekly schedule, restore from a file |
| Outlet switch | point this device at another outlet of the same organization (`POST /api/auth/outlet`) |
| Outlet **timezone** | new outlets default to `UTC`; set the real IANA zone from the outlet card. It decides which local day a sale counts in *and* what wall clock a service period means, so a junk value is refused (422) |

Scoped to their own organization, always. The last active owner cannot
deactivate themself ([admin.ts:119-125](src/lib/admin.ts#L119-L125)).

## Every API door

The full surface with its **minimum role**, read off the route handlers rather
than from memory. "device" means only the pairing is needed, no acting user.

**Auth & device**

| Method | Path | Min role | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | — | email + password → pair device + sign in (owner may pass `outletId`) |
| POST | `/api/auth/pin` | device | `{userId, pin}` → sign in / hand over on a paired device |
| POST | `/api/auth/logout` | — | end the shift; device stays paired |
| GET | `/api/auth/session` | device | who's on, which outlet, who else can PIN in |
| POST | `/api/auth/unpair` | manager | forget the outlet |
| POST | `/api/auth/outlet` | owner | switch this device to another outlet |

**Service — orders, bookings, the board**

| Method | Path | Min role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/tables` | staff | the board: tables, open orders, current holds |
| POST | `/api/orders` | staff | seat a table |
| GET | `/api/orders/[id]` | staff | order detail with lines and their extras |
| POST | `/api/orders/[id]/items` | staff | add a line `{menuItemId, quantity, modifierIds?, notes?}` |
| PATCH · DELETE | `/api/orders/[id]/items/[itemId]` | staff | change quantity/notes · remove a line |
| POST | `/api/orders/[id]/settle` | staff | `{method: "qr" \| "cash"}` → freeze the total, free the table |
| POST | `/api/orders/[id]/cancel` | staff | void the order, free the table |
| GET · POST | `/api/reservations` | staff | list a day's bookings · take a booking |
| PATCH · DELETE | `/api/reservations/[id]` | staff | reschedule / move table / correct details · cancel |
| POST | `/api/reservations/[id]/confirm` | staff | incoming → confirmed |
| POST | `/api/reservations/[id]/seat` | staff | the party arrived → opens their order |
| POST | `/api/reservations/[id]/no-show` | staff | release the hold, keep the fact |
| GET | `/api/menu` | staff | the ordering menu: published items, 86 flags, per-item extras allow-list |
| GET | `/api/menu/modifiers` | staff | the outlet's extras catalogue, for the order cards |
| GET | `/api/menu/items/[id]/image` | staff | serve a dish photo |
| GET | `/api/settings/service-periods` | staff | the outlet's service periods, for the booking picker |
| GET | `/api/settings/qr` | staff | the payment QR, shown at settle |

**Menu & floor plan (manager)**

| Method | Path | Min role | Purpose |
| --- | --- | --- | --- |
| GET · POST | `/api/menu/categories` | manager | list · create a category |
| PATCH · DELETE | `/api/menu/categories/[id]` | manager | rename / publish · delete |
| POST | `/api/menu/items` | manager | create an item |
| PATCH · DELETE | `/api/menu/items/[id]` | manager | price / rename / 86 / publish · delete |
| POST | `/api/menu/items/[id]/image` | manager | upload or replace a dish photo (multipart, field `file`) |
| PUT | `/api/menu/items/[id]/modifiers` | manager | replace which extras this dish offers |
| POST | `/api/menu/modifiers` | manager | add an extra |
| PATCH · DELETE | `/api/menu/modifiers/[id]` | manager | reprice / retire · delete (only if never billed) |
| POST | `/api/settings/service-periods` | manager | add a service period |
| PATCH · DELETE | `/api/settings/service-periods/[id]` | manager | rename / retime / retire · delete (only if never booked) |
| POST | `/api/tables` | manager | add a table to the floor plan |
| PATCH · DELETE | `/api/tables/[id]` | manager | seats / zone / shape / rename / retire · delete (only without history) |
| POST | `/api/settings/qr` | manager | upload the outlet's payment QR |
| GET | `/api/reports/summary?from&to&groupBy=day\|month` | manager | sales, orders, customers, AOV |
| GET | `/api/outlets` | manager | list outlets (a manager sees their own) |

**Organization (owner)**

| Method | Path | Min role | Purpose |
| --- | --- | --- | --- |
| POST | `/api/outlets` · PATCH `/api/outlets/[id]` | owner | create · edit an outlet |
| GET · POST | `/api/users` | owner | list · create staff/manager accounts |
| PATCH | `/api/users/[id]` | owner | rename, reset PIN/password, reassign outlet, deactivate |
| GET · POST · PATCH | `/api/backups` | owner | list + schedule · back up now · change the schedule |
| POST | `/api/backups/restore` | owner | restore from a chosen backup file |

Quick check that a fresh clone works — sign in, then read the board, the extras
catalogue, and today's bookings:

```sh
curl -s -c jar.txt -X POST http://localhost:3111/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"yogalajay@gmail.com","password":"owner1234"}'
curl -s -b jar.txt http://localhost:3111/api/auth/session
curl -s -b jar.txt http://localhost:3111/api/tables
curl -s -b jar.txt http://localhost:3111/api/menu/modifiers
curl -s -b jar.txt http://localhost:3111/api/reservations
```

Nothing here takes a price: an order line is `{menuItemId, quantity,
modifierIds}` and every amount is read from the database at add-time, so a
crafted request can't set what a dish or an extra costs.

Brute force is throttled per identity, not per client: `pin:user:<id>` at
10 attempts / 15 min and `login:email:<addr>` at 10 / 10 min, cleared by a
correct credential ([auth.ts:14-17](src/lib/auth.ts#L14-L17)).

## Reseeding from scratch

```sh
rm -f data/app.db          # wipes all local data, including any orders
rm -rf data/uploads        # optional: drops uploaded dish photos and the QR
npx prisma migrate deploy  # `migrate dev` if you're also authoring migrations
npx prisma db seed
```

The seed is idempotent and refuses to run over an existing organization, so
deleting `data/app.db` is the only way to get the demo data back.

**After any migration, restart a long-running `npm run dev`.** A Next dev server
holds the Prisma client generated *before* the migration, so every query against
a new model or column returns a 500 until the process reloads.

## Seeded demo org

**Chulho Hospitality** — currency NPR, timezone `Asia/Kathmandu`, daily backups.

Both outlets keep time in `Asia/Kathmandu` — the schema default for a *new*
outlet is `UTC`, and the seed sets a real zone to show it being used.

- **Chulho — Jhamsikhel** — 8 tables across Floor / Loft / Courtyard in mixed
  shapes; service periods Breakfast 07:00–11:00, Lunch 12:00–15:00, High tea
  15:30–17:30, Dinner 18:00–23:00; Starters, Mains, Desserts, Drinks; five extras (Extra achar, Double
  portion, Extra papad, Fried not steamed, and a free Extra spicy) attached to
  the dishes that plausibly take them — Fresh Lime Soda deliberately offers
  none, so you can see the greyed-out rows. *Chatamari* is seeded unavailable,
  to exercise the out-of-stock path.
- **Chulho — Thamel** — 4 tables across Floor / Corridor / Terrace; the three
  default service periods; Quick Plates, Drinks; three extras at its own prices.
