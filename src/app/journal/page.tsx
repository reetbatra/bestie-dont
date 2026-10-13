import { redirect } from "next/navigation";
import { requireSession } from "@/lib/supabase/server";
import { getJournalScreen } from "@/lib/actions/journal";
import { JournalView } from "@/components/journal/journal-view";
import { profilePage } from "@/lib/perf/wrap";

export const metadata = { title: "Journal" };

async function JournalPage() {
  await requireSession();

  const screen = await getJournalScreen();

  if (!screen) redirect("/onboarding/date");

  return <JournalView today={screen.today} history={screen.history} />;
}

export default profilePage("/journal", JournalPage);
