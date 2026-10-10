-- Falzinho Games: save na nuvem generico (fg_saves) e ranking geral por jogo (fg_ranking, fg_reportar, fg_top).
-- Ja aplicado no projeto Supabase "masterfut". Guardado aqui como referencia.
create table if not exists public.fg_saves (
  user_id uuid not null references auth.users on delete cascade,
  game text not null check (game ~ '^[a-z0-9-]{2,24}$'),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, game)
);
-- RLS: cada conta le e grava so o proprio save. Ranking: so pelas funcoes fg_reportar (max 100 pts por partida, 1 a cada 20 s) e fg_top.
