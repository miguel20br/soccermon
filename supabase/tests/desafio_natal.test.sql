-- Teste das regras do Desafio de Natal (RLS, teto, prazo, só conta Google), num Postgres puro com um "Supabase de
-- mentira" (o mesmo do liga_rls.test.sql). Não precisa do projeto de verdade nem aplica nada nele. Rodar:
--
--   docker run --rm -d --name soccermon-pg -e POSTGRES_PASSWORD=x -p 55432:5432 postgres:17
--   PGPASSWORD=x psql -h localhost -p 55432 -U postgres -v ON_ERROR_STOP=1 -q \
--       -f supabase/tests/desafio_natal.test.sql
--   docker rm -f soccermon-pg
--
-- Qualquer regra quebrada para o script com erro; no fim imprime "ok: regras do Desafio de Natal".

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

insert into auth.users
    select ('00000000-0000-0000-0000-00000000000' || i)::uuid from generate_series(1, 3) i;

-- hoje_brasilia() e conta_google() vêm da migração da Copa do Dia (já no ar)
\ir ../migrations/20261019180000_copa_do_dia_e_liga.sql
\ir ../migrations/20261125120000_desafio_natal.sql

-- o dia de Brasília controlado pelo teste (a função de verdade lê o relógio)
create or replace function public.hoje_brasilia() returns date language sql stable set search_path = '' as
    $$ select current_setting('teste.dia')::date $$;

-- ------------------------------------------------------------------------- ajudantes
create function pg_temp.como(n int, dia text, anonimo boolean default false) returns void language plpgsql as $$
begin
    perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-00000000000' || n,
        'is_anonymous', anonimo)::text, false);
    perform set_config('teste.dia', dia, false);
end $$;
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
create function pg_temp.igual(veio text, esperado text, oque text) returns void language plpgsql as $$
begin
    if veio is distinct from esperado then raise exception '%: esperava "%", veio "%"', oque, esperado, veio; end if;
end $$;
grant execute on all functions in schema pg_temp to anon, authenticated;

-- ------------------------------------------------------------------------- prazo e conta
set role authenticated;
select pg_temp.como(1, '2026-12-06');
select pg_temp.falha('select public.natal_gols_somar(5)', 'fora_do_prazo');
select pg_temp.como(1, '2027-01-06');
select pg_temp.falha('select public.natal_gols_somar(5)', 'fora_do_prazo');
select pg_temp.como(3, '2026-12-07', true);
select pg_temp.falha('select public.natal_gols_somar(5)', 'sem_conta');
reset role;
set role anon;
select pg_temp.como(1, '2026-12-07');
select pg_temp.falha('select public.natal_gols_somar(5)', 'permissao');
reset role;

-- ------------------------------------------------------------------------- soma e teto
set role authenticated;
select pg_temp.como(1, '2026-12-07');
select pg_temp.igual(public.natal_gols_somar(5)::text, '5', 'primeira partida');
select pg_temp.igual(public.natal_gols_somar(999)::text, '35', 'teto de 30 por partida');
select pg_temp.igual(public.natal_gols_somar(-4)::text, '35', 'negativo vira 0');
select public.natal_gols_somar(30) from generate_series(1, 12);
select pg_temp.igual(public.natal_gols_somar(30)::text, '300', 'teto de 300 por conta por dia');
select pg_temp.como(1, '2027-01-05');
select pg_temp.igual(public.natal_gols_somar(7)::text, '307', 'dia novo (o último) soma');
-- ninguém escreve direto nas tabelas
select pg_temp.falha($$insert into public.natal_gols values ('2026-12-08', 999)$$, 'permissao');
select pg_temp.falha('update public.natal_marcou set gols = 0', 'permissao');
select pg_temp.falha('delete from public.natal_gols', 'permissao');

select pg_temp.como(2, '2027-01-05');
select pg_temp.igual(public.natal_gols_somar(3)::text, '3', 'outra conta');
select pg_temp.igual((select string_agg(gols::text, ',') from public.natal_marcou), '3', 'cada um lê só as suas');
reset role;

-- ------------------------------------------------------------------------- leitura pública
set role anon;
select pg_temp.igual(
    (select string_agg(dia || '=' || gols, ',' order by dia) from public.natal_gols),
    '2026-12-07=300,2027-01-05=10',
    'a soma por dia é pública'
);
select pg_temp.falha('select * from public.natal_marcou', 'permissao');
reset role;

select 'ok: regras do Desafio de Natal' as resultado;
