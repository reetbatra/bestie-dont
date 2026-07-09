import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { streakDayNumber, daysRemaining, MILESTONE_DAYS, PROGRAM_LENGTH_DAYS } from "@/lib/streak";
import { CalendarGrid } from "@/components/calendar/calendar-grid";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/onboarding");

  const { data: streak } = await supabase
    .from("streaks")
    .select("id, start_date")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!streak) redirect("/onboarding/date");

  const day = streakDayNumber(streak.start_date);

  const { data: slips } = await supabase
    .from("slip_events")
    .select("occurred_at")
    .eq("streak_id", streak.id);

  const start = new Date(`${streak.start_date}T00:00:00`);
  const slipDays = new Set(
    (slips ?? []).map((s) => {
      const occurred = new Date(s.occurred_at);
      const occurredLocal = new Date(occurred.getFullYear(), occurred.getMonth(), occurred.getDate());
      const startLocal = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      return Math.round((occurredLocal.getTime() - startLocal.getTime()) / 86_400_000) + 1;
    }),
  );

  return (
    <CalendarGrid
      currentDay={Math.min(day, PROGRAM_LENGTH_DAYS)}
      totalDays={PROGRAM_LENGTH_DAYS}
      daysLeft={daysRemaining(day)}
      slipDays={slipDays}
      milestoneDays={MILESTONE_DAYS}
      graduated={day > PROGRAM_LENGTH_DAYS}
    />
  );
}
