import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listRecordEntries } from "@/lib/actions/record";
import { RecordView } from "@/components/record/record-view";

export default async function RecordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/onboarding");

  const { entries, atFreeLimit, hasPurchased, inTrial } = await listRecordEntries();

  return (
    <RecordView
      initialEntries={entries}
      atFreeLimit={atFreeLimit}
      hasPurchased={hasPurchased}
      inTrial={inTrial}
    />
  );
}
