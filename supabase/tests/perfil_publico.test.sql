-- Teste do perfil público (qualquer sessão lê a vitrine pelo código; a foto do Google só pra amigo aceito), num
-- Postgres puro com um "Supabase de mentira" (o mesmo do perfil_amigo.test.sql). Não precisa do projeto de verdade nem
-- aplica nada nele. Rodar (pela fila pesada):
--
--   docker run --rm -d --name soccermon-pg -e POSTGRES_PASSWORD=x -p 55432:5432 postgres:17
--   PGPASSWORD=x psql -h localhost -p 55432 -U postgres -v ON_ERROR_STOP=1 -q \
--       -f supabase/tests/perfil_publico.test.sql
--   docker rm -f soccermon-pg
--
-- Qualquer regra quebrada para o script com erro; no fim imprime "ok: perfil público".

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
create schema realtime;
create table realtime.messages (
    topic text, extension text default 'broadcast', event text, payload jsonb, private boolean,
    inserted_at timestamptz default now()
);
alter table realtime.messages enable row level security;
create function realtime.topic() returns text language sql stable as
    $$ select nullif(current_setting('realtime.topic', true), '') $$;
create function realtime.send(payload jsonb, event text, topic text, private boolean) returns void language sql as
    $$ insert into realtime.messages (topic, event, payload, private) values (topic, event, payload, private) $$;
grant usage on schema realtime to authenticated;
grant select on realtime.messages to authenticated;
grant execute on all functions in schema realtime to authenticated;

-- 1 Miguel, 2 Davi, 3 Ana, 4 sessão anônima do duelo, 5 Bia
insert into auth.users
    select ('00000000-0000-0000-0000-00000000000' || i)::uuid from generate_series(1, 5) i;

\ir ../migrations/20261019180000_copa_do_dia_e_liga.sql
\ir ../migrations/20261020120000_amigos.sql
\ir ../migrations/20261021120000_perfil_do_amigo.sql
\ir ../migrations/20261126120000_perfil_publico.sql

create function pg_temp.como(n int, anonimo boolean default false) returns void language plpgsql as $$
begin
    perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-00000000000' || n,
        'is_anonymous', anonimo)::text, false);
end $$;
create function pg_temp.igual(veio text, esperado text, oque text) returns void language plpgsql as $$
begin
    if veio is distinct from esperado then raise exception '%: esperava "%", veio "%"', oque, esperado, veio; end if;
end $$;
grant execute on all functions in schema pg_temp to anon, authenticated;
create table public.codigos (n int primary key, code text);
grant all on public.codigos to authenticated;
create function pg_temp.cod(n int) returns text language sql as $$ select code from public.codigos where codigos.n = $1 $$;
grant execute on function pg_temp.cod(int) to authenticated;

-- 1 Miguel e 2 Davi amigos; Davi usa a foto do Google; Ana usa um sprite; Bia não é amiga de ninguém
set role authenticated;
select pg_temp.como(1);
insert into public.codigos values (1, public.amigos_cartao('Miguel', 'Pallet FC', 'PAL', 'vermelho'));
select pg_temp.como(2);
insert into public.codigos values (2, public.amigos_cartao('Davi', 'Viridian', 'VIR', 'verde'));
select public.amigos_vitrine('{"name":"Davi Souza","avatar":"https://lh3.googleusercontent.com/davi","avatarGoogle":true,
    "trainer":"brock","titleId":"campeao","crestShape":"escudo","showcase":["m:campeao:2"],"numbers":{"titles":3}}');
select status from public.amigos_pedir(pg_temp.cod(1));
select pg_temp.como(3);
insert into public.codigos values (3, public.amigos_cartao('Ana', 'Lavender', 'LAV', 'roxo'));
select public.amigos_vitrine('{"name":"Ana","avatar":"assets/cards/shiny/94.gif","avatarGoogle":false}');
select pg_temp.como(5);
insert into public.codigos values (5, public.amigos_cartao('Bia', 'Cerulean', 'CER', 'azul'));
select pg_temp.como(1);
select public.amigos_responder(pg_temp.cod(2), true);

-- amigo recebe a vitrine inteira, com a foto
select pg_temp.igual(public.perfil_publico(pg_temp.cod(2)) ->> 'avatar', 'https://lh3.googleusercontent.com/davi',
    'amigo vê a foto');
select pg_temp.igual(public.perfil_publico(pg_temp.cod(2)) ->> 'avatarGoogle', 'true', 'amigo: marcado como Google');

-- estranho recebe a vitrine sem a foto e com o nome do cartão público
select pg_temp.como(5);
select pg_temp.igual(public.perfil_publico(lower(pg_temp.cod(2))) -> 'numbers' ->> 'titles', '3',
    'estranho vê os números (código em minúscula)');
select pg_temp.igual(public.perfil_publico(pg_temp.cod(2)) ->> 'trainer', 'brock', 'estranho vê o personagem');
select pg_temp.igual(public.perfil_publico(pg_temp.cod(2)) ->> 'crestShape', 'escudo', 'estranho vê o escudo');
select pg_temp.igual(public.perfil_publico(pg_temp.cod(2)) ->> 'avatar', null, 'estranho não vê a foto');
select pg_temp.igual(public.perfil_publico(pg_temp.cod(2)) ->> 'avatarGoogle', 'false', 'estranho: sem Google');
select pg_temp.igual(public.perfil_publico(pg_temp.cod(2)) ->> 'name', 'Davi', 'estranho vê o nome do cartão');
select pg_temp.igual((public.perfil_publico(pg_temp.cod(2))::text like '%googleusercontent%')::text, 'false',
    'a URL da foto não sai em lugar nenhum');
-- sprite nosso continua
select pg_temp.igual(public.perfil_publico(pg_temp.cod(3)) ->> 'avatar', 'assets/cards/shiny/94.gif',
    'estranho vê o sprite');
-- código que não existe e quem ainda não publicou a vitrine
select pg_temp.igual(public.perfil_publico('ZZZZZZZZ')::text, null, 'código inexistente');
select pg_temp.igual(public.perfil_publico(pg_temp.cod(1))::text, null, 'sem vitrine publicada');

-- a sessão anônima do Duelo lê como estranho
select pg_temp.como(4, true);
select pg_temp.igual(public.perfil_publico(pg_temp.cod(2)) -> 'numbers' ->> 'titles', '3', 'anônimo do Duelo lê');
select pg_temp.igual(public.perfil_publico(pg_temp.cod(2)) ->> 'avatar', null, 'anônimo não vê a foto');

-- quem bloqueou você some
select pg_temp.como(2);
select public.amigos_bloquear(pg_temp.cod(5));
select pg_temp.como(5);
select pg_temp.igual(public.perfil_publico(pg_temp.cod(2))::text, null, 'bloqueado não vê');

-- sem login: token sem sub lê null, e o papel anon nem chama
select set_config('request.jwt.claims', '', false);
select pg_temp.igual(public.perfil_publico(pg_temp.cod(3))::text, null, 'sem sub não lê');
reset role;
set role anon;
do $$ begin
    perform public.perfil_publico('AAAAAAAA');
    raise exception 'anon chamou perfil_publico';
exception when insufficient_privilege then null;
end $$;
reset role;

select 'ok: perfil público' as resultado;
