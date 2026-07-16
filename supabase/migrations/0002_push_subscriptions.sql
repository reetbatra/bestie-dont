-- ---------------------------------------------------------------------------
-- Applied to production 2026-07-16 (additive only - no existing table
-- touched). Schema for evening web-push check-ins ("You're on day 5.
-- Tonight is the hard part.") sent at each user's chosen risk hour.
-- The feature still needs: VAPID keypair in env (WEB_PUSH_VAPID_PUBLIC_KEY
-- / WEB_PUSH_VAPID_PRIVATE_KEY), a service-worker push handler, and a
-- daily cron route that fans out per timezone.
-- ---------------------------------------------------------------------------

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- one row per browser/device subscription, PushSubscription.toJSON() shape
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  -- her chosen check-in hour, local to her timezone (default 9pm: the
  -- product thesis is that the urge is loudest at night)
  reminder_hour smallint not null default 21 check (reminder_hour between 0 and 23),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions: all own" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
