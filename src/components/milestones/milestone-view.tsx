"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { streakSubtext } from "@/lib/streak";
import type { MilestoneData } from "@/lib/actions/milestones";
import { ExtendProgramDialog } from "@/components/milestones/extend-program-dialog";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

async function drawCard(canvas: HTMLCanvasElement, data: MilestoneData) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  await document.fonts.ready;
  const root = getComputedStyle(document.documentElement);
  const hand = root.getPropertyValue("--font-caveat").trim() || "cursive";
  const body = root.getPropertyValue("--font-quicksand").trim() || "sans-serif";

  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  // Same doodle-on-paper look as the app. The final milestone of the program
  // (day 60, or day 90 if extended) swaps the pink number for ink with a
  // pink highlighter swipe behind it.
  const graduated = data.isFinalMilestone;
  const ink = "#1D1B1A";
  const muted = "#5F5A57";
  const pink = "#D6336C";
  const accent = graduated ? ink : pink;
  const statColor = graduated ? pink : ink;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  if (graduated) {
    ctx.fillStyle = "#FFE3EE";
    ctx.fillRect(CARD_WIDTH / 2 - 330, 700, 660, 210);
  }

  ctx.textAlign = "center";

  // wordmark
  ctx.fillStyle = muted;
  ctx.font = `700 32px ${body}`;
  ctx.letterSpacing = "4px";
  ctx.fillText("BESTIE, DON'T.", CARD_WIDTH / 2, 220);
  ctx.letterSpacing = "0px";

  // big day number
  ctx.fillStyle = accent;
  ctx.font = `700 460px ${hand}`;
  ctx.fillText(String(data.day), CARD_WIDTH / 2, 900);

  ctx.fillStyle = ink;
  ctx.font = `700 48px ${body}`;
  ctx.letterSpacing = graduated ? "6px" : "0px";
  ctx.fillText(graduated ? "DAYS. GRADUATED." : "DAYS", CARD_WIDTH / 2, 990);
  ctx.letterSpacing = "0px";

  // subtext
  ctx.fillStyle = ink;
  ctx.font = `700 60px ${hand}`;
  wrapText(ctx, streakSubtext(data.day), CARD_WIDTH / 2, 1130, 780, 56);

  // stats row; a zero on a celebration card reads as failure, so only
  // earned stats render (nights survived is always >= the milestone day)
  const stats = [
    { label: "nights survived", value: data.nightsSurvived },
    { label: "memories saved", value: data.memoriesLogged },
    { label: "days journaled", value: data.journalEntriesWritten },
  ].filter((stat) => stat.value > 0);
  const statY = 1600;
  const colWidth = CARD_WIDTH / stats.length;
  stats.forEach((stat, i) => {
    const x = colWidth * i + colWidth / 2;
    ctx.fillStyle = statColor;
    ctx.font = `700 96px ${hand}`;
    ctx.fillText(String(stat.value), x, statY);
    ctx.fillStyle = muted;
    ctx.font = `500 28px ${body}`;
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
      <p className="font-display text-2xl font-bold text-pink">{data.day} days.</p>
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
          className="max-h-full max-w-full rounded-sketch border border-border bg-paper"
        />
      </div>

      <div className="mt-5 flex w-full flex-col gap-3">
        <Button size="lg" onClick={handleShare} disabled={!ready} className="w-full">
          Share this
        </Button>
        {data.showExtensionOffer && <ExtendProgramDialog />}
        <Button variant="ghost" render={<Link href="/home" />} className="w-full">
          Keep going
        </Button>
      </div>
    </div>
  );
}
