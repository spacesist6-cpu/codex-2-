create table if not exists public.seteuk_results (
  id uuid primary key default gen_random_uuid(),
  student text not null,
  grade text not null,
  subject text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.seteuk_results enable row level security;
create policy "allow app users to read results" on public.seteuk_results for select using (true);
create policy "allow app users to insert results" on public.seteuk_results for insert with check (true);
