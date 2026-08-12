module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/apps/outlet/src/app/favicon.ico (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/favicon.2vob68tjqpejf.ico" + (globalThis["NEXT_CLIENT_ASSET_SUFFIX"] || ''));}),
"[project]/apps/outlet/src/app/favicon.ico.mjs { IMAGE => \"[project]/apps/outlet/src/app/favicon.ico (static in ecmascript, tag client)\" } [app-rsc] (structured image object, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$app$2f$favicon$2e$ico__$28$static__in__ecmascript$2c$__tag__client$29$__ = __turbopack_context__.i("[project]/apps/outlet/src/app/favicon.ico (static in ecmascript, tag client)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$app$2f$favicon$2e$ico__$28$static__in__ecmascript$2c$__tag__client$29$__["default"],
    width: 256,
    height: 256
};
}),
"[project]/packages/domain/src/time.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addDays",
    ()=>addDays,
    "isCanonicalDate",
    ()=>isCanonicalDate,
    "isCanonicalTime",
    ()=>isCanonicalTime,
    "isValidTimezone",
    ()=>isValidTimezone,
    "listTimezones",
    ()=>listTimezones,
    "localDate",
    ()=>localDate,
    "localDayStartUtc",
    ()=>localDayStartUtc,
    "localMonth",
    ()=>localMonth,
    "localTimeLabel",
    ()=>localTimeLabel,
    "wallTimeToUtc",
    ()=>wallTimeToUtc
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$date$2d$fns$2f$tz$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@date-fns/tz/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$date$2d$fns$2f$tz$2f$date$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@date-fns/tz/date/index.js [app-rsc] (ecmascript)");
;
function pad(n) {
    return String(n).padStart(2, "0");
}
function localDate(instant, timezone) {
    const z = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$date$2d$fns$2f$tz$2f$date$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["TZDate"](instant.getTime(), timezone);
    return `${z.getFullYear()}-${pad(z.getMonth() + 1)}-${pad(z.getDate())}`;
}
function localMonth(instant, timezone) {
    return localDate(instant, timezone).slice(0, 7);
}
function localDayStartUtc(date, timezone) {
    const [y, mo, d] = date.split("-").map(Number);
    return new Date(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$date$2d$fns$2f$tz$2f$date$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["TZDate"].tz(timezone, y, mo - 1, d, 0, 0, 0).getTime());
}
function wallTimeToUtc(date, time, timezone) {
    const [y, mo, d] = date.split("-").map(Number);
    const [h, mi] = time.split(":").map(Number);
    return new Date(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$date$2d$fns$2f$tz$2f$date$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["TZDate"].tz(timezone, y, mo - 1, d, h, mi, 0).getTime());
}
function localTimeLabel(instant, timezone) {
    const z = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$date$2d$fns$2f$tz$2f$date$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["TZDate"](instant.getTime(), timezone);
    return `${pad(z.getHours())}:${pad(z.getMinutes())}`;
}
function isCanonicalTime(time) {
    if (!/^\d{2}:\d{2}$/.test(time)) return false;
    const [h, mi] = time.split(":").map(Number);
    return h >= 0 && h <= 23 && mi >= 0 && mi <= 59;
}
function isValidTimezone(tz) {
    try {
        new Intl.DateTimeFormat("en-US", {
            timeZone: tz
        });
        return true;
    } catch  {
        return false;
    }
}
function listTimezones() {
    return [
        ...Intl.supportedValuesOf("timeZone")
    ];
}
function addDays(date, days) {
    const [y, mo, d] = date.split("-").map(Number);
    const t = new Date(Date.UTC(y, mo - 1, d + days));
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}
function isCanonicalDate(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const [y, mo, d] = date.split("-").map(Number);
    const dt = new Date(Date.UTC(y, mo - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}
}),
"[project]/apps/outlet/src/lib/reservations.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RESERVATION_LEAD_MINUTES",
    ()=>RESERVATION_LEAD_MINUTES,
    "cancelReservation",
    ()=>cancelReservation,
    "confirmReservation",
    ()=>confirmReservation,
    "createReservation",
    ()=>createReservation,
    "listReservations",
    ()=>listReservations,
    "markNoShow",
    ()=>markNoShow,
    "reservationHoldsByTable",
    ()=>reservationHoldsByTable,
    "seatReservation",
    ()=>seatReservation,
    "updateReservation",
    ()=>updateReservation,
    "windowsOverlap",
    ()=>windowsOverlap
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/domain/src/errors.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$constants$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/domain/src/constants.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$time$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/domain/src/time.ts [app-rsc] (ecmascript)");
;
;
;
const RESERVATION_LEAD_MINUTES = 45;
function windowsOverlap(a, b) {
    return a.startAt < b.endAt && a.endAt > b.startAt;
}
/** The calendar day after `date`, as "YYYY-MM-DD". */ function nextDay(date) {
    const [y, mo, d] = date.split("-").map(Number);
    const t = new Date(Date.UTC(y, mo - 1, d + 1));
    return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}
/**
 * Turn the host's local date + chosen period into UTC instants, plus the label
 * to snapshot onto the booking.
 *
 * `allDay` spans local midnight to the next local midnight, which is why it goes
 * through `wallTimeToUtc` on the following date rather than adding 24 hours — a
 * DST shift makes those different lengths.
 */ async function resolveWindow(ctx, input, timezone) {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$time$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isCanonicalDate"])(input.date)) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("VALIDATION", "Give a real date as YYYY-MM-DD.");
    }
    if (input.allDay) {
        return {
            startAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$time$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["wallTimeToUtc"])(input.date, "00:00", timezone),
            endAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$time$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["wallTimeToUtc"])(nextDay(input.date), "00:00", timezone),
            periodLabel: __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$constants$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ALL_DAY_LABEL"],
            servicePeriodId: null
        };
    }
    if (!input.servicePeriodId) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("VALIDATION", "Pick a service period, or hold the table all day.");
    }
    const period = await ctx.db.servicePeriod.findFirst({
        where: {
            id: input.servicePeriodId,
            outletId: ctx.outletId,
            active: true
        },
        select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true
        }
    });
    if (!period) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("NOT_FOUND", "That service period isn't set up for this outlet.");
    }
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$time$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isCanonicalTime"])(period.startTime) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$time$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isCanonicalTime"])(period.endTime)) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("VALIDATION", `${period.name} has an invalid time window — fix it first.`);
    }
    return {
        startAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$time$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["wallTimeToUtc"])(input.date, period.startTime, timezone),
        endAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$time$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["wallTimeToUtc"])(input.date, period.endTime, timezone),
        // Snapshot the name: renaming "Dinner" later must not relabel tonight's book.
        periodLabel: period.name,
        servicePeriodId: period.id
    };
}
async function outletTimezone(ctx) {
    const outlet = await ctx.db.outlet.findUniqueOrThrow({
        where: {
            id: ctx.outletId
        },
        select: {
            timezone: true
        }
    });
    return outlet.timezone;
}
async function createReservation(ctx, input) {
    const timezone = await outletTimezone(ctx);
    const { startAt, endAt, periodLabel, servicePeriodId } = await resolveWindow(ctx, input, timezone);
    const table = await ctx.db.diningTable.findFirst({
        where: {
            id: input.tableId,
            outletId: ctx.outletId,
            active: true
        },
        select: {
            id: true,
            name: true,
            capacity: true
        }
    });
    if (!table) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("NOT_FOUND", "No such table in this outlet.");
    // A party that doesn't fit is a booking that will fail at the door.
    if (input.partySize > table.capacity) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("VALIDATION", `${table.name} seats ${table.capacity}. Pick a bigger table for ${input.partySize}.`);
    }
    // Yesterday's booking is a typo, not a plan. A window that has already ended
    // is refused; one that has merely started is fine (walk-in being logged).
    if (endAt.getTime() <= Date.now()) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("VALIDATION", "That time has already passed.");
    }
    return ctx.db.$transaction(async (tx)=>{
        const clash = await tx.reservation.findFirst({
            where: {
                tableId: table.id,
                status: {
                    in: [
                        ...__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$constants$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ACTIVE_RESERVATION_STATUSES"]
                    ]
                },
                startAt: {
                    lt: endAt
                },
                endAt: {
                    gt: startAt
                }
            },
            select: {
                id: true,
                customerName: true,
                startAt: true
            }
        });
        if (clash) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("TABLE_DOUBLE_BOOKED", `${table.name} is already held for ${clash.customerName} in that window.`);
        }
        return tx.reservation.create({
            data: {
                outletId: ctx.outletId,
                tableId: table.id,
                customerName: input.customerName.trim() || __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$constants$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DEFAULT_CUSTOMER_NAME"],
                phone: input.phone?.trim() ?? "",
                email: input.email?.trim().toLowerCase() ?? "",
                partySize: input.partySize,
                startAt,
                endAt,
                allDay: input.allDay ?? false,
                servicePeriodId,
                periodLabel,
                // A host taking the booking IS the confirmation, so staff entry lands
                // as `confirmed` and doesn't make them confirm their own typing.
                // `incoming` is for a hold that still needs chasing.
                status: input.needsConfirmation ? "incoming" : "confirmed",
                notes: input.notes?.trim() ?? "",
                createdById: ctx.userId
            }
        });
    });
}
async function listReservations(ctx, date) {
    const timezone = await outletTimezone(ctx);
    const day = date ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$time$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["localDate"])(new Date(), timezone);
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$time$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isCanonicalDate"])(day)) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("VALIDATION", "Give a real date as YYYY-MM-DD.");
    // Anything overlapping the local day, so an all-day or late booking made on
    // the previous date still shows on the day it actually runs.
    const dayStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$time$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["wallTimeToUtc"])(day, "00:00", timezone);
    const dayEnd = new Date(dayStart.getTime() + 25 * 60 * 60 * 1000);
    const rows = await ctx.db.reservation.findMany({
        where: {
            outletId: ctx.outletId,
            startAt: {
                lt: dayEnd
            },
            endAt: {
                gt: dayStart
            }
        },
        orderBy: [
            {
                startAt: "asc"
            },
            {
                customerName: "asc"
            }
        ],
        include: {
            table: {
                select: {
                    id: true,
                    name: true,
                    zone: true,
                    capacity: true,
                    shape: true
                }
            },
            createdBy: {
                select: {
                    name: true
                }
            },
            order: {
                select: {
                    id: true,
                    status: true,
                    totalCents: true
                }
            }
        }
    });
    // `completed` is derived from the linked order being settled rather than
    // stored, so a booking card can never disagree with the bill it produced.
    const reservations = rows.map((r)=>({
            ...r,
            displayStatus: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$constants$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["displayReservationStatus"])(r.status, r.order?.status)
        }));
    return {
        date: day,
        timezone,
        reservations
    };
}
async function reservationHoldsByTable(ctx, now = new Date()) {
    const horizon = new Date(now.getTime() + RESERVATION_LEAD_MINUTES * 60_000);
    const rows = await ctx.db.reservation.findMany({
        where: {
            outletId: ctx.outletId,
            status: {
                in: [
                    ...__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$constants$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["HOLDING_RESERVATION_STATUSES"]
                ]
            },
            startAt: {
                lt: horizon
            },
            endAt: {
                gt: now
            }
        },
        orderBy: {
            startAt: "asc"
        },
        select: {
            id: true,
            tableId: true,
            customerName: true,
            partySize: true,
            startAt: true,
            endAt: true,
            status: true,
            periodLabel: true,
            allDay: true
        }
    });
    const byTable = new Map();
    function holdOf(r) {
        return {
            id: r.id,
            customerName: r.customerName,
            partySize: r.partySize,
            periodLabel: r.periodLabel || (r.allDay ? __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$constants$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ALL_DAY_LABEL"] : "Booking"),
            allDay: r.allDay,
            confirmed: r.status === "confirmed",
            startAt: r.startAt,
            endAt: r.endAt,
            active: r.startAt <= now
        };
    }
    // Earliest-first, so the first row per table is the one to show.
    for (const r of rows)if (!byTable.has(r.tableId)) byTable.set(r.tableId, holdOf(r));
    return byTable;
}
/** A booking still open to changes: taken, not yet seated or closed out. */ async function openReservation(ctx, id) {
    const reservation = await ctx.db.reservation.findFirst({
        where: {
            id,
            outletId: ctx.outletId
        },
        select: {
            id: true,
            status: true,
            tableId: true,
            customerName: true,
            partySize: true
        }
    });
    if (!reservation) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("NOT_FOUND", "Booking not found.");
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$constants$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["HOLDING_RESERVATION_STATUSES"].includes(reservation.status)) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("RESERVATION_CLOSED", `This booking is already ${reservation.status.replace("_", " ")}.`);
    }
    return reservation;
}
async function confirmReservation(ctx, id) {
    const reservation = await openReservation(ctx, id);
    if (reservation.status === "confirmed") return; // idempotent: double-tap is harmless
    const { count } = await ctx.db.reservation.updateMany({
        where: {
            id,
            outletId: ctx.outletId,
            status: "incoming"
        },
        data: {
            status: "confirmed"
        }
    });
    if (count === 0) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("RESERVATION_CLOSED", "This booking was already closed.");
}
async function updateReservation(ctx, id, input) {
    const existing = await openReservation(ctx, id);
    const timezone = await outletTimezone(ctx);
    const current = await ctx.db.reservation.findUniqueOrThrow({
        where: {
            id
        },
        select: {
            startAt: true,
            endAt: true,
            allDay: true,
            tableId: true,
            partySize: true,
            servicePeriodId: true,
            periodLabel: true
        }
    });
    const tableId = input.tableId ?? current.tableId;
    const table = await ctx.db.diningTable.findFirst({
        where: {
            id: tableId,
            outletId: ctx.outletId,
            active: true
        },
        select: {
            id: true,
            name: true,
            capacity: true
        }
    });
    if (!table) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("NOT_FOUND", "No such table in this outlet.");
    const partySize = input.partySize ?? current.partySize;
    if (partySize > table.capacity) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("VALIDATION", `${table.name} seats ${table.capacity}. Pick a bigger table for ${partySize}.`);
    }
    // Only recompute the window when the caller actually sent one; a plain
    // rename must not have to restate the day or the period.
    const rescheduling = input.date !== undefined || input.servicePeriodId !== undefined || input.allDay !== undefined;
    const window = rescheduling ? await resolveWindow(ctx, {
        date: input.date ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$time$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["localDate"])(current.startAt, timezone),
        servicePeriodId: input.servicePeriodId ?? current.servicePeriodId ?? undefined,
        allDay: input.allDay ?? (input.servicePeriodId ? false : current.allDay)
    }, timezone) : {
        startAt: current.startAt,
        endAt: current.endAt,
        periodLabel: current.periodLabel,
        servicePeriodId: current.servicePeriodId
    };
    await ctx.db.$transaction(async (tx)=>{
        const clash = await tx.reservation.findFirst({
            where: {
                id: {
                    not: existing.id
                },
                tableId: table.id,
                status: {
                    in: [
                        ...__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$constants$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ACTIVE_RESERVATION_STATUSES"]
                    ]
                },
                startAt: {
                    lt: window.endAt
                },
                endAt: {
                    gt: window.startAt
                }
            },
            select: {
                customerName: true
            }
        });
        if (clash) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("TABLE_DOUBLE_BOOKED", `${table.name} is already held for ${clash.customerName} in that window.`);
        }
        await tx.reservation.update({
            where: {
                id: existing.id
            },
            data: {
                tableId: table.id,
                partySize,
                startAt: window.startAt,
                endAt: window.endAt,
                ...rescheduling ? {
                    allDay: input.allDay ?? (input.servicePeriodId ? false : current.allDay),
                    servicePeriodId: window.servicePeriodId,
                    periodLabel: window.periodLabel
                } : {},
                ...input.customerName !== undefined ? {
                    customerName: input.customerName.trim()
                } : {},
                ...input.phone !== undefined ? {
                    phone: input.phone.trim()
                } : {},
                ...input.email !== undefined ? {
                    email: input.email.trim().toLowerCase()
                } : {},
                ...input.notes !== undefined ? {
                    notes: input.notes.trim()
                } : {}
            }
        });
    });
}
/** Guarded status change: only a still-holding row can be closed out. */ async function closeReservation(ctx, id, status) {
    await openReservation(ctx, id);
    const { count } = await ctx.db.reservation.updateMany({
        where: {
            id,
            outletId: ctx.outletId,
            status: {
                in: [
                    ...__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$constants$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["HOLDING_RESERVATION_STATUSES"]
                ]
            }
        },
        data: {
            status
        }
    });
    if (count === 0) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("RESERVATION_CLOSED", "This booking was already closed.");
}
const cancelReservation = (ctx, id)=>closeReservation(ctx, id, "cancelled");
const markNoShow = (ctx, id)=>closeReservation(ctx, id, "no_show");
async function seatReservation(ctx, id) {
    const reservation = await openReservation(ctx, id);
    return ctx.db.$transaction(async (tx)=>{
        const openOrder = await tx.order.findFirst({
            where: {
                tableId: reservation.tableId,
                status: "open"
            },
            select: {
                id: true
            }
        });
        if (openOrder) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("TABLE_OCCUPIED", "That table already has an open order.");
        }
        const order = await tx.order.create({
            data: {
                outletId: ctx.outletId,
                tableId: reservation.tableId,
                customerName: reservation.customerName,
                guestCount: reservation.partySize,
                openedById: ctx.userId
            }
        });
        const { count } = await tx.reservation.updateMany({
            where: {
                id: reservation.id,
                status: {
                    in: [
                        ...__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$constants$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["HOLDING_RESERVATION_STATUSES"]
                    ]
                }
            },
            data: {
                status: "seated",
                orderId: order.id
            }
        });
        if (count === 0) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("RESERVATION_CLOSED", "This booking was already closed.");
        return order;
    });
}
}),
"[project]/apps/outlet/src/lib/orders.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addOrderItem",
    ()=>addOrderItem,
    "cancelOrder",
    ()=>cancelOrder,
    "getOrder",
    ()=>getOrder,
    "getTableBoard",
    ()=>getTableBoard,
    "getTableForOrdering",
    ()=>getTableForOrdering,
    "lineTotalCents",
    ()=>lineTotalCents,
    "orderTotalCents",
    ()=>orderTotalCents,
    "removeOrderItem",
    ()=>removeOrderItem,
    "seatTable",
    ()=>seatTable,
    "settleOrder",
    ()=>settleOrder,
    "updateOrderItem",
    ()=>updateOrderItem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/domain/src/errors.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$constants$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/domain/src/constants.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$lib$2f$reservations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/outlet/src/lib/reservations.ts [app-rsc] (ecmascript)");
;
;
;
function lineTotalCents(line) {
    const extras = (line.modifiers ?? []).reduce((sum, m)=>sum + m.priceCents, 0);
    return (line.priceCents + extras) * line.quantity;
}
function orderTotalCents(items) {
    return items.reduce((sum, it)=>sum + lineTotalCents(it), 0);
}
async function getTableBoard(ctx) {
    const [tables, openOrders, holds] = await Promise.all([
        ctx.db.diningTable.findMany({
            where: {
                outletId: ctx.outletId,
                active: true
            },
            orderBy: [
                {
                    zone: "asc"
                },
                {
                    sortOrder: "asc"
                },
                {
                    name: "asc"
                }
            ],
            select: {
                id: true,
                name: true,
                capacity: true,
                zone: true,
                shape: true
            }
        }),
        ctx.db.order.findMany({
            where: {
                outletId: ctx.outletId,
                status: "open"
            },
            select: {
                id: true,
                tableId: true,
                customerName: true,
                guestCount: true,
                openedAt: true,
                items: {
                    select: {
                        priceCents: true,
                        quantity: true,
                        modifiers: {
                            select: {
                                priceCents: true
                            }
                        }
                    }
                }
            }
        }),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$lib$2f$reservations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["reservationHoldsByTable"])(ctx)
    ]);
    const byTable = new Map(openOrders.map((o)=>[
            o.tableId,
            o
        ]));
    return tables.map((t)=>{
        const order = byTable.get(t.id);
        return {
            ...t,
            order: order ? {
                id: order.id,
                customerName: order.customerName,
                guestCount: order.guestCount,
                openedAt: order.openedAt,
                itemCount: order.items.reduce((n, it)=>n + it.quantity, 0),
                totalCents: orderTotalCents(order.items)
            } : null,
            hold: holds.get(t.id) ?? null
        };
    });
}
async function getTableForOrdering(ctx, tableId) {
    const table = await ctx.db.diningTable.findFirst({
        where: {
            id: tableId,
            outletId: ctx.outletId,
            active: true
        },
        select: {
            id: true,
            name: true,
            capacity: true,
            zone: true
        }
    });
    if (!table) return null;
    const [openOrder, holds] = await Promise.all([
        ctx.db.order.findFirst({
            where: {
                tableId: table.id,
                status: "open"
            },
            select: {
                id: true
            }
        }),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$lib$2f$reservations$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["reservationHoldsByTable"])(ctx)
    ]);
    return {
        table,
        openOrderId: openOrder?.id ?? null,
        hold: holds.get(table.id) ?? null
    };
}
async function seatTable(ctx, input) {
    const table = await ctx.db.diningTable.findFirst({
        where: {
            id: input.tableId,
            outletId: ctx.outletId,
            active: true
        },
        select: {
            id: true
        }
    });
    if (!table) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("NOT_FOUND", "No such table in this outlet.");
    // SQLite serializes writes, so the check-then-create inside one transaction
    // cannot interleave with another seat of the same table.
    return ctx.db.$transaction(async (tx)=>{
        const existing = await tx.order.findFirst({
            where: {
                tableId: table.id,
                status: "open"
            },
            select: {
                id: true
            }
        });
        if (existing) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("TABLE_OCCUPIED", "That table already has an open order.");
        return tx.order.create({
            data: {
                outletId: ctx.outletId,
                tableId: table.id,
                customerName: input.customerName?.trim() || __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$constants$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DEFAULT_CUSTOMER_NAME"],
                guestCount: input.guestCount,
                openedById: ctx.userId
            }
        });
    });
}
async function getOrder(ctx, orderId) {
    const order = await ctx.db.order.findFirst({
        where: {
            id: orderId,
            outletId: ctx.outletId
        },
        include: {
            items: {
                orderBy: {
                    addedAt: "asc"
                },
                include: {
                    modifiers: {
                        select: {
                            id: true,
                            name: true,
                            priceCents: true
                        }
                    }
                }
            },
            table: {
                select: {
                    name: true
                }
            },
            openedBy: {
                select: {
                    name: true
                }
            },
            settledBy: {
                select: {
                    name: true
                }
            }
        }
    });
    if (!order) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("NOT_FOUND", "Order not found.");
    return {
        ...order,
        // Live total for open orders; settled/cancelled orders show frozen state.
        runningTotalCents: order.status === "open" ? orderTotalCents(order.items) : order.totalCents
    };
}
async function getOpenOrder(ctx, orderId) {
    const order = await ctx.db.order.findFirst({
        where: {
            id: orderId,
            outletId: ctx.outletId
        },
        select: {
            id: true,
            status: true
        }
    });
    if (!order) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("NOT_FOUND", "Order not found.");
    if (order.status !== "open") {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("ORDER_NOT_OPEN", "This order is closed and can't be changed.");
    }
    return order;
}
async function addOrderItem(ctx, orderId, input) {
    await getOpenOrder(ctx, orderId);
    const item = await ctx.db.menuItem.findFirst({
        where: {
            id: input.menuItemId,
            published: true,
            category: {
                outletId: ctx.outletId,
                published: true
            }
        },
        select: {
            id: true,
            name: true,
            priceCents: true,
            available: true
        }
    });
    if (!item) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("NOT_FOUND", "That item isn't on this outlet's menu.");
    if (!item.available) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("ITEM_UNAVAILABLE", `${item.name} is sold out today.`);
    // Extras are resolved from the item's own allow-list, so a client can neither
    // invent a price nor attach an extra this dish doesn't offer. Prices come
    // from the database at add-time, exactly as the base item's does.
    const wanted = [
        ...new Set(input.modifierIds ?? [])
    ];
    const extras = wanted.length ? await ctx.db.modifier.findMany({
        where: {
            id: {
                in: wanted
            },
            outletId: ctx.outletId,
            active: true,
            items: {
                some: {
                    menuItemId: item.id
                }
            }
        },
        select: {
            id: true,
            name: true,
            priceCents: true
        }
    }) : [];
    if (extras.length !== wanted.length) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("NOT_FOUND", `One of those extras isn't offered on ${item.name}.`);
    }
    // Snapshot name and price: later menu edits must never change this order.
    return ctx.db.orderItem.create({
        data: {
            orderId,
            menuItemId: item.id,
            name: item.name,
            priceCents: item.priceCents,
            quantity: input.quantity,
            notes: input.notes?.trim() ?? "",
            modifiers: {
                create: extras.map((m)=>({
                        modifierId: m.id,
                        name: m.name,
                        priceCents: m.priceCents
                    }))
            }
        },
        include: {
            modifiers: {
                select: {
                    id: true,
                    name: true,
                    priceCents: true
                }
            }
        }
    });
}
async function updateOrderItem(ctx, orderId, itemId, input) {
    await getOpenOrder(ctx, orderId);
    const { count } = await ctx.db.orderItem.updateMany({
        where: {
            id: itemId,
            orderId
        },
        data: {
            ...input.quantity !== undefined ? {
                quantity: input.quantity
            } : {},
            ...input.notes !== undefined ? {
                notes: input.notes.trim()
            } : {}
        }
    });
    if (count === 0) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("NOT_FOUND", "That line isn't on this order.");
}
async function removeOrderItem(ctx, orderId, itemId) {
    await getOpenOrder(ctx, orderId);
    const { count } = await ctx.db.orderItem.deleteMany({
        where: {
            id: itemId,
            orderId
        }
    });
    if (count === 0) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("NOT_FOUND", "That line isn't on this order.");
}
async function settleOrder(ctx, orderId, method) {
    return ctx.db.$transaction(async (tx)=>{
        const order = await tx.order.findFirst({
            where: {
                id: orderId,
                outletId: ctx.outletId
            },
            include: {
                items: {
                    select: {
                        priceCents: true,
                        quantity: true,
                        modifiers: {
                            select: {
                                priceCents: true
                            }
                        }
                    }
                }
            }
        });
        if (!order) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("NOT_FOUND", "Order not found.");
        if (order.status !== "open") throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("ORDER_NOT_OPEN", "Already settled or cancelled.");
        if (order.items.length === 0) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("ORDER_NOT_OPEN", "Nothing on this order yet — add items or cancel it.");
        }
        const { count } = await tx.order.updateMany({
            where: {
                id: orderId,
                status: "open"
            },
            data: {
                status: "settled",
                paymentMethod: method,
                totalCents: orderTotalCents(order.items),
                settledById: ctx.userId,
                settledAt: new Date()
            }
        });
        if (count === 0) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("ORDER_NOT_OPEN", "Already settled or cancelled.");
        return tx.order.findUniqueOrThrow({
            where: {
                id: orderId
            }
        });
    });
}
async function cancelOrder(ctx, orderId) {
    const order = await ctx.db.order.findFirst({
        where: {
            id: orderId,
            outletId: ctx.outletId
        },
        select: {
            id: true
        }
    });
    if (!order) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("NOT_FOUND", "Order not found.");
    const { count } = await ctx.db.order.updateMany({
        where: {
            id: orderId,
            status: "open"
        },
        data: {
            status: "cancelled",
            settledById: ctx.userId,
            settledAt: new Date()
        }
    });
    if (count === 0) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("ORDER_NOT_OPEN", "Already settled or cancelled.");
}
}),
"[project]/apps/outlet/src/lib/tables.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createTable",
    ()=>createTable,
    "deleteTable",
    ()=>deleteTable,
    "listBookableTables",
    ()=>listBookableTables,
    "listTables",
    ()=>listTables,
    "updateTable",
    ()=>updateTable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/domain/src/errors.ts [app-rsc] (ecmascript)");
;
async function listTables(ctx) {
    return ctx.db.diningTable.findMany({
        where: {
            outletId: ctx.outletId
        },
        orderBy: [
            {
                zone: "asc"
            },
            {
                sortOrder: "asc"
            },
            {
                name: "asc"
            }
        ],
        select: {
            id: true,
            name: true,
            capacity: true,
            zone: true,
            shape: true,
            sortOrder: true,
            active: true,
            _count: {
                select: {
                    orders: true,
                    reservations: true
                }
            }
        }
    });
}
async function listBookableTables(ctx) {
    return ctx.db.diningTable.findMany({
        where: {
            outletId: ctx.outletId,
            active: true
        },
        orderBy: [
            {
                zone: "asc"
            },
            {
                sortOrder: "asc"
            },
            {
                name: "asc"
            }
        ],
        select: {
            id: true,
            name: true,
            capacity: true,
            zone: true,
            shape: true
        }
    });
}
/** Table names must be unique per outlet — staff call out "T4", not an id. */ async function assertNameFree(ctx, name, exceptId) {
    const clash = await ctx.db.diningTable.findFirst({
        where: {
            outletId: ctx.outletId,
            name,
            ...exceptId ? {
                id: {
                    not: exceptId
                }
            } : {}
        },
        select: {
            id: true
        }
    });
    if (clash) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("VALIDATION", `This outlet already has a table called ${name}.`);
}
async function createTable(ctx, input) {
    await assertNameFree(ctx, input.name);
    return ctx.db.diningTable.create({
        data: {
            outletId: ctx.outletId,
            name: input.name,
            capacity: input.capacity,
            zone: input.zone?.trim() ?? "",
            shape: input.shape ?? "rect",
            sortOrder: input.sortOrder ?? 0
        },
        select: {
            id: true,
            name: true,
            capacity: true,
            zone: true,
            shape: true,
            sortOrder: true,
            active: true
        }
    });
}
async function updateTable(ctx, tableId, input) {
    const table = await ctx.db.diningTable.findFirst({
        where: {
            id: tableId,
            outletId: ctx.outletId
        },
        select: {
            id: true
        }
    });
    if (!table) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("NOT_FOUND", "Table not found.");
    if (input.name !== undefined) await assertNameFree(ctx, input.name, tableId);
    // Retiring a table mid-service would strand its bill: the board drops it, but
    // the open order stays reachable only through history. Block it instead.
    if (input.active === false) {
        const open = await ctx.db.order.findFirst({
            where: {
                tableId,
                status: "open"
            },
            select: {
                id: true
            }
        });
        if (open) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("TABLE_OCCUPIED", "Settle or cancel this table's order first.");
    }
    await ctx.db.diningTable.update({
        where: {
            id: tableId
        },
        data: {
            ...input.name !== undefined ? {
                name: input.name
            } : {},
            ...input.capacity !== undefined ? {
                capacity: input.capacity
            } : {},
            ...input.zone !== undefined ? {
                zone: input.zone.trim()
            } : {},
            ...input.shape !== undefined ? {
                shape: input.shape
            } : {},
            ...input.sortOrder !== undefined ? {
                sortOrder: input.sortOrder
            } : {},
            ...input.active !== undefined ? {
                active: input.active
            } : {}
        }
    });
}
async function deleteTable(ctx, tableId) {
    const table = await ctx.db.diningTable.findFirst({
        where: {
            id: tableId,
            outletId: ctx.outletId
        },
        select: {
            _count: {
                select: {
                    orders: true,
                    reservations: true
                }
            }
        }
    });
    if (!table) throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("NOT_FOUND", "Table not found.");
    if (table._count.orders > 0 || table._count.reservations > 0) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$errors$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PosError"]("VALIDATION", "This table has history — retire it instead, so its past bills stay readable.");
    }
    await ctx.db.diningTable.delete({
        where: {
            id: tableId
        }
    });
}
}),
"[project]/packages/domain/src/format.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** "NPR 450" / "$12.50" — whole amounts drop the decimals. */ __turbopack_context__.s([
    "formatDateTime",
    ()=>formatDateTime,
    "formatDuration",
    ()=>formatDuration,
    "formatPrice",
    ()=>formatPrice
]);
function formatPrice(cents, currency) {
    return new Intl.NumberFormat("en", {
        style: "currency",
        currency,
        maximumFractionDigits: cents % 100 === 0 ? 0 : 2
    }).format(cents / 100);
}
function formatDateTime(instant, timeZone) {
    return new Intl.DateTimeFormat("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone
    }).format(instant);
}
function formatDuration(minutes) {
    const total = Math.max(0, Math.floor(minutes));
    if (total < 60) return `${total} min`;
    const hours = Math.floor(total / 60);
    const rest = total % 60;
    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const spareHours = hours % 24;
        return spareHours ? `${days}d ${spareHours} hr` : `${days}d`;
    }
    return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}
}),
"[project]/apps/outlet/src/app/pos/table-board.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TableBoard",
    ()=>TableBoard
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const TableBoard = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call TableBoard() from the server but TableBoard is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/apps/outlet/src/app/pos/table-board.tsx <module evaluation>", "TableBoard");
}),
"[project]/apps/outlet/src/app/pos/table-board.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TableBoard",
    ()=>TableBoard
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const TableBoard = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call TableBoard() from the server but TableBoard is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/apps/outlet/src/app/pos/table-board.tsx", "TableBoard");
}),
"[project]/apps/outlet/src/app/pos/table-board.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$app$2f$pos$2f$table$2d$board$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/apps/outlet/src/app/pos/table-board.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$app$2f$pos$2f$table$2d$board$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/apps/outlet/src/app/pos/table-board.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$app$2f$pos$2f$table$2d$board$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/apps/outlet/src/app/pos/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>TableBoardPage,
    "metadata",
    ()=>metadata
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$lib$2f$outlet$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/outlet/src/lib/outlet.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$lib$2f$orders$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/outlet/src/lib/orders.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$lib$2f$tables$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/outlet/src/lib/tables.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/outlet/src/lib/session.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$format$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/domain/src/format.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$time$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/domain/src/time.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$constants$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/domain/src/constants.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$app$2f$pos$2f$table$2d$board$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/outlet/src/app/pos/table-board.tsx [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
;
;
const metadata = {
    title: "Tables"
};
/** Wrapped so the clock read isn't an impure call in render scope. */ function minutesSince(d) {
    return Math.max(0, Math.floor((Date.now() - d.getTime()) / 60_000));
}
async function TableBoardPage() {
    const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["requireSession"])();
    const canEdit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$constants$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["roleAtLeast"])(session.role, "manager");
    const [tables, outlet, floor] = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$lib$2f$orders$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getTableBoard"])(session),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$lib$2f$outlet$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getOutletProfile"])(session),
        // Only a manager can edit, so only they need retired tables and the
        // history flags that decide Retire vs Delete.
        canEdit ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$lib$2f$tables$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["listTables"])(session) : Promise.resolve([])
    ]);
    const meta = new Map(floor.map((t)=>[
            t.id,
            t
        ]));
    // Everything time- or currency-dependent is formatted here: the board is a
    // client component and must not do timezone or clock work of its own.
    const tiles = tables.map((t)=>({
            id: t.id,
            name: t.name,
            capacity: t.capacity,
            zone: t.zone,
            shape: t.shape,
            active: true,
            hasHistory: (meta.get(t.id)?._count.orders ?? 0) > 0 || (meta.get(t.id)?._count.reservations ?? 0) > 0,
            order: t.order ? {
                customerName: t.order.customerName,
                price: (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$format$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["formatPrice"])(t.order.totalCents, outlet.currency),
                itemCount: t.order.itemCount,
                minutes: minutesSince(t.order.openedAt),
                holdNote: t.hold ? `${t.hold.periodLabel} booking · ${t.hold.customerName}` : null
            } : null,
            hold: t.hold ? {
                customerName: t.hold.customerName,
                // An all-day hold has no meaningful window to print — "00:00–00:00"
                // is noise, so the label carries it alone.
                line: t.hold.allDay ? `${t.hold.periodLabel} · ${t.hold.partySize}p` : `${t.hold.periodLabel} · ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$time$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["localTimeLabel"])(t.hold.startAt, outlet.timezone)}–${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$time$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["localTimeLabel"])(t.hold.endAt, outlet.timezone)} · ${t.hold.partySize}p`,
                // `active` means the stored window covers this instant.
                live: t.hold.active
            } : null
        }));
    // Retired tables aren't on the board; they only exist so a manager can
    // restore one, so they carry no service state.
    const retiredTiles = floor.filter((t)=>!t.active).map((t)=>({
            id: t.id,
            name: t.name,
            capacity: t.capacity,
            zone: t.zone,
            shape: t.shape,
            active: false,
            hasHistory: t._count.orders > 0 || t._count.reservations > 0,
            order: null,
            hold: null
        }));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$app$2f$pos$2f$table$2d$board$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["TableBoard"], {
        tiles: [
            ...tiles,
            ...retiredTiles
        ],
        canEdit: canEdit,
        zoneSuggestions: [
            ...__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$constants$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ZONE_SUGGESTIONS"]
        ],
        shapes: [
            ...__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$constants$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["TABLE_SHAPES"]
        ]
    }, void 0, false, {
        fileName: "[project]/apps/outlet/src/app/pos/page.tsx",
        lineNumber: 83,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/outlet/src/app/pos/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/apps/outlet/src/app/pos/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__15u9ya6._.js.map