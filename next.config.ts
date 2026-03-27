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
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
