/**
 * Bean: the app's doodle character. A small solid-ink bean with dot eyes, a
 * pink bow and stick limbs, drawn like a pen sketch on white paper.
 *
 * Personality rules (they decide every pose in scenes.tsx):
 * - Deadpan, never cheerful. Blank dot eyes, no mouth.
 * - Always *doing the job*: pushing the phone away, holding the receipts,
 *   guarding the button. If you can delete Bean from a scene and the scene
 *   still says the same thing, Bean is decoration and the scene is wrong.
 * - The bow is the only "cute". Everything else stays dry.
 *
 * Renders as an SVG <g> so scenes can place several props around it. All
 * coordinates are relative to the centre of the body; the feet land at y=58.
 */

export type Point = readonly [number, number];

export const INK = "var(--ink)";
export const PINK = "var(--pink)";
export const PAPER = "var(--paper)";

// Deliberately lopsided so it reads as hand-drawn rather than as an ellipse.
const BODY =
  "M -3 -39 C 17 -41 30 -24 29.5 -1 C 29 22 19 37.5 1 38.5 C -19 39.5 -30.5 23 -29.5 2 C -28.5 -19 -22 -37.5 -3 -39 Z";

const SHOULDER_L: Point = [-24, -2];
const SHOULDER_R: Point = [24, -4];

function Arm({ from, to }: { from: Point; to: Point }) {
  // A slight elbow bend: the control point sits below the straight line.
  const cx = (from[0] + to[0]) / 2;
  const cy = (from[1] + to[1]) / 2 + 7;
  return (
    <path
      d={`M ${from[0]} ${from[1]} Q ${cx} ${cy} ${to[0]} ${to[1]}`}
      fill="none"
      stroke={INK}
      strokeWidth={2.4}
      strokeLinecap="round"
    />
  );
}

export function Bean({
  x,
  y,
  scale = 1,
  leftHand,
  rightHand,
  look = 0,
  flip = false,
  sitting = false,
  bob = true,
}: {
  x: number;
  y: number;
  scale?: number;
  /** Where the left hand ends up, relative to the body centre. Omit for no arm. */
  leftHand?: Point;
  rightHand?: Point;
  /** -1 looks left, 1 looks right, 0 straight ahead. */
  look?: -1 | 0 | 1;
  flip?: boolean;
  /** Folded legs instead of standing ones. */
  sitting?: boolean;
  /** Idle breathing motion. Turned off automatically for reduced motion. */
  bob?: boolean;
}) {
  const pupil = look * 1.6;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <g className={bob ? "doodle-bob" : undefined}>
        {sitting ? (
          <g fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M -12 34 L -22 44 L -10 50" />
            <path d="M 10 35 L 20 45 L 8 51" />
          </g>
        ) : (
          <g fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round">
            <path d="M -9 36 L -11 57 L -17 58" />
            <path d="M 9 36 L 11 57 L 17 58" />
          </g>
        )}

        {leftHand && <Arm from={SHOULDER_L} to={leftHand} />}
        {rightHand && <Arm from={SHOULDER_R} to={rightHand} />}

        <path d={BODY} fill={INK} />

        {/* eyes */}
        <g className="doodle-blink">
          <circle cx={-8} cy={-10} r={4.6} fill={PAPER} />
          <circle cx={9} cy={-11} r={4.6} fill={PAPER} />
          <circle cx={-8 + pupil} cy={-9.5} r={1.9} fill={INK} />
          <circle cx={9 + pupil} cy={-10.5} r={1.9} fill={INK} />
        </g>

        {/* the bow */}
        <g transform="translate(15 -33) rotate(18)" stroke={INK} strokeWidth={1.6} strokeLinejoin="round">
          <path d="M 0 0 C -6 -9 -15 -6 -13 1 C -12 7 -5 5 0 0 Z" fill={PINK} />
          <path d="M 0 0 C 6 -9 15 -6 13 1 C 12 7 5 5 0 0 Z" fill={PINK} />
          <circle cx={0} cy={0} r={2.6} fill={PINK} />
        </g>
      </g>
    </g>
  );
}
