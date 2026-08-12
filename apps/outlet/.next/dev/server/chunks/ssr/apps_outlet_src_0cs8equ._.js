module.exports = [
"[project]/apps/outlet/src/components/PinInput.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PinInput",
    ()=>PinInput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
function PinInput({ value, onChange, length = 4, autoFocus, busy, label, describedById, invalid }) {
    const refs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])([]);
    const active = Math.min(value.length, length - 1);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (autoFocus) refs.current[active]?.focus();
    // Re-focus follows the prefix as it grows/shrinks.
    }, [
        autoFocus,
        active
    ]);
    function handleKeyDown(e) {
        if (busy) return;
        if (e.key === "Backspace") {
            e.preventDefault();
            onChange(value.slice(0, -1));
        }
    }
    function handleChange(e) {
        if (busy) return;
        const digit = e.target.value.replace(/\D/g, "").slice(-1);
        if (digit) onChange((value + digit).slice(0, length));
    }
    function handlePaste(e) {
        e.preventDefault();
        if (busy) return;
        const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
        if (digits) onChange(digits);
    }
    return(// Not `disabled` while busy: disabling the focused box makes the browser
    // blur it and drop the on-screen keypad, and the post-error refocus isn't
    // a user gesture, so mobile never brings the keypad back. aria-busy plus
    // per-handler guards keep the caret and the keypad where they are.
    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
        "aria-busy": busy,
        className: busy ? "opacity-60" : undefined,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("legend", {
                className: "block text-sm font-medium",
                children: label
            }, void 0, false, {
                fileName: "[project]/apps/outlet/src/components/PinInput.tsx",
                lineNumber: 68,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-2 flex gap-3",
                onPaste: handlePaste,
                children: Array.from({
                    length
                }, (_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        ref: (el)=>{
                            refs.current[i] = el;
                        },
                        type: "password",
                        inputMode: "numeric",
                        // Not "one-time-code": that offers iOS SMS autofill, wrong for a
                        // PIN typed dozens of times a shift.
                        autoComplete: "off",
                        "aria-label": `${label} digit ${i + 1}`,
                        "aria-describedby": describedById,
                        "aria-invalid": invalid || undefined,
                        // Roving tabindex: without it the onFocus redirect below bounces
                        // every Tab back to the active box and traps keyboard users.
                        tabIndex: i === active ? 0 : -1,
                        value: value[i] ?? "",
                        onChange: handleChange,
                        onKeyDown: handleKeyDown,
                        onFocus: ()=>{
                            // Typing goes into the first empty box, wherever the tap landed.
                            // (tabindex=-1 boxes are still click-focusable, so this stays.)
                            if (i !== active) refs.current[active]?.focus();
                        },
                        className: "h-14 w-12 border border-line bg-white text-center font-mono text-2xl focus:border-madder"
                    }, i, false, {
                        fileName: "[project]/apps/outlet/src/components/PinInput.tsx",
                        lineNumber: 71,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/apps/outlet/src/components/PinInput.tsx",
                lineNumber: 69,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/outlet/src/components/PinInput.tsx",
        lineNumber: 67,
        columnNumber: 5
    }, this));
}
}),
"[project]/apps/outlet/src/app/signin/pin-sign-in.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PinSignIn",
    ()=>PinSignIn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$components$2f$PinInput$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/outlet/src/components/PinInput.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const PIN_LENGTH = 4;
const HINT_ID = "pin-hint";
const ERROR_ID = "pin-error";
function PinSignIn({ users, currentUserId }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [selected, setSelected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [pin, setPin] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    async function submit(userId, pinValue) {
        setBusy(true);
        setError(null);
        const res = await fetch("/api/auth/pin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId,
                pin: pinValue
            })
        }).catch(()=>null);
        if (res?.ok) {
            router.push("/pos");
            router.refresh();
            return;
        }
        const data = res ? await res.json().catch(()=>null) : null;
        setBusy(false);
        setPin("");
        setError(data?.error ?? "That didn't work — try again.");
    }
    // The last digit signs in — no extra tap mid-service.
    function handlePinChange(next) {
        setPin(next);
        if (selected && next.length === PIN_LENGTH && !busy) {
            void submit(selected.id, next);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mt-5 space-y-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-2 gap-2",
                children: users.map((user)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        "aria-pressed": selected?.id === user.id,
                        disabled: busy,
                        onClick: ()=>{
                            setSelected(user);
                            setPin("");
                            setError(null);
                        },
                        className: `border p-3 text-left ${selected?.id === user.id ? "border-madder bg-madder text-paper" : "border-line bg-white"}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "font-medium",
                                children: [
                                    user.name,
                                    user.id === currentUserId && " ·"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/outlet/src/app/signin/pin-sign-in.tsx",
                                lineNumber: 75,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: `text-xs ${selected?.id === user.id ? "text-paper/80" : "text-ink-soft"}`,
                                children: user.role
                            }, void 0, false, {
                                fileName: "[project]/apps/outlet/src/app/signin/pin-sign-in.tsx",
                                lineNumber: 79,
                                columnNumber: 13
                            }, this)
                        ]
                    }, user.id, true, {
                        fileName: "[project]/apps/outlet/src/app/signin/pin-sign-in.tsx",
                        lineNumber: 61,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/apps/outlet/src/app/signin/pin-sign-in.tsx",
                lineNumber: 59,
                columnNumber: 7
            }, this),
            selected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$outlet$2f$src$2f$components$2f$PinInput$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PinInput"], {
                        label: `PIN for ${selected.name}`,
                        value: pin,
                        onChange: handlePinChange,
                        length: PIN_LENGTH,
                        autoFocus: true,
                        busy: busy,
                        invalid: Boolean(error),
                        describedById: error ? `${ERROR_ID} ${HINT_ID}` : HINT_ID
                    }, selected.id, false, {
                        fileName: "[project]/apps/outlet/src/app/signin/pin-sign-in.tsx",
                        lineNumber: 88,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        id: HINT_ID,
                        className: "mt-2 text-xs text-ink-soft",
                        children: `Entering all ${PIN_LENGTH} digits signs ${selected.name} in.`
                    }, void 0, false, {
                        fileName: "[project]/apps/outlet/src/app/signin/pin-sign-in.tsx",
                        lineNumber: 102,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/outlet/src/app/signin/pin-sign-in.tsx",
                lineNumber: 87,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "aria-live": "polite",
                className: "min-h-5",
                children: [
                    busy && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-ink-soft",
                        children: "Signing in…"
                    }, void 0, false, {
                        fileName: "[project]/apps/outlet/src/app/signin/pin-sign-in.tsx",
                        lineNumber: 109,
                        columnNumber: 18
                    }, this),
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        id: ERROR_ID,
                        role: "alert",
                        className: "border border-madder/40 bg-madder/5 px-3 py-2 text-sm text-madder-deep",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/apps/outlet/src/app/signin/pin-sign-in.tsx",
                        lineNumber: 111,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/outlet/src/app/signin/pin-sign-in.tsx",
                lineNumber: 108,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/outlet/src/app/signin/pin-sign-in.tsx",
        lineNumber: 58,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=apps_outlet_src_0cs8equ._.js.map