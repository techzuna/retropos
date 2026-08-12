module.exports = [
"[project]/packages/domain/src/format.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/apps/outlet/src/components/AutoRefresh.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AutoRefresh",
    ()=>AutoRefresh
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
"use client";
;
;
function AutoRefresh({ seconds }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let timer;
        const start = ()=>{
            timer ??= setInterval(()=>router.refresh(), seconds * 1000);
        };
        const stop = ()=>{
            if (timer) clearInterval(timer);
            timer = undefined;
        };
        const onVisibility = ()=>{
            if (document.visibilityState === "visible") {
                router.refresh();
                start();
            } else {
                stop();
            }
        };
        onVisibility();
        document.addEventListener("visibilitychange", onVisibility);
        return ()=>{
            document.removeEventListener("visibilitychange", onVisibility);
            stop();
        };
    }, [
        router,
        seconds
    ]);
    return null;
}
}),
"[project]/apps/outlet/src/components/TableDiagram.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * A little plan view of a table: the top, with one seat pill per cover.
 *
 * Staff recognise their own room faster from a shape than from the words "6
 * persons" — a round six-top and a long six-top are different tables to carry
 * plates to. Shape and capacity both come from the floor plan, so the drawing
 * stays honest without anyone maintaining a second picture.
 */ __turbopack_context__.s([
    "TableDiagram",
    ()=>TableDiagram
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
;
function TableDiagram({ shape, capacity, className = "" }) {
    const seats = Math.max(1, Math.min(capacity, 12)); // beyond a dozen the drawing stops helping
    const pills = [];
    const SEAT_LONG = 13;
    const SEAT_SHORT = 5;
    const R = 2.5;
    if (shape === "round") {
        // Evenly around the rim, each pill turned to face the centre.
        for(let i = 0; i < seats; i++){
            const angle = 2 * Math.PI * i / seats - Math.PI / 2;
            pills.push({
                x: 40 + Math.cos(angle) * 27 - SEAT_SHORT / 2,
                y: 40 + Math.sin(angle) * 27 - SEAT_LONG / 2,
                w: SEAT_SHORT,
                h: SEAT_LONG,
                r: angle * 180 / Math.PI + 90
            });
        }
    } else if (shape === "square") {
        // Round all four sides: top, right, bottom, left, repeating.
        const sides = [
            [
                40,
                12,
                0
            ],
            [
                68,
                40,
                90
            ],
            [
                40,
                68,
                0
            ],
            [
                12,
                40,
                90
            ]
        ];
        for(let i = 0; i < seats; i++){
            const [cx, cy, rot] = sides[i % 4];
            // Second lap sits alongside the first rather than on top of it.
            const lap = Math.floor(i / 4);
            const shift = lap === 0 ? 0 : lap % 2 === 1 ? -9 : 9;
            const along = rot === 0 ? {
                x: shift,
                y: 0
            } : {
                x: 0,
                y: shift
            };
            pills.push({
                x: cx + along.x - (rot === 0 ? SEAT_LONG : SEAT_SHORT) / 2,
                y: cy + along.y - (rot === 0 ? SEAT_SHORT : SEAT_LONG) / 2,
                w: rot === 0 ? SEAT_LONG : SEAT_SHORT,
                h: rot === 0 ? SEAT_SHORT : SEAT_LONG,
                r: 0
            });
        }
    } else {
        // Rectangular: down the two long sides, as a real banquette table seats.
        const left = Math.ceil(seats / 2);
        const right = seats - left;
        const place = (n, x)=>{
            for(let i = 0; i < n; i++){
                const step = 56 / (n + 1);
                pills.push({
                    x,
                    y: 12 + step * (i + 1) - SEAT_LONG / 2,
                    w: SEAT_SHORT,
                    h: SEAT_LONG,
                    r: 0
                });
            }
        };
        place(left, 14);
        place(right, 61);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        viewBox: "0 0 80 80",
        className: className,
        role: "img",
        "aria-label": `${shape} table, ${capacity} seats`,
        fill: "none",
        children: [
            shape === "round" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "40",
                cy: "40",
                r: "19",
                stroke: "currentColor",
                strokeWidth: "2"
            }, void 0, false, {
                fileName: "[project]/apps/outlet/src/components/TableDiagram.tsx",
                lineNumber: 87,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: shape === "square" ? 22 : 22,
                y: shape === "square" ? 22 : 16,
                width: shape === "square" ? 36 : 36,
                height: shape === "square" ? 36 : 48,
                rx: "3",
                stroke: "currentColor",
                strokeWidth: "2"
            }, void 0, false, {
                fileName: "[project]/apps/outlet/src/components/TableDiagram.tsx",
                lineNumber: 89,
                columnNumber: 9
            }, this),
            pills.map((p, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: p.x,
                    y: p.y,
                    width: p.w,
                    height: p.h,
                    rx: R,
                    stroke: "currentColor",
                    strokeWidth: "2",
                    transform: p.r ? `rotate(${p.r} ${p.x + p.w / 2} ${p.y + p.h / 2})` : undefined
                }, i, false, {
                    fileName: "[project]/apps/outlet/src/components/TableDiagram.tsx",
                    lineNumber: 100,
                    columnNumber: 9
                }, this))
        ]
    }, void 0, true, {
        fileName: "[project]/apps/outlet/src/components/TableDiagram.tsx",
        lineNumber: 79,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/outlet/src/components/Dialog.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useDialog",
    ()=>useDialog
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
function useDialog() {
    const [pending, setPending] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [values, setValues] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const ask = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((spec)=>new Promise((resolve)=>{
            setValues(Object.fromEntries(spec.fields.map((f)=>[
                    f.name,
                    f.value ?? ""
                ])));
            setPending({
                kind: "ask",
                spec,
                resolve
            });
        }), []);
    const confirm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((spec)=>new Promise((resolve)=>{
            setPending({
                kind: "confirm",
                spec,
                resolve
            });
        }), []);
    function cancel() {
        if (!pending) return;
        // Resolve with the "nothing happened" value for whichever kind is open, so
        // an awaiting caller never hangs on a dismissed dialog.
        if (pending.kind === "ask") pending.resolve(null);
        else pending.resolve(false);
        setPending(null);
    }
    function submit() {
        if (!pending) return;
        if (pending.kind === "ask") pending.resolve({
            ...values
        });
        else pending.resolve(true);
        setPending(null);
    }
    const dialog = pending ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center",
        onClick: (e)=>{
            if (e.target === e.currentTarget) cancel();
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            role: "dialog",
            "aria-modal": "true",
            "aria-label": pending.spec.title,
            className: "w-full max-w-xs border border-line bg-white",
            onKeyDown: (e)=>{
                if (e.key === "Escape") cancel();
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "dhaka-band dhaka-band-brass",
                    "aria-hidden": "true"
                }, void 0, false, {
                    fileName: "[project]/apps/outlet/src/components/Dialog.tsx",
                    lineNumber: 111,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                    className: "p-4",
                    onSubmit: (e)=>{
                        e.preventDefault();
                        submit();
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "font-display text-lg leading-tight",
                            children: pending.spec.title
                        }, void 0, false, {
                            fileName: "[project]/apps/outlet/src/components/Dialog.tsx",
                            lineNumber: 119,
                            columnNumber: 11
                        }, this),
                        pending.spec.message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-1 text-sm text-ink-soft",
                            children: pending.spec.message
                        }, void 0, false, {
                            fileName: "[project]/apps/outlet/src/components/Dialog.tsx",
                            lineNumber: 121,
                            columnNumber: 13
                        }, this),
                        pending.kind === "ask" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-3 space-y-3",
                            children: pending.spec.fields.map((f, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "block",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "block text-sm font-medium",
                                            children: f.label
                                        }, void 0, false, {
                                            fileName: "[project]/apps/outlet/src/components/Dialog.tsx",
                                            lineNumber: 128,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            // A modal opened by a deliberate tap should take the caret
                                            // at once — it is what the native prompt did.
                                            autoFocus: i === 0,
                                            type: f.type ?? "text",
                                            inputMode: f.type === "number" ? "numeric" : undefined,
                                            placeholder: f.placeholder,
                                            min: f.min,
                                            max: f.max,
                                            maxLength: f.maxLength,
                                            list: f.options ? `${f.name}-options` : undefined,
                                            value: values[f.name] ?? "",
                                            onChange: (e)=>setValues((v)=>({
                                                        ...v,
                                                        [f.name]: e.target.value
                                                    })),
                                            className: "mt-1 w-full border border-line bg-white px-3 py-2.5"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/outlet/src/components/Dialog.tsx",
                                            lineNumber: 129,
                                            columnNumber: 19
                                        }, this),
                                        f.options && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("datalist", {
                                            id: `${f.name}-options`,
                                            children: f.options.map((o)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: o
                                                }, o, false, {
                                                    fileName: "[project]/apps/outlet/src/components/Dialog.tsx",
                                                    lineNumber: 147,
                                                    columnNumber: 25
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/apps/outlet/src/components/Dialog.tsx",
                                            lineNumber: 145,
                                            columnNumber: 21
                                        }, this),
                                        f.hint && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "mt-1 block text-xs text-ink-soft",
                                            children: f.hint
                                        }, void 0, false, {
                                            fileName: "[project]/apps/outlet/src/components/Dialog.tsx",
                                            lineNumber: 151,
                                            columnNumber: 30
                                        }, this)
                                    ]
                                }, f.name, true, {
                                    fileName: "[project]/apps/outlet/src/components/Dialog.tsx",
                                    lineNumber: 127,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/apps/outlet/src/components/Dialog.tsx",
                            lineNumber: 125,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-4 flex gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: cancel,
                                    className: "btn flex-1 text-sm",
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/apps/outlet/src/components/Dialog.tsx",
                                    lineNumber: 158,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "submit",
                                    className: `btn flex-1 text-sm ${pending.kind === "confirm" && pending.spec.danger ? "btn-primary" : "btn-secondary"}`,
                                    children: pending.kind === "ask" ? pending.spec.submitLabel ?? "Save" : pending.spec.confirmLabel ?? "Confirm"
                                }, void 0, false, {
                                    fileName: "[project]/apps/outlet/src/components/Dialog.tsx",
                                    lineNumber: 161,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/outlet/src/components/Dialog.tsx",
                            lineNumber: 157,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/outlet/src/components/Dialog.tsx",
                    lineNumber: 112,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/outlet/src/components/Dialog.tsx",
            lineNumber: 102,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/outlet/src/components/Dialog.tsx",
        lineNumber: 96,
        columnNumber: 5
    }, this) : null;
    return {
        ask,
        confirm,
        dialog
    };
}
}),
"[project]/apps/outlet/src/lib/fetch-error.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Turn a failed `fetch` into a sentence a waiter can act on.
 *
 * The distinction that matters on a restaurant LAN: a rejected `fetch` (our
 * callers catch to `null`) means the device never reached the server — wrong
 * Wi-Fi, server restarting, cable out — and the fix is in the room. A response
 * that arrived and said no is a different problem and usually carries its own
 * message from `respond.ts`. Collapsing both into "that didn't go through" told
 * staff nothing they could do.
 */ __turbopack_context__.s([
    "NETWORK_MESSAGE",
    ()=>NETWORK_MESSAGE,
    "SERVER_MESSAGE",
    ()=>SERVER_MESSAGE,
    "failureMessage",
    ()=>failureMessage,
    "messageFor",
    ()=>messageFor
]);
const NETWORK_MESSAGE = "Can't reach the till — check this device is on the restaurant's network, then try again.";
const SERVER_MESSAGE = "The server hit an error. Try again in a moment.";
const GENERIC = "That didn't go through — try again.";
async function failureMessage(res) {
    if (!res) return NETWORK_MESSAGE;
    const data = await res.json().catch(()=>null);
    if (data?.error) return data.error;
    return res.status >= 500 ? SERVER_MESSAGE : GENERIC;
}
function messageFor(res, parsed) {
    if (!res) return NETWORK_MESSAGE;
    if (parsed?.error) return parsed.error;
    return res.status >= 500 ? SERVER_MESSAGE : GENERIC;
}
}),
"[project]/apps/outlet/src/app/pos/table-board.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TableBoard",
    ()=>TableBoard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/domain/src/format.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$components$2f$PendingLink$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/outlet/src/components/PendingLink.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$components$2f$AutoRefresh$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/outlet/src/components/AutoRefresh.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$components$2f$TableDiagram$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/outlet/src/components/TableDiagram.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$components$2f$Dialog$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/outlet/src/components/Dialog.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$lib$2f$fetch$2d$error$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/outlet/src/lib/fetch-error.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
;
;
const UNZONED = "Unzoned";
const SHAPE_LABEL = {
    rect: "Long",
    square: "Square",
    round: "Round"
};
function TableBoard({ tiles, canEdit, zoneSuggestions, shapes }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const { ask, confirm, dialog } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$components$2f$Dialog$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDialog"])();
    const [editing, setEditing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [draft, setDraft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        name: "",
        capacity: "2",
        zone: "",
        shape: "rect"
    });
    const live = tiles.filter((t)=>t.active);
    const retired = tiles.filter((t)=>!t.active);
    // A live hold counts as taken: the point of the change is that the board's
    // "free" number never includes a table a booked party is due at right now.
    const taken = live.filter((t)=>t.order || t.hold?.live).length;
    const upcoming = live.filter((t)=>!t.order && t.hold && !t.hold.live).length;
    // Zones already in use come first: after the first few tables a manager is
    // almost always reusing a zone, not inventing one.
    const zoneOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>[
            ...new Set([
                ...tiles.map((t)=>t.zone).filter(Boolean),
                ...zoneSuggestions
            ])
        ], [
        tiles,
        zoneSuggestions
    ]);
    const groups = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const byZone = new Map();
        for (const t of tiles.filter((x)=>x.active)){
            const key = t.zone || UNZONED;
            byZone.set(key, [
                ...byZone.get(key) ?? [],
                t
            ]);
        }
        return [
            ...byZone.entries()
        ].sort(([a], [b])=>a === UNZONED ? 1 : b === UNZONED ? -1 : a.localeCompare(b));
    }, [
        tiles
    ]);
    async function call(url, method, body) {
        if (busy) return false;
        setBusy(true);
        setError(null);
        const res = await fetch(url, {
            method,
            headers: body !== undefined ? {
                "Content-Type": "application/json"
            } : undefined,
            body: body !== undefined ? JSON.stringify(body) : undefined
        }).catch(()=>null);
        const ok = Boolean(res?.ok);
        if (!ok) setError(await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$lib$2f$fetch$2d$error$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["failureMessage"])(res));
        setBusy(false);
        router.refresh();
        return ok;
    }
    async function addTable(e) {
        e.preventDefault();
        const capacity = Number(draft.capacity);
        if (!draft.name.trim() || !Number.isInteger(capacity) || capacity < 1) {
            setError("Give the table a name and a seat count of at least 1.");
            return;
        }
        const ok = await call("/api/tables", "POST", {
            name: draft.name.trim(),
            capacity,
            zone: draft.zone.trim() || undefined,
            shape: draft.shape
        });
        // Keep zone, seats and shape: adding "C1, C2, C3" to one zone is the common run.
        if (ok) setDraft((d)=>({
                ...d,
                name: ""
            }));
    }
    /** One dialog for the whole table: fewer taps than four separate prompts. */ async function editTable(t) {
        const v = await ask({
            title: `Edit ${t.name}`,
            fields: [
                {
                    name: "name",
                    label: "Name",
                    value: t.name,
                    maxLength: 100
                },
                {
                    name: "capacity",
                    label: "Seats",
                    value: String(t.capacity),
                    type: "number",
                    min: 1,
                    max: 50
                },
                {
                    name: "zone",
                    label: "Zone",
                    value: t.zone,
                    maxLength: 60,
                    placeholder: "Courtyard",
                    options: zoneOptions,
                    hint: "Leave blank for unzoned."
                }
            ],
            submitLabel: "Save table"
        });
        if (!v) return;
        const name = v.name.trim();
        const capacity = Number(v.capacity);
        if (!name) {
            setError("A table needs a name.");
            return;
        }
        if (!Number.isInteger(capacity) || capacity < 1) {
            setError("Seats must be a whole number, 1 or more.");
            return;
        }
        void call(`/api/tables/${t.id}`, "PATCH", {
            name,
            capacity,
            zone: v.zone.trim()
        });
    }
    function cycleShape(t) {
        // Three options — cycling is one tap where a prompt would be three.
        const next = shapes[(shapes.indexOf(t.shape) + 1) % shapes.length];
        void call(`/api/tables/${t.id}`, "PATCH", {
            shape: next
        });
    }
    async function remove(t) {
        if (t.hasHistory) {
            const ok = await confirm({
                title: `Retire ${t.name}?`,
                message: "It leaves the board but keeps its past bills and bookings.",
                confirmLabel: "Retire"
            });
            if (ok) void call(`/api/tables/${t.id}`, "PATCH", {
                active: false
            });
            return;
        }
        const ok = await confirm({
            title: `Delete ${t.name}?`,
            message: "It has no history, so this removes it for good.",
            confirmLabel: "Delete",
            danger: true
        });
        if (ok) void call(`/api/tables/${t.id}`, "DELETE");
    }
    /**
   * A hold whose window covers *now* reads as taken, in the same treatment as an
   * open order (owner's call): nobody should walk a party onto a held table
   * because the tile looked free. A hold that is merely upcoming stays brass.
   */ function tileClass(t) {
        if (editing) return "border-line bg-white";
        if (t.order || t.hold?.live) return "border-madder bg-madder/5 hover:bg-madder/10";
        if (t.hold) return "border-brass bg-brass/10 hover:bg-brass/20";
        return "border-line bg-white hover:border-brass";
    }
    function TileBody({ t }) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-start gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$components$2f$TableDiagram$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TableDiagram"], {
                            shape: t.shape,
                            capacity: t.capacity,
                            className: `size-10 shrink-0 ${t.order || t.hold?.live ? "text-madder" : t.hold ? "text-brass" : "text-leaf"}`
                        }, void 0, false, {
                            fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                            lineNumber: 199,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "min-w-0 flex-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "font-display text-lg leading-tight",
                                    children: t.name
                                }, void 0, false, {
                                    fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                    lineNumber: 207,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-ink-soft",
                                    children: `${t.capacity} seats`
                                }, void 0, false, {
                                    fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                    lineNumber: 208,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                            lineNumber: 206,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                    lineNumber: 198,
                    columnNumber: 9
                }, this),
                !editing && (t.order ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-2 space-y-0.5 text-sm",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "truncate font-medium",
                            children: t.order.customerName
                        }, void 0, false, {
                            fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                            lineNumber: 214,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "font-mono text-madder-deep",
                            children: t.order.price
                        }, void 0, false, {
                            fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                            lineNumber: 215,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-ink-soft",
                            children: `${t.order.itemCount} items · ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$domain$2f$src$2f$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDuration"])(t.order.minutes)}`
                        }, void 0, false, {
                            fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                            lineNumber: 216,
                            columnNumber: 15
                        }, this),
                        t.order.holdNote && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-brass-deep",
                            children: t.order.holdNote
                        }, void 0, false, {
                            fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                            lineNumber: 219,
                            columnNumber: 36
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                    lineNumber: 213,
                    columnNumber: 13
                }, this) : t.hold ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-2 space-y-0.5 text-sm",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: `text-xs font-semibold uppercase ${t.hold.live ? "text-madder-deep" : "text-brass-deep"}`,
                            children: t.hold.live ? "Occupied · reserved" : "Reserved"
                        }, void 0, false, {
                            fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                            lineNumber: 223,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "truncate font-medium",
                            children: t.hold.customerName
                        }, void 0, false, {
                            fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                            lineNumber: 226,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-ink-soft",
                            children: t.hold.line
                        }, void 0, false, {
                            fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                            lineNumber: 227,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-ink-soft",
                            children: "Tap to seat them"
                        }, void 0, false, {
                            fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                            lineNumber: 228,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                    lineNumber: 222,
                    columnNumber: 13
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "mt-2 text-sm text-ink-soft",
                    children: "Free — tap to seat"
                }, void 0, false, {
                    fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                    lineNumber: 231,
                    columnNumber: 13
                }, this))
            ]
        }, void 0, true);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            dialog,
            !editing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$components$2f$AutoRefresh$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AutoRefresh"], {
                seconds: 15
            }, void 0, false, {
                fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                lineNumber: 241,
                columnNumber: 20
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "font-display text-2xl",
                        children: "Tables"
                    }, void 0, false, {
                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                        lineNumber: 244,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-ink-soft",
                        children: `${taken} of ${live.length} taken${upcoming > 0 ? ` · ${upcoming} booked later` : ""}`
                    }, void 0, false, {
                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                        lineNumber: 245,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                lineNumber: 243,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-1 flex flex-wrap items-center gap-x-4 gap-y-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/pos/reservations",
                        className: "text-sm text-ink-soft underline underline-offset-4",
                        children: "Bookings →"
                    }, void 0, false, {
                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                        lineNumber: 250,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "flex-1"
                    }, void 0, false, {
                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                        lineNumber: 253,
                        columnNumber: 9
                    }, this),
                    canEdit && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setEditing((v)=>!v),
                        "aria-pressed": editing,
                        className: `btn text-sm ${editing ? "btn-primary" : ""}`,
                        children: editing ? "Done editing" : "Edit floor"
                    }, void 0, false, {
                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                        lineNumber: 255,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                lineNumber: 249,
                columnNumber: 7
            }, this),
            editing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                onSubmit: addTable,
                className: "mt-4 border border-line bg-white p-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-medium",
                        children: "Add a table"
                    }, void 0, false, {
                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                        lineNumber: 268,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-3 flex flex-wrap items-end gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "block text-sm font-medium",
                                        children: "Name"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                        lineNumber: 271,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        maxLength: 100,
                                        placeholder: "T7",
                                        value: draft.name,
                                        onChange: (e)=>setDraft({
                                                ...draft,
                                                name: e.target.value
                                            }),
                                        className: "mt-1 w-28 border border-line bg-white px-3 py-2.5"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                        lineNumber: 272,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                lineNumber: 270,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "block text-sm font-medium",
                                        children: "Seats"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                        lineNumber: 282,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        min: 1,
                                        max: 50,
                                        inputMode: "numeric",
                                        value: draft.capacity,
                                        onChange: (e)=>setDraft({
                                                ...draft,
                                                capacity: e.target.value
                                            }),
                                        className: "mt-1 w-20 border border-line bg-white px-3 py-2.5"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                        lineNumber: 283,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                lineNumber: 281,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "block text-sm font-medium",
                                        children: [
                                            "Zone ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-normal text-ink-soft",
                                                children: "— optional"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                                lineNumber: 295,
                                                columnNumber: 22
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                        lineNumber: 294,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        list: "zone-options",
                                        maxLength: 60,
                                        placeholder: "Courtyard",
                                        value: draft.zone,
                                        onChange: (e)=>setDraft({
                                                ...draft,
                                                zone: e.target.value
                                            }),
                                        className: "mt-1 w-40 border border-line bg-white px-3 py-2.5"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                        lineNumber: 297,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                lineNumber: 293,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("datalist", {
                                id: "zone-options",
                                children: zoneOptions.map((z)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: z
                                    }, z, false, {
                                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                        lineNumber: 309,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                lineNumber: 307,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "block text-sm font-medium",
                                        children: "Shape"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                        lineNumber: 313,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: draft.shape,
                                        onChange: (e)=>setDraft({
                                                ...draft,
                                                shape: e.target.value
                                            }),
                                        className: "mt-1 border border-line bg-white px-3 py-2.5",
                                        children: shapes.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: s,
                                                children: SHAPE_LABEL[s] ?? s
                                            }, s, false, {
                                                fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                                lineNumber: 320,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                        lineNumber: 314,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                lineNumber: 312,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "submit",
                                disabled: busy,
                                className: "btn btn-primary disabled:opacity-40",
                                children: "Add"
                            }, void 0, false, {
                                fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                lineNumber: 326,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                        lineNumber: 269,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                lineNumber: 267,
                columnNumber: 9
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                role: "alert",
                className: "mt-4 border border-madder/40 bg-madder/5 px-3 py-2 text-sm text-madder-deep",
                children: error
            }, void 0, false, {
                fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                lineNumber: 334,
                columnNumber: 9
            }, this),
            groups.map(([zone, rows])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                    className: "mt-5",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "eyebrow",
                            children: `${zone} · ${rows.length} ${rows.length === 1 ? "table" : "tables"}`
                        }, void 0, false, {
                            fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                            lineNumber: 344,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4",
                            children: rows.map((t)=>editing ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `border p-3 ${tileClass(t)}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TileBody, {
                                            t: t
                                        }, void 0, false, {
                                            fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                            lineNumber: 351,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-3 flex flex-wrap gap-1.5 border-t border-line pt-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: ()=>void editTable(t),
                                                    disabled: busy,
                                                    className: "btn px-2 py-1 text-xs",
                                                    children: "Edit"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                                    lineNumber: 353,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: ()=>cycleShape(t),
                                                    disabled: busy,
                                                    className: "btn px-2 py-1 text-xs",
                                                    children: SHAPE_LABEL[t.shape] ?? t.shape
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                                    lineNumber: 361,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: ()=>void remove(t),
                                                    disabled: busy,
                                                    className: "btn px-2 py-1 text-xs text-madder-deep",
                                                    children: t.hasHistory ? "Retire" : "Delete"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                                    lineNumber: 364,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                            lineNumber: 352,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, t.id, true, {
                                    fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                    lineNumber: 350,
                                    columnNumber: 17
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$components$2f$PendingLink$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PendingCardLink"], {
                                    href: `/pos/tables/${t.id}`,
                                    className: `block border p-3 transition-colors ${tileClass(t)}`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TileBody, {
                                        t: t
                                    }, void 0, false, {
                                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                        lineNumber: 380,
                                        columnNumber: 19
                                    }, this)
                                }, t.id, false, {
                                    fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                    lineNumber: 375,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                            lineNumber: 347,
                            columnNumber: 11
                        }, this)
                    ]
                }, zone, true, {
                    fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                    lineNumber: 343,
                    columnNumber: 9
                }, this)),
            editing && retired.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "mt-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "eyebrow",
                        children: `Retired · ${retired.length}`
                    }, void 0, false, {
                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                        lineNumber: 390,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "mt-2 divide-y divide-line border border-line bg-white",
                        children: retired.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                className: "flex items-center gap-3 px-3 py-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$components$2f$TableDiagram$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TableDiagram"], {
                                        shape: t.shape,
                                        capacity: t.capacity,
                                        className: "size-8 text-ink-soft"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                        lineNumber: 394,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-display text-lg text-ink-soft line-through",
                                        children: t.name
                                    }, void 0, false, {
                                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                        lineNumber: 395,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-sm text-ink-soft",
                                        children: `${t.capacity} seats`
                                    }, void 0, false, {
                                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                        lineNumber: 396,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "flex-1"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                        lineNumber: 397,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>void call(`/api/tables/${t.id}`, "PATCH", {
                                                active: true
                                            }),
                                        disabled: busy,
                                        className: "btn text-sm",
                                        children: "Restore"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                        lineNumber: 398,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, t.id, true, {
                                fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                                lineNumber: 393,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                        lineNumber: 391,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                lineNumber: 389,
                columnNumber: 9
            }, this),
            live.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-8 text-ink-soft",
                children: canEdit ? "No tables yet — tap “Edit floor” to add the first one." : "No tables set up yet — a manager can add them from this screen."
            }, void 0, false, {
                fileName: "[project]/apps/outlet/src/app/pos/table-board.tsx",
                lineNumber: 413,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true);
}
}),
];

//# sourceMappingURL=_1r8-bg4._.js.map