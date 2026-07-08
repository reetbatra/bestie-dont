import sharp from "sharp";
import { mkdirSync } from "node:fs";

const CREAM = "#FAF5EF";
const TERRACOTTA = "#B5442D";

// An abstract knot mark: two rounded ribbon bars crossing in an X, with a
// small cream "cinch" at the center to suggest a tied knot. Abstract on
// purpose — legible at any size, reads as an intentional brand mark rather
// than a literal illustration.
function markPaths(scale, offsetX, offsetY) {
  const s = scale;
  const tx = offsetX;
  const ty = offsetY;
  return `
    <g transform="translate(${tx}, ${ty}) scale(${s})">
      <rect x="86" y="211" width="340" height="90" rx="45" fill="${TERRACOTTA}" transform="rotate(45 256 256)" />
      <rect x="86" y="211" width="340" height="90" rx="45" fill="${TERRACOTTA}" transform="rotate(-45 256 256)" />
      <circle cx="256" cy="256" r="40" fill="${CREAM}" />
    </g>
  `;
}

function svg({ size, background, markScale, markOffsetX, markOffsetY, rounded }) {
  const radius = rounded ? size * 0.22 : 0;
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${background}" />
  ${markPaths(markScale, markOffsetX, markOffsetY)}
</svg>`;
}

const OUT_ICONS = "/Users/reet/Developer/bestie-dont/public/icons";
const OUT_APP = "/Users/reet/Developer/bestie-dont/src/app";
mkdirSync(OUT_ICONS, { recursive: true });

async function render(svgString, size, outPath) {
  await sharp(Buffer.from(svgString)).resize(size, size).png().toFile(outPath);
  console.log("wrote", outPath);
}

// "any" purpose icons — mark fills most of the canvas, square corners (OS applies its own mask)
for (const size of [192, 512]) {
  const scale = size / 512;
  const markup = svg({
    size,
    background: CREAM,
    markScale: scale * 1.0,
    markOffsetX: 0,
    markOffsetY: 0,
    rounded: false,
  });
  await render(markup, size, `${OUT_ICONS}/icon-${size}.png`);
}

// maskable — mark scaled down ~65% and centered so Android's circular/squircle
// mask never clips the hand shape
{
  const size = 512;
  const markScale = 0.62;
  const markPixelSize = 512 * markScale; // bounding box of the mark's own 512 canvas
  const offset = (size - markPixelSize) / 2;
  const markup = svg({
    size,
    background: CREAM,
    markScale,
    markOffsetX: offset,
    markOffsetY: offset,
    rounded: false,
  });
  await render(markup, size, `${OUT_ICONS}/icon-512-maskable.png`);
}

// apple touch icon — Next.js app/apple-icon.png convention, rounded square
// (iOS applies its own superellipse mask on top, but a filled square is safest)
{
  const size = 180;
  const scale = size / 512;
  const markup = svg({
    size,
    background: CREAM,
    markScale: scale,
    markOffsetX: 0,
    markOffsetY: 0,
    rounded: false,
  });
  await render(markup, size, `${OUT_APP}/apple-icon.png`);
}

// favicon-sized PNG for app/icon.png (Next.js serves this as the browser tab icon)
{
  const size = 128;
  const scale = size / 512;
  const markup = svg({
    size,
    background: CREAM,
    markScale: scale,
    markOffsetX: 0,
    markOffsetY: 0,
    rounded: false,
  });
  await render(markup, size, `${OUT_APP}/icon.png`);
}

console.log("done");
