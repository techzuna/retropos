/**
 * The rules both products obey.
 *
 * A restaurant's takings should not depend on where the app is running, so the
 * money maths, the role ladder, the time bucketing and the input validation
 * live here and are imported by the self-hosted outlet and the hosted cloud
 * service alike. Fix a rounding bug once; both get it.
 *
 * The constraint that keeps this honest: nothing in this package may touch a
 * filesystem, a database driver, or a request. Those differ between the two
 * and belong in the app.
 */
export * from "./constants";
export * from "./errors";
export * from "./format";
export * from "./time";
export * from "./validation";
export * from "./rate-limit";
