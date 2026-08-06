import { notFound } from "next/navigation";
import { requireSession } from "@/lib/supabase/server";
import { getRecoveryData } from "@/lib/actions/recovery";
import { RecoveryView } from "@/components/recovery/recovery-view";

export default async function RecoveryPage({
  params,
}: {
  params: Promise<{ slipId: string }>;
}) {
  const { slipId } = await params;

  await requireSession();

  const data = await getRecoveryData(slipId);
  if (!data) notFound();

  return <RecoveryView data={data} />;
}
