import type { ReactNode } from "react";
import { INK, type Point } from "@/components/doodles/bean";

/**
 * The pen marks every scene is built from: a paper frame, handwritten notes,
 * hand-drawn arrows and a wobbly ground line. Marker colours follow the
 * palette roles in globals.css (red = matters, orange = movement,
 * blue = quieter inner note, pink = hers).
 */

export type Marker = "ink" | "red" | "orange" | "blue" | "pink";

const MARKER: Record<Marker, string> = {
  ink: INK,
  red: "var(--red)",
  orange: "var(--orange)",
  blue: "var(--blue)",
  pink: "var(--pink)",
};

/**
 * Every scene is decorative support for copy that already says the same
 * thing in the page's own text, so it's labelled once for screen readers
 * and the notes inside are hidden from them.
 */
export function Doodle({
  label,
  width = 320,
  height = 220,
  className,
  children,
}: {
  label: string;
  width?: number;
  height?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/*
          Roughens straight vector lines into pen lines. Same id in every
          scene on purpose: the definitions are identical, so whichever one
          the browser resolves first draws them all the same.
        */}
        <filter id="doodle-pen" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="2.2" />
        </filter>
      </defs>
      <g filter="url(#doodle-pen)" aria-hidden="true">
        {children}
      </g>
    </svg>
  );
}

export function Note({
  x,
  y,
  children,
  color = "ink",
  size = 17,
  anchor = "middle",
  rotate = 0,
}: {
  x: number;
  y: number;
  children: ReactNode;
  color?: Marker;
  size?: number;
  anchor?: "start" | "middle" | "end";
  rotate?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      fill={MARKER[color]}
      fontSize={size}
      textAnchor={anchor}
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
      className="font-display"
      fontWeight={700}
    >
      {children}
    </text>
  );
}

/** A slightly bowed arrow with an open, hand-drawn head. */
export function Arrow({
  from,
  to,
  color = "orange",
  bend = 10,
  width = 2,
}: {
  from: Point;
  to: Point;
  color?: Marker;
  /** Positive bows the arrow to its left, negative to its right. */
  bend?: number;
  width?: number;
}) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  // control point offset perpendicular to the line
  const cx = mx + (-(y2 - y1) / len) * bend;
  const cy = my + ((x2 - x1) / len) * bend;
  // arrowhead follows the tangent at the end of the curve
  const angle = Math.atan2(y2 - cy, x2 - cx);
  const head = 8;
  const a1 = angle + Math.PI * 0.82;
  const a2 = angle - Math.PI * 0.82;
  const stroke = MARKER[color];
  return (
    <g fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <path d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`} />
      <path
        d={`M ${x2 + Math.cos(a1) * head} ${y2 + Math.sin(a1) * head} L ${x2} ${y2} L ${x2 + Math.cos(a2) * head} ${y2 + Math.sin(a2) * head}`}
      />
    </g>
  );
}

/** The wobbly line everything stands on. */
export function Ground({ y, from = 24, to = 296 }: { y: number; from?: number; to?: number }) {
  const third = (to - from) / 3;
  return (
    <path
      d={`M ${from} ${y} C ${from + third} ${y - 2.5} ${from + third * 2} ${y + 2.5} ${to} ${y - 0.5}`}
      fill="none"
      stroke={INK}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  );
}

/** Little motion ticks, like a phone buzzing or something going "ding". */
export function Ticks({ x, y, color = "red", angle = 0 }: { x: number; y: number; color?: Marker; angle?: number }) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${angle})`}
      stroke={MARKER[color]}
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d="M 0 0 L -7 -5" />
      <path d="M 2 -8 L -2 -16" />
      <path d="M 9 -10 L 9 -19" />
    </g>
  );
}

export function Heart({ x, y, size = 1, fill = "var(--pink)" }: { x: number; y: number; size?: number; fill?: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${size})`}
      d="M 0 4 C -9 -3 -8 -11 -2 -10 C 0 -9.5 0 -8 0 -7 C 0 -8 1 -10 3 -10 C 9 -10 8 -2 0 4 Z"
      fill={fill}
      stroke={INK}
      strokeWidth={1.4}
      strokeLinejoin="round"
    />
  );
}
