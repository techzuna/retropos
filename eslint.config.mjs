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
    // `server.js` is the Passenger entry point for cPanel-style hosting. It runs
    // on the host's bare Node without passing through the Next compiler, and
    // Passenger's shim hooks CommonJS, so `require()` is the compatible choice
    // rather than a style lapse. Everything else still applies to the file.
    files: ["server.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
]);

export default eslintConfig;
