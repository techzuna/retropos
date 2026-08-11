import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // `server.js` is the Passenger entry point for cPanel-style hosting, and
    // `scripts/check-host.js` is the preflight the panel's "Run JS script"
    // button executes. Both run on the host's bare Node without passing through
    // the Next compiler, and Passenger's shim hooks CommonJS, so `require()` is
    // the compatible choice rather than a style lapse. `check-host.js` also has
    // to keep working when the app itself cannot boot, which rules out
    // importing anything from src/. Everything else still applies to them.
    files: ["server.js", "scripts/check-host.js", "scripts/install-native.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
]);

export default eslintConfig;
