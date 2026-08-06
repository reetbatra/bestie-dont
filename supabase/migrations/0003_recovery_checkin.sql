-- Recovery check-in: a quiet, non-celebratory touchpoint a few days after a
-- logged slip, closing the gap between it and the next fixed milestone.
alter table public.slip_events add column recovery_seen_at timestamptz;
