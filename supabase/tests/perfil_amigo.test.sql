-- Teste do perfil do amigo (vitrine só pra amigo aceito, ranking da Copa do Dia com os amigos), num Postgres puro
-- com um "Supabase de mentira" (o mesmo do amigos_rls.test.sql). Não precisa do projeto de verdade. Rodar:
--
--   docker run --rm -d --name soccermon-pg -e POSTGRES_PASSWORD=x -p 55432:5432 postgres:17
--   PGPASSWORD=x psql -h localhost -p 55432 -U postgres -v ON_ERROR_STOP=1 -q \
--       -f supabase/tests/perfil_amigo.test.sql
--   docker rm -f soccermon-pg
--
-- Qualquer regra quebrada para o script com erro; no fim imprime "ok: perfil do amigo".

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
-- Realtime: realtime.send grava em realtime.messages; realtime.topic() é o canal que a conexão quer ouvir
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

-- hoje_brasilia() e conta_google() vêm da migração da Copa do Dia (já no ar)
\ir ../migrations/20261019180000_copa_do_dia_e_liga.sql
\ir ../migrations/20261020120000_amigos.sql
\ir ../migrations/20261021120000_perfil_do_amigo.sql

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

-- 1 Miguel e 2 Davi amigos; 3 Ana só pediu pro Miguel; 5 Bia sem nada
set role authenticated;
select pg_temp.como(1);
insert into public.codigos values (1, public.amigos_cartao('Miguel', 'Pallet FC', 'PAL', 'vermelho'));
select public.amigos_vitrine('{"name":"Miguel","numbers":{"titles":3}}');
select pg_temp.como(2);
insert into public.codigos values (2, public.amigos_cartao('Davi', 'Viridian', 'VIR', 'verde'));
select public.amigos_vitrine('{"name":"Davi","avatar":"https://foto.google/davi"}');
select status from public.amigos_pedir((select code from public.codigos where n = 1));
select pg_temp.como(3);
insert into public.codigos values (3, public.amigos_cartao('Ana', 'Lavender', 'LAV', 'roxo'));
select public.amigos_vitrine('{"name":"Ana"}');
select status from public.amigos_pedir((select code from public.codigos where n = 1));
select pg_temp.como(5);
insert into public.codigos values (5, public.amigos_cartao('Bia', 'Cerulean', 'CER', 'azul'));
select pg_temp.como(1);
select public.amigos_responder((select code from public.codigos where n = 2), true);

-- amigo aceito lê a vitrine (com a foto); pedido pendente e estranho não
select pg_temp.igual(public.amigos_perfil((select code from public.codigos where n = 2)) ->> 'avatar',
    'https://foto.google/davi', 'amigo vê a vitrine');
select pg_temp.como(2);
select pg_temp.igual(public.amigos_perfil(lower((select code from public.codigos where n = 1))) -> 'numbers' ->> 'titles',
    '3', 'dos dois lados, com código em minúscula');
select pg_temp.como(1);
select pg_temp.igual(public.amigos_perfil((select code from public.codigos where n = 3))::text, null, 'pedido pendente não vê');
select pg_temp.como(3);
select pg_temp.igual(public.amigos_perfil((select code from public.codigos where n = 1))::text, null, 'quem pediu não vê');
select pg_temp.como(5);
select pg_temp.igual(public.amigos_perfil((select code from public.codigos where n = 2))::text, null, 'estranho não vê');
-- a vitrine só muda a de quem chama
select public.amigos_vitrine('{"name":"invasor"}');
select pg_temp.como(1);
select pg_temp.igual(public.amigos_perfil((select code from public.codigos where n = 2)) ->> 'name', 'Davi',
    'vitrine é só a sua');
-- duelo anônimo não tem amigos
select pg_temp.como(4, true);
do $$ begin
    perform public.amigos_perfil('AAAAAAAA');
    raise exception 'anônimo leu vitrine';
exception when others then
    if sqlerrm <> 'precisa_conta' then raise; end if;
end $$;
reset role;

-- ninguém de fora chama, e a tabela continua fechada
set role anon;
do $$ begin
    perform public.amigos_perfil('AAAAAAAA');
    raise exception 'anon chamou amigos_perfil';
exception when insufficient_privilege then null;
end $$;
reset role;
set role authenticated;
do $$ begin
    perform perfil from public.friend_cards;
    raise exception 'leu friend_cards direto';
exception when insufficient_privilege then null;
end $$;
reset role;
-- vitrine grande demais
set role authenticated;
select pg_temp.como(1);
do $$ begin
    perform public.amigos_vitrine(jsonb_build_object('x', (select string_agg(md5(random()::text), '') from generate_series(1, 2000))));
    raise exception 'aceitou vitrine enorme';
exception when check_violation then null;
end $$;
reset role;

-- ranking da Copa do Dia só com os amigos: Miguel vê ele e o Davi (não a Ana, que só pediu, nem a Bia)
insert into public.daily_runs (user_id, day, trainer, club, club_tag, club_color, engine_version, wins, gf, ga, finished_at)
values
    ('00000000-0000-0000-0000-000000000001', public.hoje_brasilia(), 'Miguel', 'Pallet FC', 'PAL', 'vermelho', 6, 2, 9, 7, now()),
    ('00000000-0000-0000-0000-000000000002', public.hoje_brasilia(), 'Davi', 'Viridian', 'VIR', 'verde', 6, 3, 10, 5, now()),
    ('00000000-0000-0000-0000-000000000003', public.hoje_brasilia(), 'Ana', 'Lavender', 'LAV', 'roxo', 6, 4, 12, 2, now()),
    ('00000000-0000-0000-0000-000000000005', public.hoje_brasilia(), 'Bia', 'Cerulean', 'CER', 'azul', 6, 1, 3, 8, now());
set role authenticated;
select pg_temp.como(1);
select pg_temp.igual((select string_agg(pos || ':' || trainer || ':' || me, ',' order by pos)
    from public.copa_dia_ranking_amigos()), '1:Davi:false,2:Miguel:true', 'ranking dos amigos');
select pg_temp.como(5);
select pg_temp.igual((select string_agg(pos || ':' || trainer, ',') from public.copa_dia_ranking_amigos()),
    '1:Bia', 'sem amigos, só você');
reset role;

select 'ok: perfil do amigo' as resultado;
