-- Bestie, Don't — initial schema
-- Every table that can name or describe a third party (him) stores ciphertext
-- (AES-GCM, encrypted client-side) plus its IV, never plaintext. Encryption
-- happens in the app before insert; Postgres only ever sees opaque bytes.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  notif_opt_in boolean not null default false,
  has_purchased boolean not null default false,
  purchased_at timestamptz,
  display_name text,
  breakup_date date,
  -- null by default; she can name him in settings if she wants. Encrypted
  -- like everything else that could identify a third party.
  his_name_encrypted text,
  his_name_iv text
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- auto-create a profile row for every new auth user, anonymous or not
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- streaks + slip_events (repair mechanic: a slip never resets the count)
-- ---------------------------------------------------------------------------
create table public.streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  start_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.streaks enable row level security;

create policy "streaks: all own" on public.streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.slip_events (
  id uuid primary key default gen_random_uuid(),
  streak_id uuid not null references public.streaks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  note_encrypted text,
  note_iv text,
  created_at timestamptz not null default now()
);

alter table public.slip_events enable row level security;

create policy "slip_events: all own" on public.slip_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- receipts (the Reality Log)
-- ---------------------------------------------------------------------------
create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fact_encrypted text not null,
  fact_iv text not null,
  feeling_encrypted text,
  feeling_iv text,
  self_facing_encrypted text,
  self_facing_iv text,
  occurred_on date not null,
  is_raw boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.receipts enable row level security;

create policy "receipts: all own" on public.receipts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- vault_entries (unsent drafts, private dump)
-- ---------------------------------------------------------------------------
create table public.vault_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content_encrypted text not null,
  content_iv text not null,
  created_at timestamptz not null default now(),
  resurfaced_at timestamptz,
  still_feel_encrypted text,
  still_feel_iv text
);

alter table public.vault_entries enable row level security;

create policy "vault_entries: all own" on public.vault_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- identity_items ("things that are yours")
-- ---------------------------------------------------------------------------
create table public.identity_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  category text not null check (category in ('hobby', 'friend', 'goal', 'trait')),
  created_at timestamptz not null default now()
);

alter table public.identity_items enable row level security;

create policy "identity_items: all own" on public.identity_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- journal_prompts (static seed content, the 8-week / 56-day arc)
-- ---------------------------------------------------------------------------
create table public.journal_prompts (
  id uuid primary key default gen_random_uuid(),
  arc text not null check (arc in ('stabilize', 'pattern', 'rebuild')),
  day_index int not null unique,
  prompt_text text not null
);

alter table public.journal_prompts enable row level security;

create policy "journal_prompts: readable by anyone signed in" on public.journal_prompts
  for select using (true);

-- ---------------------------------------------------------------------------
-- journal_entries (her responses)
-- ---------------------------------------------------------------------------
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_id uuid references public.journal_prompts (id),
  day_index int not null,
  response_encrypted text,
  response_iv text,
  skipped boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, day_index)
);

alter table public.journal_entries enable row level security;

create policy "journal_entries: all own" on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- milestones_reached
-- ---------------------------------------------------------------------------
create table public.milestones_reached (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day_number int not null,
  celebrated_at timestamptz not null default now(),
  unique (user_id, day_number)
);

alter table public.milestones_reached enable row level security;

create policy "milestones_reached: all own" on public.milestones_reached
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- purchases (Dodo Payments — metadata only, no card data ever lands here)
-- ---------------------------------------------------------------------------
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dodo_payment_id text not null unique,
  amount numeric not null,
  currency text not null,
  status text not null check (status in ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamptz not null default now()
);

alter table public.purchases enable row level security;

create policy "purchases: read own" on public.purchases
  for select using (auth.uid() = user_id);
-- inserts/updates on purchases happen only via the service role from the
-- Dodo webhook handler, so no client-facing insert/update policy exists.

-- ---------------------------------------------------------------------------
-- seed: the 56-day / 8-week journal arc
-- ---------------------------------------------------------------------------
insert into public.journal_prompts (arc, day_index, prompt_text) values
  ('stabilize', 1, 'What did your body feel like today when you thought of him?'),
  ('stabilize', 2, 'Write the text you wanted to send. Now write what you actually needed in that moment.'),
  ('stabilize', 3, 'Who else could have met that need?'),
  ('stabilize', 4, 'Where do you feel the urge to text him — chest, hands, stomach? Describe it like weather.'),
  ('stabilize', 5, 'What time of day is hardest? What''s actually happening in your life at that hour?'),
  ('stabilize', 6, 'Name three things you did today that had nothing to do with him.'),
  ('stabilize', 7, 'What''s the first thing you''d tell a friend going through exactly this?'),
  ('stabilize', 8, 'What did you used to do for fun before this relationship that you haven''t done since?'),
  ('stabilize', 9, 'Name one thing your body needs right now — sleep, water, a walk, quiet — and go do it before you finish this.'),
  ('stabilize', 10, 'What''s a sound, smell, or place that still catches you off guard? Name it so it has less power tomorrow.'),
  ('stabilize', 11, 'If today were a weather report, what would it say?'),
  ('stabilize', 12, 'What''s one text message you''re glad you didn''t send this week?'),
  ('stabilize', 13, 'Who checked in on you today, and did you let them?'),
  ('stabilize', 14, 'Day 14. What''s different about your body now versus day one?'),
  ('pattern', 15, 'When did you first feel this exact anxiety, before him?'),
  ('pattern', 16, 'What did you tolerate that you promised yourself you wouldn''t?'),
  ('pattern', 17, 'What did you make his silence mean about you?'),
  ('pattern', 18, 'Whose approval were you actually chasing when you chased his?'),
  ('pattern', 19, 'What''s a rule you had for yourself early on that quietly disappeared the longer you were together?'),
  ('pattern', 20, 'Describe a moment you shrank yourself to keep the peace. What were you afraid would happen if you didn''t?'),
  ('pattern', 21, 'What did "if he really loved me, he would ___" sound like in your head? Where did you learn that math?'),
  ('pattern', 22, 'Name one thing you apologized for that wasn''t your fault.'),
  ('pattern', 23, 'What does your anxious brain do first when it doesn''t get an immediate reply — to anyone, not just him?'),
  ('pattern', 24, 'Who in your life has earned the anxious version of you, and who hasn''t?'),
  ('pattern', 25, 'What''s the difference between "I miss him" and "I miss being chosen"?'),
  ('pattern', 26, 'Write about a time before this relationship when someone''s silence felt like danger. What happened?'),
  ('pattern', 27, 'What did you learn to perform in this relationship that isn''t actually you?'),
  ('pattern', 28, 'If your attachment style could talk, what would it have said on your worst night with him?'),
  ('pattern', 29, 'What''s one thing you gave up access to — a friend, a hobby, a version of yourself — that you didn''t notice leaving?'),
  ('pattern', 30, 'When did you last feel secure, fully, with no performance required? What made that possible?'),
  ('pattern', 31, 'What''s a boundary you stated once and then let get walked over?'),
  ('pattern', 32, 'Whose voice is in your head when you replay the arguments — his, or someone older?'),
  ('pattern', 33, 'What did you need to hear after a fight that you never got to hear?'),
  ('pattern', 34, 'Name the story you told yourself to make the hard parts make sense.'),
  ('pattern', 35, 'Day 35. Read back your Day 15 answer. What do you know now that you didn''t then?'),
  ('rebuild', 36, 'What does a secure person do when they feel this exact urge?'),
  ('rebuild', 37, 'Write a boundary you''ll hold in the next relationship, and what holding it looks like on a Tuesday.'),
  ('rebuild', 38, 'What''s one thing you like about your life now that couldn''t exist with him in it?'),
  ('rebuild', 39, 'What would you need to see in the first month of dating someone new to feel safe, not just excited?'),
  ('rebuild', 40, 'Name a friend you let down during this relationship. What''s one way to show up for them now?'),
  ('rebuild', 41, 'What''s a compliment about yourself you''d have argued with a year ago, and do you believe it today?'),
  ('rebuild', 42, 'Describe the version of you that existed before this relationship started. What did she know that you forgot?'),
  ('rebuild', 43, 'What''s one thing you want a future partner to never have to teach you, because you already learned it here?'),
  ('rebuild', 44, 'Write the opposite of the anxious thought you have most often. Read it out loud.'),
  ('rebuild', 45, 'What does "enough" feel like in your body, not just your head?'),
  ('rebuild', 46, 'Who are you becoming that has nothing to do with getting over him?'),
  ('rebuild', 47, 'What''s a want you buried because it felt like too much to ask for?'),
  ('rebuild', 48, 'If day 60 arrived tomorrow, what would you want to have already started?'),
  ('rebuild', 49, 'What''s a fear about being alone that turned out to be smaller than you thought?'),
  ('rebuild', 50, 'Name three qualities you''ll actually screen for next time, not just hope for.'),
  ('rebuild', 51, 'What''s something you handled this stretch that old you couldn''t have?'),
  ('rebuild', 52, 'Write a short letter to the version of you on day one. What does she need to know?'),
  ('rebuild', 53, 'What does your life look like on a random Tuesday six months from now, if nothing about it involves him?'),
  ('rebuild', 54, 'What''s one part of this you''re proud of that no one else saw?'),
  ('rebuild', 55, 'What do you want to remember about who you were while you were surviving this?'),
  ('rebuild', 56, 'Day 60 is close. What are you graduating from, and what are you graduating into?');
