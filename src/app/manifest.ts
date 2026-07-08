import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "bestie, don't.",
    short_name: "bestie, don't.",
    description: "The friend who takes your phone. No contact, but make it survivable.",
    start_url: "/home",
    display: "standalone",
    background_color: "#1C1917",
    theme_color: "#1C1917",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
