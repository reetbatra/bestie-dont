import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { encryptField, encryptOptionalField } from "@/lib/crypto";
import { PROFILING } from "@/lib/perf/profiler";

/**
 * Creates a throwaway anonymous account and fills it with a realistic amount
 * of data, so a profiling run measures the app the way it behaves for
 * someone 45 days in - not the way it behaves for an empty account, where
 * every list is a no-op and every decrypt loop runs zero times.
 *
 * 404s unless PROFILE=1. It is a seeding endpoint with no auth, which is
 * exactly why it must not exist in a normal deployment.
 *
 * The response carries the session cookies, so scripts/perf-drive.mjs can
 * pick them up and drive every page as a signed-in user without simulating
 * the onboarding UI or hand-rolling Supabase's cookie format.
 */

export const dynamic = "force-dynamic";

const RAW_TEXT =
  "He said he needed space and then posted a photo with her four hours later. " +
  "I keep re-reading the last message like it will say something different.";

export async function POST(request: Request) {
  if (!PROFILING) return new NextResponse("Not found", { status: 404 });

  const { day = 45, records = 24, journals = 20, vault = 8, slips = 3 } = (await request
    .json()
    .catch(() => ({}))) as {
    day?: number;
    records?: number;
    journals?: number;
    vault?: number;
    slips?: number;
  };

  const supabase = await createClient();

  const { data: auth, error: authError } = await supabase.auth.signInAnonymously();
  if (authError || !auth.user) {
    return NextResponse.json(
      { error: authError?.message ?? "anonymous sign-in failed" },
      { status: 500 },
    );
  }
  const userId = auth.user.id;

  const startDate = isoDate(daysAgo(day - 1));

  const { data: streak, error: streakError } = await supabase
    .from("streaks")
    .insert({ user_id: userId, start_date: startDate, is_active: true })
    .select("id")
    .single();
  if (streakError || !streak) {
    return NextResponse.json({ error: streakError?.message ?? "streak insert failed" }, { status: 500 });
  }

  const { data: prompts } = await supabase
    .from("journal_prompts")
    .select("id, day_index")
    .lte("day_index", Math.max(journals, 1));
  const promptByDay = new Map((prompts ?? []).map((p) => [p.day_index, p.id]));

  const results = await Promise.all([
    supabase.from("receipts").insert(
      range(records).map((i) => {
        const fact = encryptField(`${RAW_TEXT} (entry ${i + 1})`);
        const feeling = encryptOptionalField("Angry, then just tired.");
        const selfFacing = encryptOptionalField("I ignored this the first three times it happened.");
        return {
          user_id: userId,
          fact_encrypted: fact.ciphertext,
          fact_iv: fact.iv,
          feeling_encrypted: feeling.ciphertext,
          feeling_iv: feeling.iv,
          self_facing_encrypted: selfFacing.ciphertext,
          self_facing_iv: selfFacing.iv,
          occurred_on: isoDate(daysAgo(i)),
          is_raw: i < 3,
        };
      }),
    ),
    supabase.from("journal_entries").insert(
      range(journals).map((i) => {
        const response = encryptOptionalField(
          `Day ${i + 1}. ${RAW_TEXT} Writing it down helps more than I expected it to.`,
        );
        return {
          user_id: userId,
          day_index: i + 1,
          prompt_id: promptByDay.get(i + 1) ?? null,
          response_encrypted: response.ciphertext,
          response_iv: response.iv,
          skipped: i % 7 === 6,
        };
      }),
    ),
    supabase.from("vault_entries").insert(
      range(vault).map((i) => {
        const content = encryptField(`Unsent draft ${i + 1}. ${RAW_TEXT}`);
        return {
          user_id: userId,
          content_encrypted: content.ciphertext,
          content_iv: content.iv,
        };
      }),
    ),
    supabase.from("slip_events").insert(
      range(slips).map((i) => {
        const note = encryptOptionalField(`Texted him. Day ${(i + 1) * 9}.`);
        return {
          streak_id: streak.id,
          user_id: userId,
          occurred_at: `${isoDate(daysAgo(day - (i + 1) * 9))}T12:00:00.000Z`,
          note_encrypted: note.ciphertext,
          note_iv: note.iv,
        };
      }),
    ),
    supabase.from("identity_items").insert([
      { user_id: userId, label: "Bouldering on Tuesdays", category: "hobby" },
      { user_id: userId, label: "Priya", category: "friend" },
      { user_id: userId, label: "Finish the portfolio", category: "goal" },
      { user_id: userId, label: "Funny before 9am", category: "trait" },
    ]),
    supabase
      .from("milestones_reached")
      .insert([3, 7, 14, 21, 30].filter((d) => d <= day).map((d) => ({ user_id: userId, day_number: d }))),
  ]);

  const failures = results.map((r) => r.error?.message).filter(Boolean);
  if (failures.length > 0) {
    return NextResponse.json({ error: "seed failed", failures }, { status: 500 });
  }

  return NextResponse.json({
    userId,
    day,
    startDate,
    seeded: { records, journals, vault, slips },
  });
}

/**
 * Removes a throwaway profiling account. Every table cascades from
 * auth.users, so one delete takes the seeded rows with it - a profiling run
 * shouldn't leave 24 fake Record entries behind in a real database.
 */
export async function DELETE(request: Request) {
  if (!PROFILING) return new NextResponse("Not found", { status: 404 });

  const { userId } = (await request.json()) as { userId?: string };
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: userId });
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}
