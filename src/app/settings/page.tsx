import { requireSession } from "@/lib/supabase/server";
import { getSettings } from "@/lib/actions/settings";
import { SettingsView } from "@/components/settings/settings-view";
import { profilePage } from "@/lib/perf/wrap";

async function SettingsPage() {
  await requireSession();

  const settings = await getSettings();

  return <SettingsView settings={settings} />;
}

export default profilePage("/settings", SettingsPage);
