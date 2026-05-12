import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
  },
  typescript: {
    // We handle type checking separately
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
