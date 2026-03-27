import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "stAIyst — AI-assisted styling",
    short_name: "stAIyst",
    description:
      "Upload a photo, get real clothing recommendations, and preview items on yourself.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#171717",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
      {
        src: "/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
