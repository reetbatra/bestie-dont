import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/actions/settings";
import { SettingsView } from "@/components/settings/settings-view";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/onboarding");

  const settings = await getSettings();

  return <SettingsView settings={settings} />;
}
