import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compile workspace TS packages directly (no separate build step).
  transpilePackages: ["@rolde/db"],
};

export default nextConfig;
