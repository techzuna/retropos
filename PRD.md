# RestroReserve — Product Requirements

> Rewritten 2026-07-28 for the POS pivot (see CONVERSATION_LOG.md). The original diner-facing booking PRD lives in git history. §9 lists open product questions.

## 1. Overview

RestroReserve is a staff-operated point-of-sale web app for restaurants, built mobile/tablet-first. Staff seat a customer at a table, take the order from the outlet's menu, adjust it freely until payment, then settle it — showing the outlet's payment QR (uploaded by the manager) or taking cash — print the bill, and the table frees itself. Staff also take table bookings for a time window or a whole day, and seat those parties in one tap when they arrive. Managers additionally maintain the floor plan and menu and read sales reports; owners administer outlets, users, settings, and backups.

The system is multi-tenant: one owner (organization) can run multiple restaurant outlets, each with its own menu, tables, staff, and settings.

It ships as **two builds of one codebase**, and the features are the same in both:

- **Onsite** (`apps/onsite`) — self-hosted on a machine in the restaurant. SQLite, one process, automatic JSON backups the owner schedules. Service continues when the internet does not. This is what is live today.
- **Cloud** (`apps/cloud`) — the hosted service. Postgres, many restaurants on one deployment, each on a monthly subscription, with its own logo and brand colour. Under construction.

Feature code lives in `packages/`, so a rule about money, roles or time is written once and both builds obey it. Only the parts that genuinely differ — the database driver, where files are stored, how the process is supervised — belong to an app.

## 2. Problem Statement

Small restaurants run service on paper pads and memory: orders get lost between the floor and the kitchen, bills are re-added by hand, end-of-day sales are guesswork, and the owner of two outlets has no combined view at all. Cloud POS products (Petpooja, Posist, Square) solve this but demand subscriptions, stable internet, and vendor lock-in on the restaurant's own sales data. RestroReserve is a self-hosted POS the owner controls: local-first, works on the tablets and phones already in the building, data exportable as plain JSON.

## 3. Target Users

- **Staff (waiter/counter)** — on a shared tablet or phone mid-service. Needs the fastest possible path: tap table → tap items → settle → next customer. Identified by a personal PIN on the shared device.
- **Manager** — runs one outlet. Everything staff can do, plus keeping the menu current (prices, sold-out items) and reading daily/monthly sales, table, and customer counts. Uploads the outlet's payment QR.
- **Owner / admin** — may own several outlets. Everything managers can do across all their outlets, plus creating outlets, managing users and PINs, outlet settings, and backup policy.

## 4. Goals & Success Metrics

- Staff can seat a table and send the first item to an order in under 15 seconds.
- Settling (QR shown or cash taken → bill printable → table released) takes under 30 seconds.
- A printed/rendered bill always equals the order's stored total — zero drift between bill, order record, and reports.
- A manager can answer "how did we do today?" (sales, orders, customers) in one screen.
- A full restore from the latest JSON backup reproduces every order, menu item, user, and setting.
- All screens usable one-handed on a 375px phone; primary flows equally comfortable on a tablet.

## 5. Core Features (MVP)

### 5.1 Roles, device pairing, and staff PIN sign-in
An owner or manager pairs a device with an outlet once using email + password; after that, staff sign themselves in and out with a PIN, unaided.
**Acceptance criteria:**
- Email + password login for owner and manager accounts; passwords stored hashed (bcrypt), never plaintext.
- Pairing a device to an outlet survives sign-out, browser restarts, and shift changes; only an explicit manager-level "unpair" clears it (verified: ending a shift returns to the PIN screen, not to setup).
- Staff can start a shift on a paired device with no manager present and no password — name + PIN only. Repeated sign-outs and sign-ins never require escalation.
- `/login` stays reachable while someone is signed in, because owners have no PIN and must not need another person's shift ended to regain access; a password takes over the device.
- A device that isn't paired rejects PIN sign-in outright (403) and shows first-time setup.
- Owners can switch outlets; managers/staff cannot leave theirs.
- Staff sign-in: pick user, enter a 4-digit PIN via one-box-per-digit entry (hashed at rest); wrong PINs are rate-limited per target user, so a spoofed client identity buys no extra attempts.
- PIN sign-in reaches only the paired outlet's staff and managers — never an owner account, and never a sibling outlet's people (verified by tests). Owners return to owner powers by signing in with email and password.
- Every order records who opened and who settled it.
- Role enforcement is server-side on every route: staff cannot reach menu-management, reports, or settings APIs; managers cannot reach owner-only APIs (verified by tests).
- Users from one organization can never read or write another organization's data; staff/managers cannot touch a sibling outlet's data (verified by tests).

### 5.2 Table board & seating
The staff home screen is the outlet's table board showing live occupancy.
**Acceptance criteria:**
- All active tables visible with state (free / reserved / occupied), grouped by zone, and for occupied: customer name, items count, running total, time seated.
- Seating a table opens an order; customer name optional, defaulting to "Anonymous Customer"; optional guest count.
- A table with an open order cannot be seated again (enforced server-side, not just disabled in UI).
- Table released automatically the moment its order is settled or cancelled — no manual "free table" step needed.
- A table with a booking starting soon reads "reserved" and offers one-tap seating of that party; an occupied table with a later booking still shows it.

### 5.2a Floor plan (manager)
The room is configurable without a code change or a reseed — **from the table board itself**, not a separate screen: the board already draws every table in its zone, so a second page would mean maintaining the same layout twice.
**Acceptance criteria:**
- Manager can add, rename, re-seat, re-zone, re-shape, retire and restore tables for their outlet, via an **Edit floor** toggle on `/pos`.
- Staff never see the toggle, and every write is refused server-side for them regardless of what the UI offers.
- Editing pauses the board's auto-refresh, so a poll can't discard an edit in progress.
- **Shape** (long / square / round) drives the seat diagrams on the booking cards, so staff recognise a table by its plan rather than by a word.
- **Seats** (capacity) decide which parties can be booked at a table; **zone** is free text (Floor, Courtyard, Loft, Corridor, Terrace…) so any room layout can be named, with existing zones offered as autocomplete.
- Table names are unique per outlet — staff call out "T4", not an id.
- A table that has ever taken an order or a booking can be **retired but never deleted**, so past bills stay readable; a table with no history can be deleted outright.
- An occupied table cannot be retired until its order is settled or cancelled.

### 5.2b Table bookings (staff)
A host takes bookings by phone or at the door and holds a table for a window.
**Acceptance criteria:**
- Book a named party onto a specific table for a **service period** (Lunch, Dinner…) **or the whole day**, on any date; phone, email, party size, and a free-text note (birthday, window seat) are captured. A host is never asked for a clock time — a restaurant can't promise a table at 19:15, only dinner.
- Lifecycle: **incoming** (taken but unconfirmed) → **confirmed** → **seated** → **completed**, or closed as **cancelled** / **no-show**. Staff-taken bookings land as *confirmed* — the host taking it is the confirmation; *incoming* is for a hold that still needs chasing, and shows Confirm / Cancel. An unconfirmed hold still owns its window.
- **Completed is derived, not stored**: a seated booking reads as completed once its order is settled, so a booking card can never disagree with the bill.
- Each booking card shows a plan view of its table drawn from the floor plan's shape and seat count.
- Two active bookings can never overlap on the same table; back-to-back periods (Lunch ending 15:00, then a 15:00 start) are not an overlap.
- A party larger than the table's seats is refused, naming the seat count; so is a window that has already ended, and an end time before its start.
- Day view per date with prev/next/today, laid out **by table**: every active table is a row showing its seats, zone and seat diagram, with its booked service times listed beneath it and a **Book** button that pre-selects that table. A table with nothing booked reads "Free all day" — the answer a host needs when the phone rings. Cancelled and no-shows drop to a separate Closed list; a booking whose window has run out without being seated is flagged **overdue**.
- Each booking line under a table shows its service, guest, party size, contact and status, with the one action that state calls for (Confirm / Seat / Open order / Bill); moving the period, no-show and cancel sit behind a `⋮`.
- Actions: seat, move to another period, move table, no-show, cancel. Cancelling or marking a no-show releases the window for rebooking.
- Seating a booking opens an order carrying the booking's name and party size, and links the two; a booking can only be seated once.
- **A booking never blocks service**: a walk-in can always be seated at a reserved table, with the booking left open for the host to resolve.
- Times are stored UTC and entered/displayed in the outlet's timezone.
- **A booking covering the current moment marks its table taken on the board** — the same treatment as an open order — so nobody seats a party onto a held table by accident. It stays seatable: the board's job is to warn, not to lock (a walk-in is the host's call).

### 5.2e Service periods (manager)
The named stretches of the trading day a booking can be taken against.
**Acceptance criteria:**
- Each outlet has its own list; a new outlet starts with **Breakfast 07:00–11:00, Lunch 12:00–15:00, Dinner 18:00–23:00** so bookings can be taken immediately.
- Manager can add, rename, retime, retire and restore periods, from an **Edit service times** panel on `/pos/reservations` — the screen that takes bookings is where a wrong window gets noticed. Staff can read the list (they need it to book) but not change it.
- Times are wall clock in the outlet's timezone; a period must end after it starts on the same day. An outlet trading past midnight uses an all-day hold.
- Names are unique per outlet. A period with bookings against it can be retired but not deleted.
- **Retiming or renaming a period never moves bookings already taken**: each booking snapshots its own label and UTC window, exactly as an order line snapshots its price.

### 5.2c Extras (add-ons)
Dishes are composed, not just picked: "momos, fried, extra achar".
**Acceptance criteria:**
- Manager maintains a per-outlet catalogue of priced extras (name + price, price may be 0 for a free option like "extra spicy") and ticks which items offer each one.
- The order screen shows the outlet's whole extras list on every dish card, with the ones a dish doesn't offer visibly disabled — so the rows sit in the same place on every card.
- Extras are priced **per unit**: two dishes with bacon is two bacons. The card shows a live total of (item + extras) × quantity before it's committed.
- Extra name and price snapshot onto the order line at add-time, exactly as the item's do; repricing or renaming an extra never moves an existing bill.
- The API accepts extra **ids only** — never prices — and refuses an extra the dish doesn't offer or one belonging to another outlet.
- The printed bill lists each chosen extra with its price under its line.
- An extra that has been on a bill can be retired but not deleted.

### 5.2d Dish photos
**Acceptance criteria:**
- Manager uploads a photo per menu item (PNG/JPEG/WebP, under 4 MB); items without one show a lettered placeholder.
- Photos are served from the app's own disk under `data/uploads/`, staff-authenticated, never a public URL.

### 5.3 Order taking & modification
From an open order, staff browse the outlet menu and compose the order; anything can change until payment.
**Acceptance criteria:**
- The menu reads as a **compact list that fits one screen** — a row per dish with name, price and an "Add to order" button on the right, scannable at a glance without scrolling through cards.
- **Details are hidden until a row is tapped**: description, quantity, and the extras table unfold on demand and cost no space otherwise.
- Tapping Add on a folded row adds one, with no extras — the fast path mid-service. A folded row holding a pending composition shows it (`×2 · 2 extras`) so nothing invisible is ever added; adding folds the row and resets it.
- Menu shown by category; items marked sold-out ("86") are visibly disabled and cannot be added.
- Add item with quantity and optional note (e.g. "less spicy"); change quantities; remove lines — all only while the order is open.
- Order lines snapshot the item name and price at the moment of adding: later menu edits never change an existing order or bill.
- Running total is always visible and always equals the sum of line snapshots (integer money math, no floats).
- Settled or cancelled orders are immutable; any modification attempt is rejected server-side.

### 5.4 Payment, bill, and table release
Settling an order shows the outlet's payment QR, records the method, and produces a printable bill.
**Acceptance criteria:**
- Settle flow offers QR and cash; QR displays the image the manager/owner uploaded for that outlet (each outlet has its own).
- On settle: total is frozen onto the order, settled-by and time recorded, table released.
- Printable bill (browser print / thermal-width friendly): outlet name & contact, table, date/time, line items with qty × price, total, payment method, served-by.
- An order can be cancelled (voided) instead of settled; cancelled orders release the table and are excluded from sales but retained for audit.
- Settling an already-settled order is rejected (double-settle race safe).

### 5.5 Menu management (manager+)
Managers keep the outlet menu current from the same device.
**Acceptance criteria:**
- Create/edit/delete categories and items (name, description, price, sold-out flag, published flag, order).
- Sold-out toggle reflects on staff order screens immediately (next fetch).
- Prices stored as integer minor units with the outlet's currency.
- Deleting an item never damages past orders (snapshots stand).

### 5.6 Sales reports (manager+)
Managers see how the outlet is doing; owners see any of their outlets.
**Acceptance criteria:**
- Daily and monthly views: gross sales, order count, customer count (guest counts where recorded, else order count), average order value.
- Day boundaries respect the outlet's timezone, not the server's.
- Only settled orders count toward sales; cancelled orders visible separately as voids.
- Numbers derive from the same stored totals as bills (no recomputation drift).

### 5.7 Outlets, settings & users (owner)
Owners administer the organization.
**Acceptance criteria:**
- Create/edit outlets (name, address, phone, currency, timezone); one owner account sees all its outlets.
- **Timezone defaults to UTC** for a new outlet and is owner-settable per outlet. It is validated against the IANA zones the runtime knows — an unchecked typo would silently mis-bucket every report day and shift every booking window.
- Upload/replace each outlet's payment QR image.
- Create/deactivate managers and staff, assign outlet, set/reset PINs and passwords.
- Deactivated users can no longer log in or PIN-switch but remain on historical orders.

### 5.8 Backups & restore (owner)
The database is local; backups make it safe.
**Acceptance criteria:**
- One-tap "Back up now" produces a complete JSON export of the organization's data (outlets, users sans secrets? — no: including credential hashes, so restore is complete; file readable as plain JSON).
- Auto-backup schedule per organization: off / daily / weekly, run by the server without user action; last-backup time visible.
- Backups stored on the server's disk with rotation (configurable retention); designed so a future "upload to remote server" step can consume the same files.
- Restore from a chosen backup file reproduces the organization's data exactly (round-trip verified by a test).

## 6. Later / Nice-to-Have

- **Kitchen display / order tickets (KDS)** — ticket printing to the kitchen or a kitchen screen; MVP assumes verbal handoff.
- **Remote backup upload** — pushing backup JSONs to a cloud endpoint; MVP writes them to server disk with a clean interface for this.
- **Diner-facing site (menu/booking)** — the v1 booking product, dropped in this pivot; can return per-outlet later (code in git history). Note that **staff-side** table bookings now exist (§5.2b); what remains Later is letting diners book themselves, which additionally needs opening hours, a slot engine, and a public availability view.
- **Split bills / discounts / service charge / taxes** — real needs, deliberately post-MVP; money math is integer-cents so they retrofit cleanly.
- **Table-time analytics, staff performance reports** — data (opened-by, settled-by, timestamps) is already captured.
- **Thermal printer integration (ESC/POS)** — MVP prints via the browser.
- **Offline-first PWA** — MVP assumes the device can reach the local server over LAN.

## 7. Non-Functional Requirements

- **Tenant isolation:** every query scoped by organization and outlet from the session — enforced in the data layer, not per-page goodwill.
- **Money:** integer minor units everywhere; totals frozen at settle; bill = order = report.
- **Time:** timestamps stored UTC; outlet timezone applied for display and report day-bucketing.
- **PII & secrets:** customer names are optional and default-anonymous; password/PIN hashes only; no secrets or PII in logs.
- **Resilience:** local SQLite database; JSON backup/restore; backup files rotate; restore is idempotent.
- **Performance:** table board and menu respond < 500 ms on LAN on mid-range tablets.
- **Usability:** touch targets ≥ 44px in the POS flow; works one-handed on a phone; print stylesheet fits 80mm thermal width and A4.
- **Failure UX:** no screen dead-ends. A missing page, a crashed render and a failed start each show a styled screen in plain language with a route back to the table board, and say plainly that saved orders are unaffected. A dropped connection is named as such ("check this device is on the restaurant's network") rather than reported as a generic failure, because that is the one a waiter can fix.

## 8. Out of Scope

- No online payments (QR is a static image; settlement is confirmed by the staff, not a gateway callback).
- No customer accounts, loyalty, or CRM.
- No inventory/stock management.
- No cloud multi-region hosting — this is a self-hosted, local-first system.
- No fiscal/tax compliance printing (country-specific) in MVP.

## 9. Open Questions

1. **Layouts:** owner will supply screenshots that define the POS screen layouts — current UI is a functional placeholder awaiting them.
2. **Bill numbering:** sequential per outlet per day (common for tax) or global? MVP uses order reference; confirm the required scheme.
3. **Taxes/service charge:** none in MVP — confirm whether bills must show VAT/service charge lines for your outlets.
4. **Kitchen handoff:** is a printed kitchen ticket needed at order time, or is the floor flow verbal for now?
5. **Backup destination:** where should remote backups eventually go (owner's Google Drive, a VPS, this server's sibling)?
6. **Real outlet details** for seeding (names, currencies, timezones, staff list).
