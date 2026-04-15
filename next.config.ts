import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["recharts", "@anthropic-ai/sdk"],
  },
  compress: true,
};

export default nextConfig;
