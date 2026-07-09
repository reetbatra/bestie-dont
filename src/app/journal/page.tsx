import { redirect } from "next/navigation";
import { requireSession } from "@/lib/supabase/server";
import { getTodayJournal, listJournalHistory } from "@/lib/actions/journal";
import { JournalView } from "@/components/journal/journal-view";

export default async function JournalPage() {
  await requireSession();

  const [today, history] = await Promise.all([getTodayJournal(), listJournalHistory()]);

  if (!today) redirect("/onboarding/date");

  return <JournalView today={today} history={history} />;
}
