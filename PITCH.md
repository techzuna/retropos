# RestroReserve — Plain-English Overview

> A non-technical description of the product, for conversations with investors and
> customers. Written 2026-08-11 and grounded in what is actually built today —
> the "Not built yet" section is there deliberately, because the fastest way to
> lose a customer is to demo something that doesn't exist.

---

## The short version — read this one

**What it is.** Till and bookings software for restaurants that runs on a small
computer inside the restaurant instead of in the cloud.

**Why that matters.** Two things the big cloud products cannot offer: it **keeps
working when the internet goes down**, and there's **no monthly fee — the sales
data stays on the restaurant's own machine.**

**What it does.** Staff sign in with a PIN on phones and tablets they already
own. They see a live floor plan of the real room, tap dishes to build an order
(with priced options like extra portions), settle by showing the payment QR or
taking cash, and print the bill — the table frees itself. Phone bookings are held
per table by service (lunch, dinner) and can never be double-booked. Managers
edit the menu, prices, photos and sold-out items, and read daily and monthly
sales. Owners run several branches from one system, manage staff PINs, and get
automatic backups they can restore themselves.

**Not built yet** (don't demo these): guests booking online, kitchen screens,
split bills and tax lines, card payments, inventory, loyalty.

**How it earns.** Sell a licence plus installation today. Add an annual
support-and-updates fee — the best next step, because it turns one-off sales into
recurring income and needs no new development. Price per branch, since
multi-branch is already built. Then hardware, menu setup, training and local
resellers. Later: a monthly hosted tier and paid add-on modules from the "not
built yet" list.

**One line:** *the restaurant's own till, on its own Wi-Fi, with its own data — no
subscription, no internet dependency, no lock-in.*

---

## In one paragraph

RestroReserve is till-and-bookings software for restaurants. Staff use the
phones and tablets they already own to seat guests, take orders, hold tables for
bookings, and settle bills. Unlike the well-known cloud products, it runs on a
small computer inside the restaurant, so **it keeps working when the internet
goes down**, there is no monthly fee to the vendor, and the restaurant's sales
data stays on the restaurant's own machine.

## In one sentence

The restaurant's own till, on its own Wi-Fi, with its own data — no
subscription, no internet dependency, no lock-in.

---

## The problem it solves

Small and mid-sized restaurants today have two bad options.

**Option one: pen and paper.** Orders get lost between the floor and the
kitchen. Bills are added up by hand, so mistakes cost money and arguments cost
goodwill. At the end of the day nobody really knows what was sold. An owner with
two branches has no combined picture at all.

**Option two: a cloud POS** (Petpooja, Posist, Square and similar). These solve
the paperwork, but they bring three problems of their own:

1. **A subscription forever.** The fee never stops, and it usually rises.
2. **Total dependence on the internet.** When the connection drops — common
   outside major cities, and not rare inside them — the till stops. Service
   stops with it.
3. **Someone else holds the data.** The restaurant's own sales history lives on
   a vendor's servers, and getting it out is deliberately awkward.

RestroReserve is built for the owner who wants the first problem solved without
buying the second set.

---

## How it works, in everyday terms

Think of it as putting a small, silent computer in the back office — a box about
the size of a paperback, or a spare laptop. It connects to the restaurant's
Wi-Fi. That's the whole installation.

Staff then open it like a website on any phone or tablet already in the
building. Nothing to install on their devices, no app store, no per-device
licence.

Because the box is *in* the restaurant, the till talks to it over the local
Wi-Fi. That's why an internet outage doesn't matter: the internet was never in
the loop.

---

## What it does today

### For waiters and floor staff

- **Sign in with a 4-digit PIN.** A manager sets a tablet up once; after that
  staff sign themselves in and out all shift without waiting for anyone. Handing
  the tablet to the next person takes one tap.
- **A live floor plan.** Every table is shown grouped by area — Floor,
  Courtyard, Loft, whatever the restaurant calls them — and drawn to match its
  real shape and seat count, so staff recognise their own room at a glance.
  Colour tells the whole story: free, booked, or occupied.
- **Take an order in seconds.** Tap a table, tap dishes. The full menu fits one
  screen. Tap a dish to open its options — "extra achar", "double portion",
  "fried, not steamed" — each with its own price, and the total updates as you
  go.
- **Change anything until payment.** Add, remove, adjust quantities, add a note
  for the kitchen.
- **Settle and print.** Show the restaurant's payment QR on screen, or take
  cash. The bill prints on a standard 80mm receipt printer or A4, and the table
  frees itself the moment payment is recorded.

### For whoever answers the phone

- **Take bookings by service, not by clock time.** A restaurant can't promise a
  table at 7:15pm, but it can promise dinner — so bookings are made against
  Breakfast, Lunch, Dinner (or any period the restaurant defines), or held for
  the whole day.
- **The day laid out by table.** The screen answers the question actually being
  asked on the phone: *is table C1 free for dinner?* Tables with nothing booked
  simply say "Free all day".
- **No double-bookings, ever.** The software refuses to promise the same table
  twice for the same service.
- **A booking's whole life is visible** — taken, confirmed, guests seated, bill
  paid — plus no-shows and cancellations, with a flag on any booking whose time
  has passed and nobody was seated.
- **One tap to seat them.** The order opens already carrying the guest's name
  and party size.

### For managers

- **Keep the menu current** — prices, photos, and a one-tap "sold out" switch
  that removes a dish from the ordering screen instantly, while leaving every
  past bill untouched.
- **Manage the shared list of extras** and choose which dishes offer which.
- **Rearrange the room** — add tables, change seat counts, rename or re-zone —
  from the same floor plan the staff use, with no separate admin screen.
- **Set the trading day** — what Lunch and Dinner mean, in hours.
- **Read the numbers**: sales, order count, guests served and average order
  value, by day or by month, always in the restaurant's own local time.

### For the owner

- **Several branches, one system.** Each outlet keeps its own menu, prices,
  tables, staff and bookings; the owner can move between them. Currency and
  timezone are per outlet.
- **Staff accounts and PINs**, with three levels of access — staff, manager,
  owner — enforced by the software, not just hidden from view.
- **Backups that a non-technical person can actually use.** The system backs
  itself up on a schedule the owner chooses, keeps a set number of copies, and
  restores from any of them in a couple of taps. Because everything lives in a
  single file, "back up the restaurant" is a real, simple operation.

---

## Why a customer would choose it

| | RestroReserve | Typical cloud POS |
|---|---|---|
| Monthly fee to vendor | None *(licence model — see below)* | Forever, per outlet |
| Works during an internet outage | **Yes** | No |
| Where the sales data lives | The restaurant's own machine | The vendor's servers |
| Getting your data out | A plain file you can copy | Export, if offered |
| Devices needed | Phones/tablets staff already have | Often vendor hardware |
| Setup | One small box on the Wi-Fi | Account + internet |

The two arguments that land hardest in practice are **"your till keeps working
when the line goes down"** and **"you stop paying rent on your own data."**

---

## Not built yet — say this plainly

Everything above works today and has been tested. The following are *not* in the
product, and shouldn't be shown or promised:

- **Guests booking themselves online.** Bookings are taken by staff. A
  diner-facing booking page is planned.
- **Kitchen screens or printed kitchen tickets.** Orders currently reach the
  kitchen the way they always did.
- **Splitting bills, discounts, service charge, tax lines.** All planned; the
  money handling was built so they can be added cleanly.
- **Automatic tax/fiscal receipts** for any specific country's rules.
- **Card or online payments.** Payment is a QR code shown on screen, or cash,
  confirmed by the member of staff — the software never touches card details,
  which also keeps it out of payment-compliance scope.
- **Stock and inventory.**
- **Customer accounts or loyalty.**
- **Off-site backup upload.** Backups are written on the restaurant's machine;
  copying them off-site is currently a manual habit.
- **Self-service sign-up.** Each installation serves one restaurant business.
  Selling to many customers from one central system is designed but not built.

That last point matters for how the business can be run, and it's covered below.

---

## How it can make money

Five models, roughly in order of how soon each could start.

### 1. Licence + installation (available now)

A one-off fee for the software, plus a fee for setting it up: the box, the
Wi-Fi, entering the real menu, training the staff. This matches the product as
it stands and needs no further development.

- **Strength:** revenue from day one; no infrastructure cost to carry; the "no
  subscription" pitch stays true.
- **Weakness:** no recurring income, so growth depends on finding new
  restaurants rather than keeping old ones.

### 2. Annual support and updates (available now)

A modest yearly fee for updates, priority support and a checked backup. The
standard model for software people run themselves.

- **Strength:** turns one-off sales into predictable income while keeping the
  honest "you own it" story — they keep the software if they stop paying, they
  just stop getting updates.
- **This is the single highest-value addition to the current business model**,
  because it needs no new code.

### 3. Per-outlet pricing (available now)

Multi-branch support is already built and tested, so pricing can scale with the
customer: one fee for the first outlet, less for each additional one. A
three-branch group pays more than a single café for the same software, which is
fair to both.

### 4. Hardware and services (available now)

- Pre-configured mini-PCs, sold at a margin.
- Menu data entry — genuinely tedious, and worth paying to avoid.
- Staff training sessions.
- Custom bill layouts, local-language menus, branding.
- A **reseller channel**: local IT shops install and support it for a cut. This
  is how self-hosted software usually reaches small businesses, because someone
  local has to plug the box in.

### 5. Managed hosting — a subscription business (needs development)

Running it for customers on our servers, so they need no box and no IT. This is
the model with the highest lifetime value per customer and the one investors
usually ask about.

Being straight about it: the architecture for this is **designed but not built**.
It needs customer sign-up, per-customer data separation at the hosting layer,
billing, and an admin console. It also changes the product's core promise — a
hosted till stops when the internet stops, which is exactly the weakness the
product currently wins on.

The sensible framing is **both**: self-hosted for restaurants that value
independence and unreliable-connection resilience, hosted for those who would
rather pay monthly and own nothing. The same codebase serves both.

### 6. Paid add-on modules (needs development)

The unbuilt list above is a natural price list: online booking, kitchen display,
thermal printing, inventory, loyalty, advanced reporting. Each is a discrete
upsell to an existing customer rather than a new sale.

---

## An illustrative model — not a forecast

The arithmetic below shows the *shape* of the business. **The numbers are
placeholders.** Real pricing needs local market research, and market-size claims
should come from a sourced report, not from this document.

Assume a licence of L per outlet, a setup fee of S, and annual support of A:

| Year | 100 outlets sold cumulatively | Revenue |
|---|---|---|
| 1 | 40 new | 40 × (L + S) |
| 2 | 30 new + 40 renewing | 30 × (L + S) + 40 × A |
| 3 | 30 new + 70 renewing | 30 × (L + S) + 70 × A |

The point is the second column: support renewals compound while new sales stay
flat, so the business gets less dependent on constant selling. With a hosted
tier, the recurring share grows faster still.

**What to research before quoting numbers to an investor:** typical POS spend
per restaurant in the target market, the number of restaurants in reach,
realistic sales cycle length, and what installation actually costs in labour.

---

## Honest risks

An investor will ask. Better to raise them first.

- **Self-hosted software is a support burden.** When something breaks it's on a
  machine we can't reach. This is real and needs deliberate design in the
  support offering.
- **Updates need a person.** Improvements don't reach customers automatically
  the way a cloud product's do.
- **No central visibility.** We can't see how customers are using it, which
  makes product decisions slower and rules out usage-based pricing — unless the
  hosted tier is built.
- **The competition is well funded** and can outspend us on marketing. The
  defence is the two things they structurally cannot offer: working offline, and
  not renting the customer their own data.
- **Feature gaps in the list above** will lose specific deals — kitchen
  printing and split bills most often.

---

## Where the product stands

Built, working and covered by 83 automated tests: staff sign-in and roles,
floor plan, order taking with priced options, QR and cash settlement, printable
bills, bookings by service period, menu and extras management, multi-branch
support, sales reporting, and scheduled backup with restore.

It runs on a small computer or a rented server, has no third-party service
dependencies and no API keys, and stores everything in one file that can be
copied. The design decisions, and the reasoning behind each, are documented in
the repository.
