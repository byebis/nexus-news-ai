import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NO output: "standalone" - Cloudflare Pages gestisce il build da solo
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
