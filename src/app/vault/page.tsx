import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listVaultEntries } from "@/lib/actions/vault";
import { VaultView } from "@/components/vault/vault-view";

export default async function VaultPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/onboarding");

  const entries = await listVaultEntries();

  return <VaultView initialEntries={entries} />;
}
