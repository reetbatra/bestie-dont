#!/usr/bin/env node
/**
 * Mints a throwaway session cookie for driving a deployment that does NOT
 * have PROFILE=1 - i.e. real production, where /api/perf/session correctly
 * refuses to exist.
 *
 *   node scripts/perf-session.mjs --day 45 > .perf/session.txt
 *   node scripts/perf-drive.mjs --base https://bestie.reetbatra.com \
 *        --cookie "$(head -1 .perf/session.txt)"
 *   node scripts/perf-session.mjs --delete <userId>
 *
 * The cookie is encoded by @supabase/ssr itself rather than by hand, so it
 * is byte-for-byte what the app writes at sign-in and the deployment cannot
 * tell the difference. Seeded rows are written with the same AES-256-GCM
 * format as src/lib/crypto.ts, so decrypt paths do real work.
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 * ENCRYPTION_MASTER_KEY, and (for --delete) SUPABASE_SERVICE_ROLE_KEY from
 * .env.local. It writes real rows to whatever database those point at, so
 * always delete the user when the run is finished.
 */

import { createCipheriv, randomBytes } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const args = parseArgs(process.argv.slice(2));
const URL_ = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const ANON = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

if (args.delete) {
  await deleteUser(args.delete);
} else {
  await mint(Number(args.day ?? 45));
}

async function mint(day) {
  const jar = new Map();
  const supabase = createServerClient(URL_, ANON, {
    cookies: {
      getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => {
        for (const { name, value } of cookies) jar.set(name, value);
      },
    },
  });

  const { data: auth, error } = await supabase.auth.signInAnonymously();
  if (error || !auth.user) throw new Error(`anonymous sign-in failed: ${error?.message}`);
  const userId = auth.user.id;

  const { data: streak, error: streakError } = await supabase
    .from("streaks")
    .insert({ user_id: userId, start_date: isoDate(daysAgo(day - 1)), is_active: true })
    .select("id")
    .single();
  if (streakError) throw new Error(`streak insert failed: ${streakError.message}`);

  const { data: prompts } = await supabase
    .from("journal_prompts")
    .select("id, day_index")
    .lte("day_index", 20);
  const promptByDay = new Map((prompts ?? []).map((p) => [p.day_index, p.id]));

  const text =
    "He said he needed space and then posted a photo with her four hours later. " +
    "I keep re-reading the last message like it will say something different.";

  const inserts = await Promise.all([
    supabase.from("receipts").insert(
      range(24).map((i) => {
        const fact = encrypt(`${text} (entry ${i + 1})`);
        const feeling = encrypt("Angry, then just tired.");
        const selfFacing = encrypt("I ignored this the first three times it happened.");
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
      range(20).map((i) => {
        const response = encrypt(`Day ${i + 1}. ${text}`);
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
      range(8).map((i) => {
        const content = encrypt(`Unsent draft ${i + 1}. ${text}`);
        return { user_id: userId, content_encrypted: content.ciphertext, content_iv: content.iv };
      }),
    ),
    supabase.from("slip_events").insert(
      range(3).map((i) => {
        const note = encrypt(`Texted him. Day ${(i + 1) * 9}.`);
        return {
          streak_id: streak.id,
          user_id: userId,
          occurred_at: `${isoDate(daysAgo(day - (i + 1) * 9))}T12:00:00.000Z`,
          note_encrypted: note.ciphertext,
          note_iv: note.iv,
        };
      }),
    ),
    supabase
      .from("milestones_reached")
      .insert([3, 7, 14, 21, 30].filter((d) => d <= day).map((d) => ({ user_id: userId, day_number: d }))),
  ]);

  const failed = inserts.map((r) => r.error?.message).filter(Boolean);
  if (failed.length > 0) throw new Error(`seed failed: ${failed.join("; ")}`);

  const cookie = [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
  console.log(cookie);
  console.error(`seeded user ${userId} at day ${day} — delete it with:`);
  console.error(`  node scripts/perf-session.mjs --delete ${userId}`);
}

async function deleteUser(userId) {
  const admin = createClient(URL_, requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(`delete failed: ${error.message}`);
  console.error(`deleted ${userId}`);
}

/** Same AES-256-GCM layout as src/lib/crypto.ts: ciphertext||authTag, base64. */
function encrypt(plaintext) {
  const key = Buffer.from(requireEnv("ENCRYPTION_MASTER_KEY"), "base64");
  if (key.length !== 32) throw new Error("ENCRYPTION_MASTER_KEY must decode to 32 bytes");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ciphertext: Buffer.concat([encrypted, cipher.getAuthTag()]).toString("base64"),
    iv: iv.toString("base64"),
  };
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (expected in .env.local)`);
  return value;
}

function daysAgo(n) {
  return new Date(Date.now() - n * 86_400_000);
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function range(n) {
  return Array.from({ length: n }, (_, i) => i);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) out[argv[i].slice(2)] = argv[++i];
  }
  return out;
}
