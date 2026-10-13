/**
 * Bean: the app's mascot. A soft, flat, warm-dark bean with dot eyes and an
 * apricot bow, drawn without outlines so she sits inside the calm Sunrise
 * palette instead of on top of it.
 *
 * Personality rules (they decide every pose in scenes.tsx):
 * - Quietly steady, never cheerful-loud. Dot eyes, no mouth.
 * - Always doing something small and kind: holding the note, keeping the
 *   things that are hers, resting a hand on the button. If Bean could be
 *   deleted from a scene without changing what it says, the scene is wrong.
 *
 * Renders as an SVG <g> so scenes can place props around it. All coordinates
 * are relative to the centre of the body; the feet land at y=54.
 */

export type Point = readonly [number, number];

export const INK = "var(--ink)";
export const APRICOT = "var(--apricot)";
export const CREAM = "var(--cream)";

// Deliberately a touch lopsided so it reads as drawn, not as an ellipse.
const BODY =
  "M -3 -39 C 17 -41 30 -24 29.5 -1 C 29 22 19 37.5 1 38.5 C -19 39.5 -30.5 23 -29.5 2 C -28.5 -19 -22 -37.5 -3 -39 Z";

const SHOULDER_L: Point = [-24, -2];
const SHOULDER_R: Point = [24, -4];
const LIMB = { fill: "none", stroke: INK, strokeWidth: 3.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function Arm({ from, to }: { from: Point; to: Point }) {
  // A slight elbow bend: the control point sits below the straight line.
  const cx = (from[0] + to[0]) / 2;
  const cy = (from[1] + to[1]) / 2 + 6;
  return <path d={`M ${from[0]} ${from[1]} Q ${cx} ${cy} ${to[0]} ${to[1]}`} {...LIMB} />;
}

export function Bean({
  x,
  y,
  scale = 1,
  leftHand,
  rightHand,
  look = 0,
  sitting = false,
  legs = true,
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
  /** Folded legs instead of standing ones. */
  sitting?: boolean;
  /** Head-and-shoulders crops (the home badge) leave the legs off. */
  legs?: boolean;
  /** Idle breathing motion. Turned off automatically for reduced motion. */
  bob?: boolean;
}) {
  const pupil = look * 1.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className={bob ? "doodle-bob" : undefined}>
        {legs &&
          (sitting ? (
            <g {...LIMB}>
              <path d="M -12 34 L -21 43 L -10 48" />
              <path d="M 10 35 L 19 44 L 8 49" />
            </g>
          ) : (
            <g {...LIMB}>
              <path d="M -9 36 L -10 54" />
              <path d="M 9 36 L 10 54" />
            </g>
          ))}

        {leftHand && <Arm from={SHOULDER_L} to={leftHand} />}
        {rightHand && <Arm from={SHOULDER_R} to={rightHand} />}

        <path d={BODY} fill={INK} />

        <g className="doodle-blink">
          <circle cx={-8} cy={-10} r={4.4} fill={CREAM} />
          <circle cx={9} cy={-11} r={4.4} fill={CREAM} />
          <circle cx={-8 + pupil} cy={-9.5} r={1.8} fill={INK} />
          <circle cx={9 + pupil} cy={-10.5} r={1.8} fill={INK} />
        </g>

        <g transform="translate(15 -33) rotate(18)" fill={APRICOT}>
          <path d="M 0 0 C -6 -9 -15 -6 -13 1 C -12 7 -5 5 0 0 Z" />
          <path d="M 0 0 C 6 -9 15 -6 13 1 C 12 7 5 5 0 0 Z" />
          <circle r={2.8} />
        </g>
      </g>
    </g>
  );
}
