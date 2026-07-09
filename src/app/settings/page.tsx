import { requireSession } from "@/lib/supabase/server";
import { getSettings } from "@/lib/actions/settings";
import { SettingsView } from "@/components/settings/settings-view";

export default async function SettingsPage() {
  await requireSession();

  const settings = await getSettings();

  return <SettingsView settings={settings} />;
}
