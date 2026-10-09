-- APEX: save da carreira na nuvem (um registro por conta). Cada jogador so le e grava o proprio.
create table if not exists public.apex_data (
  user_id uuid primary key references auth.users on delete cascade,
  career jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.apex_data enable row level security;
create policy "apex_data_select_own" on public.apex_data for select to authenticated using (auth.uid() = user_id);
create policy "apex_data_insert_own" on public.apex_data for insert to authenticated with check (auth.uid() = user_id);
create policy "apex_data_update_own" on public.apex_data for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "apex_data_delete_own" on public.apex_data for delete to authenticated using (auth.uid() = user_id);
