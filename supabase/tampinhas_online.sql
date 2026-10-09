-- Tampinhas online: partidas entre jogadores com login e ranking (semana, mês, temporada e geral).
-- A partida só conta no ranking quando os DOIS jogadores informam o mesmo placar.
-- Temporada = trimestre (jan-mar, abr-jun, jul-set, out-dez), no horário de Brasília.

create table if not exists public.tampinhas_jogadores (
  user_id uuid primary key references auth.users on delete cascade,
  nome text not null check (char_length(nome) between 1 and 14),
  updated_at timestamptz not null default now()
);

create table if not exists public.tampinhas_partidas (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{8,40}$'),
  host_id uuid not null references auth.users on delete cascade,
  guest_id uuid not null references auth.users on delete cascade,
  host_gols int check (host_gols between 0 and 99),         -- placar informado pelo dono da sala
  guest_gols int check (guest_gols between 0 and 99),
  g_host_gols int check (g_host_gols between 0 and 99),     -- placar informado pelo convidado
  g_guest_gols int check (g_guest_gols between 0 and 99),
  confirmada boolean not null default false,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  check (host_id <> guest_id)
);
create index if not exists tampinhas_partidas_fim on public.tampinhas_partidas (finished_at) where confirmada;

-- só as funções abaixo leem e escrevem nessas tabelas
alter table public.tampinhas_jogadores enable row level security;
alter table public.tampinhas_partidas enable row level security;

create or replace function public.tampinhas_reportar(p_partida text, p_host uuid, p_guest uuid, p_gols_host int, p_gols_guest int, p_nome text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  r public.tampinhas_partidas;
begin
  if me is null or me not in (p_host, p_guest) or p_host = p_guest then raise exception 'jogador inválido'; end if;
  if p_gols_host not between 0 and 99 or p_gols_guest not between 0 and 99 then raise exception 'placar inválido'; end if;

  if coalesce(char_length(trim(p_nome)), 0) between 1 and 14 then
    insert into public.tampinhas_jogadores (user_id, nome) values (me, trim(p_nome))
    on conflict (user_id) do update set nome = excluded.nome, updated_at = now();
  end if;

  insert into public.tampinhas_partidas (id, host_id, guest_id) values (p_partida, p_host, p_guest)
  on conflict (id) do nothing;
  select * into r from public.tampinhas_partidas where id = p_partida for update;
  if r.host_id <> p_host or r.guest_id <> p_guest or r.confirmada then return r.confirmada; end if;
  if r.created_at < now() - interval '3 hours' then raise exception 'partida expirada'; end if;

  if me = p_host then
    update public.tampinhas_partidas set host_gols = p_gols_host, guest_gols = p_gols_guest where id = p_partida;
  else
    update public.tampinhas_partidas set g_host_gols = p_gols_host, g_guest_gols = p_gols_guest where id = p_partida;
  end if;

  update public.tampinhas_partidas set confirmada = true, finished_at = now()
  where id = p_partida and host_gols = g_host_gols and guest_gols = g_guest_gols
  returning * into r;
  return coalesce(r.confirmada, false);
end $$;

create or replace function public.tampinhas_ranking(p_periodo text)
returns table (pos bigint, user_id uuid, nome text, jogos bigint, vitorias bigint, empates bigint, derrotas bigint, gols_pro bigint, gols_contra bigint)
language sql stable security definer set search_path = ''
as $$
  with lim as (
    select case p_periodo
      when 'semana' then date_trunc('week', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'
      when 'mes' then date_trunc('month', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'
      when 'temporada' then date_trunc('quarter', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'
      else '-infinity'::timestamptz end as desde
  ), j as (
    select p.host_id as uid, p.host_gols as gp, p.guest_gols as gc from public.tampinhas_partidas p, lim where p.confirmada and p.finished_at >= lim.desde
    union all
    select p.guest_id, p.guest_gols, p.host_gols from public.tampinhas_partidas p, lim where p.confirmada and p.finished_at >= lim.desde
  ), t as (
    select uid, count(*) jogos, count(*) filter (where gp > gc) v, count(*) filter (where gp = gc) e, count(*) filter (where gp < gc) d, sum(gp) gp, sum(gc) gc
    from j group by uid
  )
  select rank() over (order by t.v desc, (t.gp - t.gc) desc, t.gp desc), t.uid,
         coalesce(tj.nome, pr.nome, 'Jogador'), t.jogos, t.v, t.e, t.d, t.gp, t.gc
  from t
  left join public.tampinhas_jogadores tj on tj.user_id = t.uid
  left join public.profiles pr on pr.id = t.uid
  order by 1, t.jogos
  limit 100;
$$;

revoke all on function public.tampinhas_reportar(text, uuid, uuid, int, int, text) from public, anon;
grant execute on function public.tampinhas_reportar(text, uuid, uuid, int, int, text) to authenticated;
revoke all on function public.tampinhas_ranking(text) from public;
grant execute on function public.tampinhas_ranking(text) to anon, authenticated;
