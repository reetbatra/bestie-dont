import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/supabase/server";

export default async function RootPage() {
  const userId = await getSessionUserId();
  redirect(userId ? "/home" : "/onboarding");
}
