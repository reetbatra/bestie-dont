import { UrgeTimer } from "@/components/panic/urge-timer";

// Deliberately no server-side data fetch here. The urge timer is the one
// screen that has to render with zero connectivity (hotel wifi, dead zone,
// airplane mode) — UrgeTimer hydrates from a cached resist card in
// localStorage instantly, then refreshes from the server in the background
// when a connection is available. See ResistCardCache in urge-timer.tsx.
export default function UrgeTimerPage() {
  return <UrgeTimer />;
}
