-- ============================================================
-- Casamento SaaS — Plans & monetization migration
-- Run this AFTER supabase/schema.sql
-- ============================================================

alter table public.weddings
  add column if not exists plan text not null default 'free'
    check (plan in ('free','premium')),
  add column if not exists plan_expires_at timestamptz,
  add column if not exists plan_updated_at timestamptz;

-- Index for fast plan lookup
create index if not exists weddings_plan_idx on public.weddings(plan);

-- ============================================================
-- Admin helper: run this to upgrade a wedding to premium.
-- Replace :wedding_id or use an email lookup.
-- ============================================================
-- Example:
--   update public.weddings
--   set plan = 'premium',
--       plan_expires_at = now() + interval '18 months',
--       plan_updated_at = now()
--   where id = (
--     select w.id from public.weddings w
--     join auth.users u on u.id = w.owner_id
--     where u.email = 'cliente@email.com'
--   );
