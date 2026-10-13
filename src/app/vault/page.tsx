import { requireSession } from "@/lib/supabase/server";
import { listVaultEntries } from "@/lib/actions/vault";
import { VaultView } from "@/components/vault/vault-view";
import { profilePage } from "@/lib/perf/wrap";

export const metadata = { title: "The Vault" };

async function VaultPage() {
  await requireSession();

  const entries = await listVaultEntries();

  return <VaultView initialEntries={entries} />;
}

export default profilePage("/vault", VaultPage);
