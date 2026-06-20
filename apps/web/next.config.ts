import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compile workspace TS packages directly (no separate build step).
  transpilePackages: ["@rolde/db"],
  // Native / heavy server-only modules for the URDS PDF Kit — keep them out of
  // the bundle so they resolve from node_modules at runtime (sharp rasterises the
  // clinic SVG logo; @react-pdf renders the document server-side).
  serverExternalPackages: ["sharp", "@react-pdf/renderer"],
};

export default nextConfig;
