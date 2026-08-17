import { requireSession } from "@/lib/supabase/server";
import { listRecordEntries } from "@/lib/actions/record";
import { RecordView } from "@/components/record/record-view";
import { profilePage } from "@/lib/perf/wrap";

async function RecordPage() {
  const { email } = await requireSession();

  const { entries, atFreeLimit, hasPurchased, inTrial } = await listRecordEntries();

  return (
    <RecordView
      initialEntries={entries}
      atFreeLimit={atFreeLimit}
      hasPurchased={hasPurchased}
      inTrial={inTrial}
      hasEmail={Boolean(email)}
    />
  );
}

export default profilePage("/record", RecordPage);
