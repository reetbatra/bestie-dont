"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface Section {
  eyebrow: string;
  title: string;
  body: string;
  accent: "apricot" | "sage" | "butter";
}

const SECTIONS: Section[] = [
  {
    eyebrow: "Why no contact, specifically",
    title: "This is hardest if you're anxiously attached. That's not a flaw.",
    body: "If your attachment system is wired to reach out the moment a connection feels at risk, no contact can feel like confirming your worst fear: that you'll be abandoned. That's not weakness, it's how anxious attachment is built to respond under threat. The popular \"30-day rule\" isn't actually backed by research; most of what protects you takes closer to 60 to 90 days. That's exactly why this is a 60-day program, not a weekend fix.",
    accent: "butter",
  },
  {
    eyebrow: "The panic button's 20-minute timer",
    title: "Urges have a shelf life.",
    body: "This isn't a willpower test. Psychologist Alan Marlatt studied cravings and found they behave like waves: they build, peak, and fall, usually within 15 to 30 minutes, whether you act on them or not. You don't have to beat the urge. You just have to outlast it. That's the whole timer.",
    accent: "apricot",
  },
  {
    eyebrow: "The breathing reset",
    title: "Your body doesn't know the difference between him and a threat.",
    body: "A flooded nervous system can't think its way calm, it has to be told by the body first. A longer exhale than inhale (the 4-in, 8-out you just did) stimulates the vagus nerve and shifts you out of fight-or-flight, measurably, in under a minute. That's why we make you breathe before we make you think.",
    accent: "sage",
  },
  {
    eyebrow: "Why a slip doesn't reset your streak",
    title: "Punishing yourself doesn't work. There's data on this.",
    body: "A widely cited habit-tracking study found people were far more likely to abandon a habit completely after breaking a strict streak, once it hits zero, why keep going? Separately, research on self-compassion (Dr. Kristin Neff) found people who meet a setback with compassion instead of shame recover faster than people who punish themselves for it. So a text doesn't erase your days. It gets logged, and the count keeps going.",
    accent: "butter",
  },
  {
    eyebrow: "Why the Record exists",
    title: "Memory edits itself to protect you. Don't let it.",
    body: "It's called rosy retrospection: your brain fades the sting of bad memories faster than the good ones, so exes get idealized over time. Writing things down before your memory revises them is one of the few things shown to counter that. But research is just as clear that cataloguing his behavior on a loop, with no reflection, can tip into rumination, which slows healing instead of helping it. That's why every entry has a second half: not just what he did, but what you told yourself to make it okay. That second part is what actually changes for the next relationship.",
    accent: "apricot",
  },
  {
    eyebrow: "Why we ask what's yours",
    title: "You didn't just lose him. You lost the parts of you that grew around him.",
    body: "Psychologists call it self-expansion: relationships grow your sense of self, new interests, new versions of you. Losing the relationship can feel like losing pieces of your identity, not just the person. Research on post-breakup recovery found people who actively rebuild their own interests and identity report better long-term wellbeing than people who rush into someone new. That's the whole point of the hobbies, friends, and goals you added on day one.",
    accent: "sage",
  },
];

const ACCENT_CLASSES: Record<Section["accent"], string> = {
  apricot: "border-apricot/30 bg-peach/40",
  sage: "border-sage/30 bg-sage/5",
  butter: "border-butter/40 bg-butter/10",
};

export default function WhyPage() {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-16 pt-10">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-3 inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back
      </button>

      <p className="font-display text-2xl font-extrabold text-apricot-deep">Not just vibes.</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-balance">Why this works.</h1>
      <p className="mt-3 max-w-[40ch] text-sm text-muted-foreground">
        Every mechanic in this app is built on something real, not a hunch about what might help.
        Here&apos;s the research behind it.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            className={`rounded-3xl border p-5 ${ACCENT_CLASSES[section.accent]}`}
          >
            <p className="text-sm font-semibold text-muted-foreground">
              {section.eyebrow}
            </p>
            <p className="mt-2 font-display text-lg font-extrabold leading-snug text-foreground">
              {section.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">{section.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card shadow-soft p-5">
        <p className="text-sm font-semibold text-muted-foreground">
          Where this comes from
        </p>
        <ul className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground">
          <li>Marlatt, A. - urge surfing and craving cycles in addiction psychology</li>
          <li>Research on prolonged exhale breathing and vagal tone / parasympathetic activation</li>
          <li>Neff, K. - self-compassion and resilience after setbacks</li>
          <li>Research on rosy retrospection and fading affect bias in memory</li>
          <li>Research on expressive writing, narrative coherence, and rumination risk</li>
          <li>Self-expansion theory and identity reconstruction after relationship loss</li>
          <li>Research on attachment style and no-contact recovery timelines</li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          We&apos;re a small team, not a research lab. We read the studies so the app could be
          built on them, we didn&apos;t run them ourselves.
        </p>
      </div>
    </div>
  );
}
