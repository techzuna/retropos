import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Workspace packages ship TypeScript source rather than a build step, so
   * Next has to compile them like app code. One fewer build to keep in sync,
   * and a domain change is picked up by `next dev` immediately.
   */
  transpilePackages: ["@restro/domain"],
  /*
   * Resolve the native/database packages with a plain Node `require` at
   * runtime, instead of letting Turbopack alias them to content-hashed names
   * under `.next/node_modules`.
   *
   * Those aliases are *symlinks* into the real `node_modules` — fine on a
   * machine that builds and runs in the same place, fatal for our release
   * flow: FTP cannot carry a symlink, so a deployed build boots with
   * "Cannot find module 'better-sqlite3-<hash>'" and every page 500s.
   * Requiring by name lets the copy of `node_modules` that the host installs
   * satisfy them — which is also the only copy whose compiled
   * `better_sqlite3.node` matches the host's platform. See DEPLOY.md.
   */
  serverExternalPackages: [
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
    "@prisma/client",
  ],
};

export default nextConfig;
