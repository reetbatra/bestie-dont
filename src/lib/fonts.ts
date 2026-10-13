import localFont from "next/font/local";

/**
 * Self-hosted, not next/font/google: the panic screen has to render with no
 * signal, so every font ships inside the app bundle the service worker caches.
 *
 * One rounded family for everything. The soft terminals do the calming work;
 * hierarchy comes from weight (800 headings, 400 body), not a second typeface.
 */
export const nunito = localFont({
  src: [
    { path: "../fonts/nunito-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/nunito-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/nunito-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/nunito-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-nunito",
  display: "swap",
});
