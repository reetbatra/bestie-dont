-- Optional 30-day detox extension, offered at the day-60 graduation
-- milestone. Extends the program to day 90 on the same streak - no new
-- start date, no separate tracking, the existing slip system still governs
-- the streak either way.
alter table public.streaks add column is_extended boolean not null default false;
