import { Bean, INK, PAPER, PINK } from "@/components/doodles/bean";
import { Arrow, Doodle, Ground, Heart, Note, Ticks } from "@/components/doodles/marks";

/**
 * One scene per moment. Each one is a single idea with Bean doing the work,
 * a few handwritten margin notes, and lots of empty paper around it.
 */

const STROKE = { stroke: INK, strokeWidth: 2.2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** Welcome: Bean shoves his 1am text away with both hands. */
export function PushPhoneScene({ className }: { className?: string }) {
  return (
    <Doodle label="Bean pushing away a phone with a 1am text from him" className={className}>
      <Ground y={192} />

      <g transform="translate(92 130) rotate(-11)">
        <rect x={-30} y={-58} width={60} height={114} rx={11} fill={PAPER} {...STROKE} />
        <rect x={-23} y={-45} width={46} height={86} rx={4} fill="none" stroke={INK} strokeWidth={1.2} />
        <path d="M -6 -51.5 L 6 -51.5" {...STROKE} strokeWidth={1.6} />
        <rect x={-19} y={-33} width={34} height={19} rx={8} fill="var(--pink-soft)" stroke={INK} strokeWidth={1.2} />
        <Note x={-2} y={-19} size={13}>u up?</Note>
        <rect x={-19} y={-8} width={24} height={16} rx={7} fill="var(--pink-soft)" stroke={INK} strokeWidth={1.2} />
        <Note x={-7} y={4} size={12}>hey</Note>
      </g>
      <Ticks x={60} y={74} angle={-18} />

      <Bean x={178} y={134} look={-1} leftHand={[-52, -16]} rightHand={[-50, 10]} />

      <Note x={58} y={36} color="red" size={19}>him. 1:07am.</Note>
      <Arrow from={[66, 44]} to={[84, 64]} color="red" bend={-6} />

      <Note x={216} y={82} color="blue" size={21} anchor="start" rotate={-4}>nope.</Note>

      <Arrow from={[156, 208]} to={[74, 208]} color="orange" bend={-3} />
    </Doodle>
  );
}

/** The Date: Bean circles day one on the calendar. */
export function CalendarScene({ className }: { className?: string }) {
  return (
    <Doodle label="Bean circling day one on a calendar" className={className}>
      <Ground y={192} />

      <path d="M 82 176 L 70 192" {...STROKE} />
      <path d="M 148 176 L 160 192" {...STROKE} />
      <rect x={60} y={58} width={110} height={120} rx={6} fill={PAPER} {...STROKE} />
      <rect x={60} y={58} width={110} height={26} rx={6} fill={PINK} {...STROKE} />
      <circle cx={86} cy={58} r={4.5} fill={PAPER} {...STROKE} strokeWidth={1.6} />
      <circle cx={144} cy={58} r={4.5} fill={PAPER} {...STROKE} strokeWidth={1.6} />
      <Note x={115} y={156} size={66}>1</Note>
      <path
        d="M 92 118 C 96 96 142 96 143 124 C 145 152 108 164 93 148 C 83 137 89 116 106 110"
        fill="none"
        stroke={PINK}
        strokeWidth={2.6}
        strokeLinecap="round"
      />

      {/* yesterday's pages, crumpled */}
      <g fill={PAPER} stroke={INK} strokeWidth={1.5}>
        <path d="M 30 182 C 26 172 40 168 44 176 C 48 184 36 190 30 182 Z" />
        <path d="M 33 178 L 40 181 M 35 184 L 41 176" fill="none" />
      </g>

      <Bean x={232} y={134} look={-1} leftHand={[-58, -26]} rightHand={[28, 18]} />
      {/* the marker in her hand */}
      <path d="M 170 104 L 182 112" stroke={PINK} strokeWidth={4} strokeLinecap="round" />

      <Note x={254} y={46} color="red" size={20}>day one.</Note>
      <Arrow from={[236, 54]} to={[178, 84]} color="red" bend={10} />
      <Note x={36} y={150} color="blue" size={16} rotate={-8}>old</Note>
      <Arrow from={[36, 156]} to={[36, 166]} color="blue" bend={0} width={1.6} />
    </Doodle>
  );
}

/** First Record entry: Bean holds up a receipt long enough to reach the floor. */
export function ReceiptScene({ className }: { className?: string }) {
  const lines = [112, 122, 132, 142, 152, 162];
  return (
    <Doodle label="Bean holding up a very long receipt" className={className}>
      <Ground y={196} />

      <path
        d="M 138 96 L 178 96 L 178 176 C 178 190 192 192 212 189 L 270 186 L 272 196 L 200 200 C 150 203 138 192 138 178 Z"
        fill={PAPER}
        {...STROKE}
      />
      <g stroke={INK} strokeWidth={1.3} strokeLinecap="round">
        {lines.map((y, i) => (
          <path key={y} d={`M 145 ${y} L ${i % 2 ? 164 : 171} ${y}`} />
        ))}
        <path d="M 218 194 L 236 193 M 244 192 L 262 191" />
      </g>
      <path d="M 145 142 L 171 142" stroke="var(--red)" strokeWidth={2.4} strokeLinecap="round" />

      <Bean x={102} y={138} look={1} leftHand={[38, -24]} rightHand={[40, -40]} />

      <Note x={238} y={70} color="red" size={20}>the receipts.</Note>
      <Arrow from={[228, 78]} to={[186, 112]} color="red" bend={-10} />
      <Note x={52} y={58} color="blue" size={17} rotate={-6}>for 1am you</Note>
      <Arrow from={[60, 66]} to={[80, 90]} color="blue" bend={-6} width={1.6} />
    </Doodle>
  );
}

/** What's Yours: Bean carries a box marked "mine" over her head. */
export function MineBoxScene({ className }: { className?: string }) {
  return (
    <Doodle label="Bean carrying a box labeled mine over her head" className={className}>
      <Ground y={196} />

      {/* things sticking out of the box */}
      <path
        d="M 146 40 L 149 48 L 158 48 L 151 53 L 154 61 L 146 56 L 139 61 L 141 53 L 134 48 L 143 48 Z"
        fill="var(--butter)"
        stroke={INK}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <rect x={160} y={34} width={14} height={22} rx={2} fill="var(--blue)" stroke={INK} strokeWidth={1.4} transform="rotate(10 167 45)" />
      <Heart x={186} y={50} size={1.3} />

      <path d="M 116 54 L 204 52 L 197 98 L 123 100 Z" fill={PAPER} {...STROKE} />
      <Note x={160} y={84} color="pink" size={24}>mine</Note>

      <Bean x={160} y={138} leftHand={[-30, -40]} rightHand={[30, -42]} />

      <Note x={56} y={78} color="red" size={20}>not his.</Note>
      <Arrow from={[74, 84]} to={[112, 80]} color="red" bend={-8} />
      <Note x={258} y={130} color="blue" size={17} rotate={4}>3 is plenty</Note>
    </Doodle>
  );
}

/** The Deal: Bean, hand on the big pink button instead of on the phone. */
export function ButtonScene({ className }: { className?: string }) {
  return (
    <Doodle label="Bean with her hand on a big pink button instead of her phone" className={className}>
      <Ground y={192} />

      {/* the phone she didn't pick up */}
      <rect x={28} y={50} width={26} height={44} rx={5} fill={PAPER} {...STROKE} strokeWidth={1.8} />
      <path d="M 22 46 L 60 98 M 60 46 L 22 98" stroke="var(--red)" strokeWidth={2.4} strokeLinecap="round" />
      <Note x={42} y={36} color="red" size={18}>not him</Note>

      <rect x={160} y={138} width={72} height={54} fill={PAPER} {...STROKE} />
      <ellipse cx={196} cy={138} rx={38} ry={9} fill={PAPER} {...STROKE} />
      <path d="M 164 136 C 166 112 226 112 228 136 C 214 142 178 142 164 136 Z" fill={PINK} {...STROKE} />

      <Bean x={112} y={134} look={1} rightHand={[58, -14]} leftHand={[-28, 18]} />

      <Arrow from={[62, 74]} to={[180, 106]} color="orange" bend={-22} />
      <Note x={240} y={112} color="pink" size={20} anchor="start">here.</Note>
      <Ticks x={232} y={108} color="pink" angle={20} />
    </Doodle>
  );
}

/** Home: Bean planting a little flag on today's count. */
export function FlagBean({ className, day }: { className?: string; day: number }) {
  return (
    <Doodle label={`Bean holding a flag for day ${day}`} width={120} height={132} className={className}>
      <path d="M 92 54 L 92 8" {...STROKE} />
      <path d="M 92 8 L 116 15 L 92 24 Z" fill={PINK} {...STROKE} strokeWidth={1.6} />
      <Bean x={58} y={70} scale={0.95} look={1} rightHand={[34, -16]} leftHand={[-30, 14]} />
      <Ground y={126} from={10} to={112} />
    </Doodle>
  );
}

/** Panic done: Bean sitting down, done, with a couple of hearts floating up. */
export function MadeItScene({ className }: { className?: string }) {
  return (
    <Doodle label="Bean sitting down, relieved, with hearts floating up" width={260} height={170} className={className}>
      <Ground y={160} from={30} to={230} />
      <Bean x={130} y={108} sitting look={0} leftHand={[-30, 20]} rightHand={[30, 20]} />
      <Heart x={176} y={50} size={1.2} />
      <Heart x={192} y={28} size={0.9} />
      <Note x={70} y={44} color="blue" size={20} rotate={-6}>phew.</Note>
    </Doodle>
  );
}

/** 404 and error: Bean sitting, a bit lost, question marks over her head. */
export function LostScene({ className, note = "huh?" }: { className?: string; note?: string }) {
  return (
    <Doodle label="Bean sitting on the ground looking a little lost" width={260} height={170} className={className}>
      <Ground y={160} from={30} to={230} />
      <Bean x={130} y={108} sitting look={-1} leftHand={[-30, 22]} rightHand={[30, 22]} />
      <Note x={170} y={56} color="blue" size={26} rotate={10}>?</Note>
      <Note x={190} y={40} color="blue" size={18} rotate={-8}>?</Note>
      <Note x={72} y={50} color="red" size={20} rotate={-6}>{note}</Note>
    </Doodle>
  );
}
