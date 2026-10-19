-- Teste das regras (RLS e checagens) da Copa do Dia e da Liga, num Postgres puro com um "Supabase de mentira"
-- (papéis anon/authenticated/service_role, auth.uid() e auth.jwt() lendo request.jwt.claims, cron.schedule vazio).
-- Não precisa do projeto de verdade nem aplica nada nele. Rodar:
--
--   docker run --rm -d --name soccermon-pg -e POSTGRES_PASSWORD=x -p 55432:5432 postgres:17
--   PGPASSWORD=x psql -h localhost -p 55432 -U postgres -v ON_ERROR_STOP=1 -q \
--       -f supabase/tests/liga_rls.test.sql
--   docker rm -f soccermon-pg
--
-- Qualquer regra quebrada para o script com erro; no fim imprime "ok: regras da Copa do Dia e da Liga".

-- ------------------------------------------------------------------------- Supabase de mentira
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt() ->> 'sub')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;
create schema cron;
create function cron.schedule(text, text, text) returns bigint language sql as $$ select 1::bigint $$;
grant usage on schema public to anon, authenticated, service_role;

insert into auth.users values
    ('00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000002'),
    ('00000000-0000-0000-0000-000000000003');

\ir ../migrations/20261019180000_copa_do_dia_e_liga.sql

-- ------------------------------------------------------------------------- ajudantes
create function pg_temp.como(sub text, anonimo boolean default false) returns void language plpgsql as $$
begin
    perform set_config('request.jwt.claims', json_build_object('sub', sub, 'is_anonymous', anonimo)::text, false);
end $$;
-- espera um erro com esta mensagem (ou de permissão, com 'permissao')
create function pg_temp.falha(sql text, esperado text) returns void language plpgsql as $$
begin
    execute sql;
    raise exception 'devia falhar (%): %', esperado, sql;
exception when others then
    if esperado = 'permissao' then
        if sqlstate <> '42501' then raise exception 'esperava permissão negada, veio % (%)', sqlerrm, sql; end if;
    elsif sqlerrm <> esperado then
        raise exception 'esperava "%", veio "%" (%)', esperado, sqlerrm, sql;
    end if;
end $$;
grant execute on all functions in schema pg_temp to anon, authenticated;

-- ------------------------------------------------------------------------- Copa do Dia
-- conta Google 1 começa; a 2ª tentativa no mesmo dia não existe
select pg_temp.como('00000000-0000-0000-0000-000000000001');
set role authenticated;
select * from public.copa_dia_comecar('Miguel', 'Pallet FC', 'PAL', 'vermelho', 12);
select pg_temp.falha($$select public.copa_dia_comecar('Miguel', 'Pallet FC', 'PAL', 'vermelho', 12)$$, 'ja_jogou');
-- ninguém escreve direto na tabela
select pg_temp.falha($$insert into public.daily_runs (user_id, day, trainer, club, club_tag, club_color, engine_version)
    values (auth.uid(), current_date + 1, 'x', 'x', 'X', 'azul', 1)$$, 'permissao');
select pg_temp.falha($$update public.daily_runs set wins = 4$$, 'permissao');
select pg_temp.falha($$delete from public.daily_runs$$, 'permissao');
reset role;

-- sessão anônima do duelo não entra no ranking
select pg_temp.como('00000000-0000-0000-0000-000000000003', true);
set role authenticated;
select pg_temp.falha($$select public.copa_dia_comecar('Anon', 'X', 'XXX', 'azul', 12)$$, 'precisa_conta');
reset role;

-- partidas: rápido demais logo depois de começar, fora de ordem, empate sem pênaltis, placar impossível
select pg_temp.como('00000000-0000-0000-0000-000000000001');
set role authenticated;
select pg_temp.falha($$select public.copa_dia_partida(public.hoje_brasilia(), 0, 3, 1, null, null, '{}', '[]')$$,
    'rapido_demais');
reset role;
update public.daily_runs set last_at = now() - interval '1 minute';
set role authenticated;
select pg_temp.falha($$select public.copa_dia_partida(public.hoje_brasilia(), 1, 3, 1, null, null, '{}', '[]')$$,
    'fora_de_ordem');
select pg_temp.falha($$select public.copa_dia_partida(public.hoje_brasilia(), 0, 2, 2, null, null, '{}', '[]')$$,
    'penaltis');
select pg_temp.falha($$select public.copa_dia_partida(public.hoje_brasilia(), 0, 3, 1, 4, 3, '{}', '[]')$$, 'penaltis');
select pg_temp.falha($$select public.copa_dia_partida(public.hoje_brasilia(), 0, 31, 1, null, null, '{}', '[]')$$,
    'placar');
select pg_temp.falha($$select public.copa_dia_partida(public.hoje_brasilia(), 0, 3, 1, null, null, '[]', '[]')$$, 'time');
select public.copa_dia_partida(public.hoje_brasilia(), 0, 3, 1, null, null, '{"name":"Pallet FC"}',
    '[{"tick":600,"team":0,"tactic":"offensive"}]');
reset role;
update public.daily_runs set last_at = now() - interval '1 minute';
set role authenticated;
-- derrota nos pênaltis fecha a tentativa
select public.copa_dia_partida(public.hoje_brasilia(), 1, 2, 2, 3, 4, '{}', '[]');
reset role;
update public.daily_runs set last_at = now() - interval '1 minute';
set role authenticated;
select pg_temp.falha($$select public.copa_dia_partida(public.hoje_brasilia(), 2, 1, 0, null, null, '{}', '[]')$$,
    'ja_acabou');
do $$
declare r record;
begin
    select * into r from public.daily_runs;
    if r.wins <> 1 or r.gf <> 5 or r.ga <> 3 or r.finished_at is null or r.champion then
        raise exception 'resumo errado: %', row_to_json(r);
    end if;
end $$;
reset role;

-- conta 2: não vê a linha da conta 1 na tabela, mas vê o ranking (só as colunas públicas)
select pg_temp.como('00000000-0000-0000-0000-000000000002');
set role authenticated;
select * from public.copa_dia_comecar('Davi', 'Viridian', 'VIR', 'verde', 12);
do $$
begin
    if (select count(*) from public.daily_runs) <> 1 then raise exception 'RLS: viu a linha de outro'; end if;
    if (select count(*) from public.copa_dia_ranking()) <> 2 then raise exception 'ranking incompleto'; end if;
    if (select trainer from public.copa_dia_ranking() where pos = 1) <> 'Miguel' then raise exception 'ordem'; end if;
    if not (select me from public.copa_dia_ranking() where trainer = 'Davi') then raise exception 'me'; end if;
end $$;
reset role;

-- visitante: lê o ranking, não lê nem escreve tabela, não começa tentativa
select set_config('request.jwt.claims', '', false);
set role anon;
do $$ begin
    if (select count(*) from public.copa_dia_ranking()) <> 2 then raise exception 'visitante não vê o ranking'; end if;
end $$;
select pg_temp.falha($$select * from public.daily_runs$$, 'permissao');
select pg_temp.falha($$select public.copa_dia_comecar('x', 'x', 'X', 'azul', 1)$$, 'permissao');
select pg_temp.falha($$select * from public.league_teams$$, 'permissao');
reset role;

-- ------------------------------------------------------------------------- Liga
-- só a Edge Function (service_role) escreve; cada um lê o próprio
set role service_role;
insert into public.league_teams (user_id, team, ovr, trainer, club, club_tag, club_color, engine_version) values
    ('00000000-0000-0000-0000-000000000001', '{"name":"Pallet FC"}', 70, 'Miguel', 'Pallet FC', 'PAL', 'vermelho', 12),
    ('00000000-0000-0000-0000-000000000002', '{"name":"Viridian"}', 68, 'Davi', 'Viridian', 'VIR', 'verde', 12);
insert into public.league_ratings (user_id, season, elo, peak, games, wins, losses) values
    ('00000000-0000-0000-0000-000000000001', to_char(public.hoje_brasilia(), 'YYYY-MM'), 1040, 1040, 3, 2, 1),
    ('00000000-0000-0000-0000-000000000002', to_char(public.hoje_brasilia(), 'YYYY-MM'), 990, 1000, 1, 0, 1);
insert into public.league_matches (user_id, ghost_id, season, seed, my_team, ghost_team, ghost_info, ghost_elo,
    elo_before, engine_version)
    values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '2026-10', 'seed-12345678',
    '{}', '{}', '{}', 990, 1040, 12);
reset role;
-- 1 partida aberta por vez
set role service_role;
select pg_temp.falha($$insert into public.league_matches (user_id, season, seed, my_team, ghost_team, ghost_info,
    ghost_elo, elo_before, engine_version) values ('00000000-0000-0000-0000-000000000001', '2026-10', 'seed-abcdefgh',
    '{}', '{}', '{}', 1000, 1000, 12)$$,
    'duplicate key value violates unique constraint "league_matches_one_open"');
reset role;

select pg_temp.como('00000000-0000-0000-0000-000000000002');
set role authenticated;
do $$ begin
    if (select count(*) from public.league_teams) <> 1 then raise exception 'RLS: viu time de outro'; end if;
    if (select count(*) from public.league_matches) <> 0 then raise exception 'RLS: viu partida de outro'; end if;
    if (select count(*) from public.liga_ranking()) <> 2 then raise exception 'ranking da liga'; end if;
    if (select trainer from public.liga_ranking() where pos = 1) <> 'Miguel' then raise exception 'ordem da liga'; end if;
end $$;
select pg_temp.falha($$update public.league_ratings set elo = 3000$$, 'permissao');
select pg_temp.falha($$insert into public.league_teams (user_id, team, ovr, trainer, club, club_tag, club_color,
    engine_version) values (auth.uid(), '{}', 99, 'x', 'x', 'X', 'azul', 1)$$, 'permissao');
reset role;

-- apagar a conta leva tudo junto (LGPD), e o fantasma some das partidas dos outros sem quebrar
delete from auth.users where id = '00000000-0000-0000-0000-000000000002';
do $$ begin
    if exists (select 1 from public.daily_runs where user_id = '00000000-0000-0000-0000-000000000002')
        or exists (select 1 from public.league_teams where user_id = '00000000-0000-0000-0000-000000000002')
        or (select ghost_id from public.league_matches) is not null then
        raise exception 'apagar conta não limpou';
    end if;
end $$;

select 'ok: regras da Copa do Dia e da Liga' as resultado;
