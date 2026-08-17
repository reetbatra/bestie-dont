import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/supabase/server";
import { profilePage } from "@/lib/perf/wrap";

async function RootPage() {
  const userId = await getSessionUserId();
  redirect(userId ? "/home" : "/onboarding");
}

export default profilePage("/", RootPage);
