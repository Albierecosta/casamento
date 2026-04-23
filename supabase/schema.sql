-- ============================================================
-- Casamento SaaS — Supabase schema with RLS
-- Run once in the Supabase SQL editor (or via psql).
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- weddings
-- ============================================================
create table if not exists public.weddings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  couple_name text not null default '',
  bride_name text,
  groom_name text,
  wedding_date date,
  city text,
  ceremony_location text,
  reception_location text,
  initial_budget numeric(12,2) default 0,
  style text,
  estimated_guests int default 0,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists weddings_owner_idx on public.weddings(owner_id);

-- ============================================================
-- guests
-- ============================================================
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  group_type text check (group_type in ('familia','amigos','trabalho','noivo','noiva','outros')) default 'outros',
  rsvp_status text check (rsvp_status in ('pendente','confirmado','recusado')) default 'pendente',
  companions int default 0,
  dietary_restriction text,
  notes text,
  table_number text,
  vip boolean default false,
  invited_by text check (invited_by in ('noivo','noiva','ambos')) default 'ambos',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guests_wedding_idx on public.guests(wedding_id);
create index if not exists guests_status_idx on public.guests(rsvp_status);

-- ============================================================
-- wedding_party_members (padrinhos / madrinhas)
-- ============================================================
create table if not exists public.wedding_party_members (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  phone text,
  role text check (role in ('padrinho','madrinha','daminha','pajem')) default 'padrinho',
  side text check (side in ('noivo','noiva','ambos')) default 'ambos',
  outfit_defined boolean default false,
  gift_defined boolean default false,
  confirmed boolean default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists party_wedding_idx on public.wedding_party_members(wedding_id);

-- ============================================================
-- vendors (fornecedores)
-- ============================================================
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  category text,
  phone text,
  email text,
  instagram text,
  website text,
  estimated_price numeric(12,2) default 0,
  final_price numeric(12,2) default 0,
  negotiation_status text check (negotiation_status in ('pesquisando','em_contato','negociando','fechado','descartado')) default 'pesquisando',
  contract_url text,
  notes text,
  personal_rating int check (personal_rating between 0 and 5) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendors_wedding_idx on public.vendors(wedding_id);

-- ============================================================
-- budget_items
-- ============================================================
create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  title text not null,
  category text not null default 'outros',
  planned_amount numeric(12,2) default 0,
  actual_amount numeric(12,2) default 0,
  down_payment numeric(12,2) default 0,
  installments int default 1,
  installment_amount numeric(12,2) default 0,
  due_date date,
  status text check (status in ('pendente','pago_parcial','pago')) default 'pendente',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists budget_wedding_idx on public.budget_items(wedding_id);
create index if not exists budget_due_idx on public.budget_items(due_date);

-- ============================================================
-- checklist_items
-- ============================================================
create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  title text not null,
  description text,
  phase text check (phase in ('24m','18m','12m','6m','3m','1m','1w','custom')) default 'custom',
  category text,
  priority text check (priority in ('baixa','media','alta')) default 'media',
  status text check (status in ('pendente','em_andamento','concluida')) default 'pendente',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists checklist_wedding_idx on public.checklist_items(wedding_id);
create index if not exists checklist_phase_idx on public.checklist_items(phase);

-- ============================================================
-- Triggers: updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'weddings','guests','wedding_party_members',
      'vendors','budget_items','checklist_items'
    ])
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t
    );
  end loop;
end $$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.weddings enable row level security;
alter table public.guests enable row level security;
alter table public.wedding_party_members enable row level security;
alter table public.vendors enable row level security;
alter table public.budget_items enable row level security;
alter table public.checklist_items enable row level security;

-- weddings: only owner sees and manages
drop policy if exists "weddings_owner_select" on public.weddings;
drop policy if exists "weddings_owner_insert" on public.weddings;
drop policy if exists "weddings_owner_update" on public.weddings;
drop policy if exists "weddings_owner_delete" on public.weddings;

create policy "weddings_owner_select" on public.weddings
  for select using (owner_id = auth.uid());
create policy "weddings_owner_insert" on public.weddings
  for insert with check (owner_id = auth.uid());
create policy "weddings_owner_update" on public.weddings
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "weddings_owner_delete" on public.weddings
  for delete using (owner_id = auth.uid());

-- generic: policy factory for wedding-owned rows
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'guests','wedding_party_members','vendors',
      'budget_items','checklist_items'
    ])
  loop
    execute format('drop policy if exists "%1$s_select" on public.%1$I', t);
    execute format('drop policy if exists "%1$s_insert" on public.%1$I', t);
    execute format('drop policy if exists "%1$s_update" on public.%1$I', t);
    execute format('drop policy if exists "%1$s_delete" on public.%1$I', t);

    execute format($f$
      create policy "%1$s_select" on public.%1$I for select
      using (exists (
        select 1 from public.weddings w
        where w.id = %1$I.wedding_id and w.owner_id = auth.uid()
      ))
    $f$, t);

    execute format($f$
      create policy "%1$s_insert" on public.%1$I for insert
      with check (exists (
        select 1 from public.weddings w
        where w.id = %1$I.wedding_id and w.owner_id = auth.uid()
      ))
    $f$, t);

    execute format($f$
      create policy "%1$s_update" on public.%1$I for update
      using (exists (
        select 1 from public.weddings w
        where w.id = %1$I.wedding_id and w.owner_id = auth.uid()
      ))
      with check (exists (
        select 1 from public.weddings w
        where w.id = %1$I.wedding_id and w.owner_id = auth.uid()
      ))
    $f$, t);

    execute format($f$
      create policy "%1$s_delete" on public.%1$I for delete
      using (exists (
        select 1 from public.weddings w
        where w.id = %1$I.wedding_id and w.owner_id = auth.uid()
      ))
    $f$, t);
  end loop;
end $$;

-- ============================================================
-- Storage bucket for vendor contracts (optional)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do nothing;

drop policy if exists "contracts_owner_select" on storage.objects;
drop policy if exists "contracts_owner_insert" on storage.objects;
drop policy if exists "contracts_owner_update" on storage.objects;
drop policy if exists "contracts_owner_delete" on storage.objects;

create policy "contracts_owner_select" on storage.objects
  for select using (bucket_id = 'contracts' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "contracts_owner_insert" on storage.objects
  for insert with check (bucket_id = 'contracts' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "contracts_owner_update" on storage.objects
  for update using (bucket_id = 'contracts' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "contracts_owner_delete" on storage.objects
  for delete using (bucket_id = 'contracts' and auth.uid()::text = (storage.foldername(name))[1]);
