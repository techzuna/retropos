module.exports = [
"[project]/apps/outlet/src/instrumentation.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "register",
    ()=>register
]);
async function register() {
    if ("TURBOPACK compile-time truthy", 1) {
        const { startBackupScheduler } = await __turbopack_context__.A("[project]/apps/outlet/src/lib/backup-scheduler.ts [instrumentation] (ecmascript, async loader)");
        startBackupScheduler();
    }
}
}),
];

//# sourceMappingURL=apps_outlet_src_instrumentation_ts_20fapgp._.js.map