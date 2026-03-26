import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Shopify CDN
      { protocol: "https", hostname: "cdn.shopify.com" },
      // Unsplash (used by mock data)
      { protocol: "https", hostname: "images.unsplash.com" },
      // Generic wildcard for demo — narrow this down in production
      { protocol: "https", hostname: "**.myshopify.com" },
    ],
  },
};

export default nextConfig;
