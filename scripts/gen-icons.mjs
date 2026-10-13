import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Run with: node scripts/gen-icons.mjs
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_ICONS = join(ROOT, "public/icons");
const OUT_APP = join(ROOT, "src/app");

const PAPER = "#FBF4EA";
const INK = "#3B2E2A";
const APRICOT = "#F4A96F";
const PEACH = "#FDE6D0";

// Bean, the app's doodle character (src/components/doodles/bean.tsx), as a
// head-and-bow portrait inside a soft peach sun. Same body path and bow,
// drawn in a 100x100 box.
function bean() {
  return `
    <g transform="translate(50 54) scale(1.05)">
      <path d="M -3 -39 C 17 -41 30 -24 29.5 -1 C 29 22 19 37.5 1 38.5 C -19 39.5 -30.5 23 -29.5 2 C -28.5 -19 -22 -37.5 -3 -39 Z" fill="${INK}" />
      <circle cx="-8" cy="-10" r="4.6" fill="${PAPER}" />
      <circle cx="9" cy="-11" r="4.6" fill="${PAPER}" />
      <circle cx="-8" cy="-9.5" r="1.9" fill="${INK}" />
      <circle cx="9" cy="-10.5" r="1.9" fill="${INK}" />
      <g transform="translate(15 -33) rotate(18)" fill="${APRICOT}">
        <path d="M 0 0 C -6 -9 -15 -6 -13 1 C -12 7 -5 5 0 0 Z" />
        <path d="M 0 0 C 6 -9 15 -6 13 1 C 12 7 5 5 0 0 Z" />
        <circle cx="0" cy="0" r="2.8" />
      </g>
    </g>`;
}

/** `fill` is the share of the canvas the 100-unit drawing occupies. */
function svg(size, fill) {
  const s = (size * fill) / 100;
  const offset = (size - size * fill) / 2;
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${PAPER}" />
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.42}" fill="${PEACH}" />
  <g transform="translate(${offset} ${offset}) scale(${s}) translate(16 17) scale(0.68)">${bean()}</g>
</svg>`;
}

async function render(markup, size, outPath) {
  await sharp(Buffer.from(markup)).resize(size, size).png().toFile(outPath);
  console.log("wrote", outPath);
}

mkdirSync(OUT_ICONS, { recursive: true });

// "any" purpose: Bean fills most of the square, the OS applies its own mask
for (const size of [192, 512]) await render(svg(size, 0.95), size, `${OUT_ICONS}/icon-${size}.png`);
// maskable: kept inside the ~80% safe zone so a circular mask never clips the bow
await render(svg(512, 0.7), 512, `${OUT_ICONS}/icon-512-maskable.png`);
await render(svg(180, 0.9), 180, `${OUT_APP}/apple-icon.png`);
await render(svg(128, 0.95), 128, `${OUT_APP}/icon.png`);
console.log("done");
