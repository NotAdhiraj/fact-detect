-- Fact Rot Detector: initial schema
-- Hackathon demo: RLS enabled with public read/insert (no auth required)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- docs
-- ---------------------------------------------------------------------------
create table public.docs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.docs enable row level security;

create policy "Public read docs"
  on public.docs
  for select
  to anon, authenticated
  using (true);

create policy "Public insert docs"
  on public.docs
  for insert
  to anon, authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- claims
-- ---------------------------------------------------------------------------
create table public.claims (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid not null references public.docs (id) on delete cascade,
  claim_text text not null,
  status text not null default 'pending'
    check (status in ('confirmed', 'stale', 'unverifiable', 'pending')),
  reasoning text,
  verified_at timestamptz
);

create index claims_doc_id_idx on public.claims (doc_id);
create index claims_status_idx on public.claims (status);

alter table public.claims enable row level security;

create policy "Public read claims"
  on public.claims
  for select
  to anon, authenticated
  using (true);

create policy "Public insert claims"
  on public.claims
  for insert
  to anon, authenticated
  with check (true);

create policy "Public update claims"
  on public.claims
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- flags
-- ---------------------------------------------------------------------------
create table public.flags (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims (id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create index flags_claim_id_idx on public.flags (claim_id);

alter table public.flags enable row level security;

create policy "Public read flags"
  on public.flags
  for select
  to anon, authenticated
  using (true);

create policy "Public insert flags"
  on public.flags
  for insert
  to anon, authenticated
  with check (true);
