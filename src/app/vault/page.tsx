import { requireSession } from "@/lib/supabase/server";
import { listVaultEntries } from "@/lib/actions/vault";
import { VaultView } from "@/components/vault/vault-view";

export default async function VaultPage() {
  await requireSession();

  const entries = await listVaultEntries();

  return <VaultView initialEntries={entries} />;
}
