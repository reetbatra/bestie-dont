import localFont from "next/font/local";

export const fraunces = localFont({
  src: [
    { path: "../fonts/fraunces-300.woff2", weight: "300", style: "normal" },
    { path: "../fonts/fraunces-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/fraunces-400i.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

export const dmSans = localFont({
  src: [
    { path: "../fonts/dmsans-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/dmsans-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/dmsans-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-dmsans",
  display: "swap",
});
