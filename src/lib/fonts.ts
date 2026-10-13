import localFont from "next/font/local";

/**
 * Self-hosted, not next/font/google: the panic screen has to render with no
 * signal, so every font ships inside the app bundle the service worker caches.
 */

/** Handwriting for headings and margin notes - the "doodled on paper" voice. */
export const caveat = localFont({
  src: [
    { path: "../fonts/caveat-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/caveat-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-caveat",
  display: "swap",
  // Caveat's x-height is tiny next to Quicksand's. Scaling it up here keeps
  // every existing text-2xl/text-4xl heading reading at its intended size.
  declarations: [{ prop: "size-adjust", value: "125%" }],
});

/** Soft, rounded body copy that stays legible at 16px at 1am. */
export const quicksand = localFont({
  src: [
    { path: "../fonts/quicksand-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/quicksand-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/quicksand-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-quicksand",
  display: "swap",
});
