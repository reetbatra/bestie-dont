import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listReceipts } from "@/lib/actions/receipts";
import { ReceiptsView } from "@/components/receipts/receipts-view";

export default async function ReceiptsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/onboarding");

  const { receipts, atFreeLimit, hasPurchased } = await listReceipts();

  return <ReceiptsView initialReceipts={receipts} atFreeLimit={atFreeLimit} hasPurchased={hasPurchased} />;
}
