import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for OpenNext Cloudflare: disable image optimisation
  // (Cloudflare handles this natively)
  images: { unoptimized: true },
};

export default nextConfig;
