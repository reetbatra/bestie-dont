import { ImageResponse } from "next/og";

export const alt = "bestie, don't. The friend who takes your phone.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const WORDMARK = "BESTIE, DON'T.";
const HEADLINE = "You're not going to text him.";
const SUBLINE = "A calm 60-day no-contact companion. One button for the 1am urge.";

/**
 * Satori can't read the woff2 files the app ships for offline use, so the
 * card pulls Nunito from Google Fonts, subset to exactly the characters it
 * draws. No silent fallback: if the font can't be fetched, the render fails
 * loudly instead of shipping an off-brand card.
 */
async function loadNunito(weight: number, text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=Nunito:wght@${weight}&text=${encodeURIComponent(text)}`;
  const cssResponse = await fetch(url);
  if (!cssResponse.ok) throw new Error(`Nunito ${weight} stylesheet failed: ${cssResponse.status}`);
  const css = await cssResponse.text();
  const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!src) throw new Error(`Nunito ${weight} not found in Google Fonts response`);
  const response = await fetch(src[1]);
  if (!response.ok) throw new Error(`Nunito ${weight} download failed: ${response.status}`);
  return response.arrayBuffer();
}

/**
 * The card people see when a link to the app is pasted into a chat. Same
 * Sunrise look as the app: cream paper, morning light from the top, one
 * soft apricot sun, and the app's own rounded type.
 */
export default async function OpenGraphImage() {
  const [bold, heavy, regular] = await Promise.all([
    loadNunito(700, WORDMARK),
    loadNunito(800, HEADLINE),
    loadNunito(400, SUBLINE),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "radial-gradient(120% 70% at 50% -10%, #fde3c9 0%, #fbf4ea 70%)",
          color: "#3b2e2a",
          fontFamily: "Nunito",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 110,
            top: 150,
            width: 300,
            height: 300,
            borderRadius: 300,
            background: "radial-gradient(circle, #f9c497 0%, #f4a96f 60%, rgba(253,230,208,0) 72%)",
          }}
        />
        <div style={{ fontSize: 30, fontWeight: 700, color: "#7a685f", letterSpacing: 4 }}>
          {WORDMARK}
        </div>
        <div style={{ marginTop: 24, fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 760 }}>
          {HEADLINE}
        </div>
        <div style={{ marginTop: 28, fontSize: 34, color: "#7a685f", maxWidth: 720 }}>
          {SUBLINE}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Nunito", data: bold, weight: 700, style: "normal" },
        { name: "Nunito", data: heavy, weight: 800, style: "normal" },
        { name: "Nunito", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
