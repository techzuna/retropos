import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source rather than a build step.
  transpilePackages: ["@restro/domain"],
  /*
   * No serverExternalPackages here, unlike the outlet. That list exists to keep
   * Turbopack from aliasing better-sqlite3 behind a symlink that FTP cannot
   * carry — a problem that only exists because the self-hosted build ships a
   * compiled driver to a machine it has never met. The cloud talks to Postgres
   * through pg, which is pure JavaScript: nothing to compile, nothing to match
   * against a host's glibc, and it deploys anywhere that runs Node.
   */
};

export default nextConfig;
