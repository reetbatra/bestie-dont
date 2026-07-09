import { requireSession } from "@/lib/supabase/server";
import { listRecordEntries } from "@/lib/actions/record";
import { RecordView } from "@/components/record/record-view";

export default async function RecordPage() {
  await requireSession();

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
