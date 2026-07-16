import sharp from "sharp";
import { mkdirSync } from "node:fs";

const CREAM = "#FAF5EF";
const TERRACOTTA = "#B5442D";

// A crossed-out speech bubble: the literal core mechanic of the app (the
// text that doesn't get sent), not an abstract mark. A rounded chat bubble
// with a tail, terracotta on cream, with a single thick cream diagonal
// slash through it - the universal "blocked/muted" convention.
function markPaths(scale, offsetX, offsetY) {
  const s = scale;
  const tx = offsetX;
  const ty = offsetY;
  return `
    <g transform="translate(${tx}, ${ty}) scale(${s})">
      <rect x="106" y="126" width="300" height="210" rx="70" fill="${TERRACOTTA}" />
      <path d="M 195 336 L 165 410 L 255 336 Z" fill="${TERRACOTTA}" />
      <rect x="66" y="207" width="380" height="48" rx="24" fill="${CREAM}" transform="rotate(-45 256 231)" />
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

// "any" purpose icons - mark fills most of the canvas, square corners (OS applies its own mask)
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

// maskable - mark scaled down ~65% and centered so Android's circular/squircle
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

// apple touch icon - Next.js app/apple-icon.png convention, rounded square
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
