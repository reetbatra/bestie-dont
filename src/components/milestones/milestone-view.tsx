"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { streakSubtext } from "@/lib/streak";
import type { MilestoneData } from "@/lib/actions/milestones";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

async function drawCard(canvas: HTMLCanvasElement, data: MilestoneData) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  await document.fonts.ready;
  const root = getComputedStyle(document.documentElement);
  const fraunces = root.getPropertyValue("--font-fraunces").trim() || "serif";
  const dmSans = root.getPropertyValue("--font-dmsans").trim() || "sans-serif";

  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  // background
  ctx.fillStyle = "#1C1917";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // soft terracotta glow behind the number
  const gradient = ctx.createRadialGradient(
    CARD_WIDTH / 2,
    720,
    100,
    CARD_WIDTH / 2,
    720,
    620,
  );
  gradient.addColorStop(0, "rgba(224, 106, 78, 0.28)");
  gradient.addColorStop(1, "rgba(224, 106, 78, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.textAlign = "center";

  // wordmark
  ctx.fillStyle = "#B0A699";
  ctx.font = `600 32px ${dmSans}`;
  ctx.letterSpacing = "4px";
  ctx.fillText("BESTIE, DON'T.", CARD_WIDTH / 2, 220);
  ctx.letterSpacing = "0px";

  // big day number
  ctx.fillStyle = "#E06A4E";
  ctx.font = `600 420px ${fraunces}`;
  ctx.fillText(String(data.day), CARD_WIDTH / 2, 900);

  ctx.fillStyle = "#F5EFE7";
  ctx.font = `500 48px ${dmSans}`;
  ctx.fillText(data.day === 1 ? "DAY" : "DAYS", CARD_WIDTH / 2, 990);

  // subtext
  ctx.fillStyle = "#F5EFE7";
  ctx.font = `400 42px ${fraunces}`;
  wrapText(ctx, streakSubtext(data.day), CARD_WIDTH / 2, 1130, 780, 56);

  // stats row
  const stats = [
    { label: "nights survived", value: data.nightsSurvived },
    { label: "memories saved", value: data.memoriesLogged },
    { label: "days journaled", value: data.journalEntriesWritten },
  ];
  const statY = 1600;
  const colWidth = CARD_WIDTH / 3;
  stats.forEach((stat, i) => {
    const x = colWidth * i + colWidth / 2;
    ctx.fillStyle = "#F3C969";
    ctx.font = `600 72px ${fraunces}`;
    ctx.fillText(String(stat.value), x, statY);
    ctx.fillStyle = "#B0A699";
    ctx.font = `500 28px ${dmSans}`;
    wrapText(ctx, stat.label, x, statY + 50, colWidth - 40, 32);
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, cursorY);
}

export function MilestoneView({ data }: { data: MilestoneData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      void drawCard(canvasRef.current, data).then(() => setReady(true));
    }
  }, [data]);

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `bestie-dont-day-${data.day}.png`, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `Day ${data.day}` });
          return;
        } catch {
          // user cancelled the share sheet, fall through to download
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bestie-dont-day-${data.day}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[480px] flex-col items-center px-6 pb-6 pt-8 text-center">
      <p className="font-display text-2xl italic text-terracotta">{data.day} days.</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-balance [@media(max-height:700px)]:text-2xl">
        {streakSubtext(data.day)}
      </h1>

      {/* flex-1 + min-h-0 hands the card whatever height is left, so the
          page never scrolls; the canvas keeps 9:16 via its intrinsic size */}
      <div className="mt-5 flex min-h-0 w-full flex-1 items-center justify-center">
        <canvas
          ref={canvasRef}
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
          className="max-h-full max-w-full rounded-3xl border border-border bg-[#1C1917] shadow-lg"
        />
      </div>

      <div className="mt-5 flex w-full flex-col gap-3">
        <Button size="lg" onClick={handleShare} disabled={!ready} className="w-full">
          Share this
        </Button>
        <Button variant="ghost" render={<Link href="/home" />} className="w-full">
          Keep going
        </Button>
      </div>
    </div>
  );
}
