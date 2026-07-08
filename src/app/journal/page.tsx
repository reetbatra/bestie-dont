import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTodayJournal, listJournalHistory } from "@/lib/actions/journal";
import { JournalView } from "@/components/journal/journal-view";

export default async function JournalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/onboarding");

  const [today, history] = await Promise.all([getTodayJournal(), listJournalHistory()]);

  if (!today) redirect("/onboarding/date");

  return <JournalView today={today} history={history} />;
}
