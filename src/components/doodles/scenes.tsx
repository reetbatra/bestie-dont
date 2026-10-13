import type { ReactNode } from "react";
import { APRICOT, Bean, CREAM, INK } from "@/components/doodles/bean";

/**
 * One soft scene per moment, in the Sunrise style: flat shapes with no
 * outlines, light that falls in gentle gradients, Bean doing one small thing,
 * and lots of quiet space around it.
 *
 * Every scene supports copy the page already says in text, so each is
 * labelled once for screen readers and its shapes are hidden from them.
 */

const PEACH = "var(--peach)";
const SAGE = "var(--sage)";
const BUTTER = "var(--butter)";

/**
 * Wraps a scene and provides its gradients. `id` namespaces the gradient ids
 * so two scenes on one page can never resolve each other's definitions.
 */
function Scene({
  id,
  label,
  width = 300,
  height = 220,
  className,
  children,
}: {
  id: string;
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
        <radialGradient id={`${id}-sun`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f9c497" />
          <stop offset="100%" stopColor="#f4a96f" />
        </radialGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbd6b3" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fde6d0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-hill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6b98a" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#fbe1c8" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="22%" stopColor="white" stopOpacity="1" />
          <stop offset="78%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-edges`} maskContentUnits="objectBoundingBox">
          <rect width="1" height="1" fill={`url(#${id}-fade)`} />
        </mask>
        <linearGradient id={`${id}-button`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7b885" />
          <stop offset="100%" stopColor="#f19d63" />
        </linearGradient>
      </defs>
      <g aria-hidden="true">{children}</g>
    </svg>
  );
}

const fill = (id: string, name: "sun" | "glow" | "hill" | "button") => `url(#${id}-${name})`;

function Hill({ id, y = 186 }: { id: string; y?: number }) {
  return (
    <path
      d={`M 0 ${y + 10} C 70 ${y - 18} 130 ${y + 4} 175 ${y - 4} C 220 ${y - 12} 262 ${y - 4} 300 ${y - 10} L 300 220 L 0 220 Z`}
      fill={fill(id, "hill")}
      mask={`url(#${id}-edges)`}
    />
  );
}

/** Welcome: Bean standing in front of a big, slow sunrise. */
export function SunriseScene({ className }: { className?: string }) {
  const id = "sunrise";
  return (
    <Scene id={id} label="Bean standing calmly in front of a rising sun" className={className}>
      <circle cx={150} cy={118} r={104} fill={fill(id, "glow")} />
      <circle cx={150} cy={118} r={64} fill={fill(id, "sun")} opacity={0.85} />
      <Hill id={id} />
      <Bean x={150} y={138} scale={1.1} />
    </Scene>
  );
}

/** The Date: a soft calendar card showing day one, Bean beside it. */
export function DayOneScene({ className }: { className?: string }) {
  const id = "dayone";
  return (
    <Scene id={id} label="Bean next to a calendar showing day one" className={className}>
      <circle cx={232} cy={56} r={46} fill={fill(id, "glow")} />
      <circle cx={232} cy={56} r={20} fill={fill(id, "sun")} opacity={0.8} />
      <Hill id={id} />
      <g transform="translate(64 66)">
        <rect width={96} height={106} rx={18} fill={CREAM} />
        <rect width={96} height={30} rx={18} fill={fill(id, "button")} />
        <rect y={16} width={96} height={14} fill={fill(id, "button")} />
        <text
          x={48}
          y={88}
          textAnchor="middle"
          className="font-display"
          fontSize={52}
          fontWeight={800}
          fill="var(--apricot-deep)"
        >
          1
        </text>
      </g>
      <Bean x={204} y={140} look={-1} leftHand={[-36, -14]} />
    </Scene>
  );
}

/** First Record entry: Bean holding up a note so it doesn't get lost. */
export function NoteScene({ className }: { className?: string }) {
  const id = "note";
  return (
    <Scene id={id} label="Bean holding up a note" className={className}>
      <circle cx={150} cy={104} r={98} fill={fill(id, "glow")} />
      <Hill id={id} />
      <Bean x={124} y={140} look={1} rightHand={[34, -30]} leftHand={[32, -12]} />
      <g transform="translate(150 70) rotate(6)">
        <rect width={64} height={78} rx={12} fill={CREAM} />
        <g stroke="var(--input)" strokeWidth={4} strokeLinecap="round">
          <path d="M 14 22 L 50 22" />
          <path d="M 14 36 L 44 36" />
          <path d="M 14 50 L 48 50" />
        </g>
        <circle cx={50} cy={64} r={5} fill={APRICOT} />
      </g>
    </Scene>
  );
}

function SoftHeart({ x, y, scale = 1, color }: { x: number; y: number; scale?: number; color: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${scale})`}
      d="M 0 6 C -12 -3 -11 -14 -3 -13 C 0 -12.5 0 -10.5 0 -9 C 0 -10.5 1 -13 4 -13 C 12 -13 11 -3 0 6 Z"
      fill={color}
    />
  );
}

/** What's Yours: Bean cradling a bowl of small things that belong to her. */
export function KeepsakesScene({ className }: { className?: string }) {
  const id = "keepsakes";
  return (
    <Scene id={id} label="Bean holding a bowl of small things that are hers" className={className}>
      <circle cx={150} cy={110} r={100} fill={fill(id, "glow")} />
      <Hill id={id} />
      <Bean x={150} y={136} leftHand={[-24, 24]} rightHand={[24, 24]} />
      {/* the things, resting in the bowl she holds at her belly */}
      <SoftHeart x={137} y={158} scale={1.1} color={APRICOT} />
      <path d="M 162 162 C 156 152 161 143 172 139 C 174 150 171 158 162 162 Z" fill={SAGE} />
      <circle cx={151} cy={152} r={6.5} fill={BUTTER} />
      <path d="M 120 160 C 124 182 176 182 180 160 Z" fill={PEACH} />
    </Scene>
  );
}

/** The Deal: Bean resting a hand on the one button she presses instead. */
export function CalmButtonScene({ className }: { className?: string }) {
  const id = "calmbutton";
  return (
    <Scene id={id} label="Bean resting her hand on a big soft button" className={className}>
      <Hill id={id} />
      <circle cx={196} cy={128} r={62} fill={fill(id, "glow")} />
      <rect x={160} y={140} width={72} height={46} rx={14} fill={PEACH} />
      <ellipse cx={196} cy={138} rx={36} ry={12} fill={fill(id, "button")} />
      <path d="M 164 136 C 166 116 226 116 228 136 C 214 143 178 143 164 136 Z" fill={fill(id, "button")} />
      <Bean x={112} y={138} look={1} rightHand={[56, -16]} />
    </Scene>
  );
}

/** Home: Bean in a small sun badge next to the day count. */
export function HomeBadge({ className, day }: { className?: string; day: number }) {
  const id = "homebadge";
  return (
    <Scene id={id} label={`Bean, on day ${day}`} width={110} height={110} className={className}>
      <circle cx={55} cy={55} r={52} fill={fill(id, "glow")} />
      <circle cx={55} cy={55} r={40} fill={PEACH} />
      <Bean x={55} y={62} scale={0.82} legs={false} />
    </Scene>
  );
}

/** Panic done: Bean sitting down on the hill, the sun coming up behind her. */
export function RestScene({ className }: { className?: string }) {
  const id = "rest";
  return (
    <Scene id={id} label="Bean sitting down, resting, as the sun comes up" width={260} height={170} className={className}>
      <circle cx={130} cy={118} r={84} fill={fill(id, "glow")} />
      <circle cx={162} cy={82} r={38} fill={fill(id, "sun")} opacity={0.8} />
      <path d="M 0 150 C 60 128 110 144 150 138 C 190 132 226 138 260 132 L 260 170 L 0 170 Z" fill={fill(id, "hill")} mask={`url(#${id}-edges)`} />
      <Bean x={118} y={104} sitting />
    </Scene>
  );
}

/** 404 and error: Bean sitting quietly, a soft question bubble beside her. */
export function LostScene({ className }: { className?: string }) {
  const id = "lost";
  return (
    <Scene id={id} label="Bean sitting quietly, a little lost" width={260} height={170} className={className}>
      <circle cx={130} cy={100} r={80} fill={fill(id, "glow")} />
      <path d="M 0 150 C 60 128 110 144 150 138 C 190 132 226 138 260 132 L 260 170 L 0 170 Z" fill={fill(id, "hill")} mask={`url(#${id}-edges)`} />
      <Bean x={118} y={102} sitting look={1} />
      <circle cx={178} cy={52} r={18} fill={CREAM} />
      <circle cx={162} cy={70} r={4} fill={CREAM} />
      <text
        x={178}
        y={60}
        textAnchor="middle"
        className="font-display"
        fontSize={22}
        fontWeight={800}
        fill={INK}
      >
        ?
      </text>
    </Scene>
  );
}
