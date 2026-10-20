-- Teste das regras dos amigos (RLS, funções, limites, bloqueio), num Postgres puro com um "Supabase de mentira"
-- (o mesmo do liga_rls.test.sql). Não precisa do projeto de verdade nem aplica nada nele. Rodar:
--
--   docker run --rm -d --name soccermon-pg -e POSTGRES_PASSWORD=x -p 55432:5432 postgres:17
--   PGPASSWORD=x psql -h localhost -p 55432 -U postgres -v ON_ERROR_STOP=1 -q \
--       -f supabase/tests/amigos_rls.test.sql
--   docker rm -f soccermon-pg
--
-- Qualquer regra quebrada para o script com erro; no fim imprime "ok: regras dos amigos".

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

-- quantos avisos o canal de `n` recebeu com este evento (lido como service_role, sem RLS)
create function pg_temp.avisos(n int, ev text) returns int language sql as $$
    select count(*)::int from realtime.messages
    where topic = 'amigos:00000000-0000-0000-0000-00000000000' || n and event = ev
$$;

-- ------------------------------------------------------------------------- ajudantes
create function pg_temp.como(n int, anonimo boolean default false) returns void language plpgsql as $$
begin
    perform set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-00000000000' || n,
        'is_anonymous', anonimo)::text, false);
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
create table public.codigos (n int primary key, code text);
grant all on public.codigos to authenticated;

-- ------------------------------------------------------------------------- cartão e código
set role authenticated;
select pg_temp.como(1);
insert into public.codigos values (1, public.amigos_cartao('Miguel', 'Pallet FC', 'PAL', 'vermelho'));
select pg_temp.como(2);
insert into public.codigos values (2, public.amigos_cartao('Davi', 'Viridian', 'VIR', 'verde'));
select pg_temp.como(3);
insert into public.codigos values (3, public.amigos_cartao('', '', '', 'azul'));
select pg_temp.como(5);
insert into public.codigos values (5, public.amigos_cartao('Bia', 'Cerulean', 'CER', 'azul'));
do $$ begin
    if (select count(*) from public.codigos where code ~ '^[A-HJ-NP-Z2-9]{8}$') <> 4 then
        raise exception 'código fora do formato';
    end if;
end $$;
-- atualizar o nome mantém o código
select pg_temp.como(1);
select pg_temp.igual(public.amigos_cartao('Miguel G.', 'Pallet FC', 'PAL', 'vermelho'),
    (select code from public.codigos where n = 1), 'código mudou ao trocar o nome');

-- anônimo não tem amigos; visitante nem chama
select pg_temp.como(4, true);
select pg_temp.falha($$select public.amigos_cartao('Anon', 'X', 'X', 'azul')$$, 'precisa_conta');
select pg_temp.falha($$select * from public.amigos_lista()$$, 'precisa_conta');
reset role;
select set_config('request.jwt.claims', '', false);
set role anon;
select pg_temp.falha($$select * from public.amigos_lista()$$, 'permissao');
select pg_temp.falha($$select public.amigos_cartao('x', 'x', 'X', 'azul')$$, 'permissao');
reset role;

-- ninguém lê nem escreve as tabelas direto
set role authenticated;
select pg_temp.como(1);
select pg_temp.falha($$select * from public.friend_cards$$, 'permissao');
select pg_temp.falha($$select * from public.friend_links$$, 'permissao');
select pg_temp.falha($$insert into public.friend_links (from_id, to_id) values (auth.uid(),
    '00000000-0000-0000-0000-000000000002')$$, 'permissao');
select pg_temp.falha($$update public.friend_cards set trainer = 'x'$$, 'permissao');
select pg_temp.falha($$select * from public.friend_blocks$$, 'permissao');
-- as ajudantes internas não são chamáveis pelo navegador
select pg_temp.falha($$select public.amigos_id('AAAAAAAA')$$, 'permissao');
select pg_temp.falha($$select public.amigos_avisar(auth.uid(), 'desafio')$$, 'permissao');
select pg_temp.falha($$insert into realtime.messages (topic, event) values ('amigos:x', 'desafio')$$, 'permissao');

-- ------------------------------------------------------------------------- pedido → aceite
select pg_temp.igual((select status from public.amigos_pedir('zzzzzzzz')), 'nao_achei', 'código inexistente');
select pg_temp.igual((select status from public.amigos_pedir((select code from public.codigos where n = 1))),
    'voce_mesmo', 'pedir pra si');
-- Miguel pede pro Davi pelo código (minúsculo e com espaço também vale)
select pg_temp.igual((select status || '/' || trainer from public.amigos_pedir(
    ' ' || lower((select code from public.codigos where n = 2)) || ' ')), 'enviado/Davi', 'pedido');
select pg_temp.igual((select status from public.amigos_pedir((select code from public.codigos where n = 2))),
    'ja_pediu', 'pedido repetido');
select pg_temp.igual((select status from public.amigos_lista()), 'enviado', 'lista de quem pediu');

-- Davi vê o pedido, com o nome público (nunca id nem e-mail) e aceita
select pg_temp.como(2);
do $$
declare r record;
begin
    select * into r from public.amigos_lista();
    if r.status <> 'recebido' or r.trainer <> 'Miguel G.' or r.club <> 'Pallet FC'
        or r.code <> (select code from public.codigos where n = 1) then
        raise exception 'pedido recebido errado: %', row_to_json(r);
    end if;
end $$;
select pg_temp.igual(public.amigos_responder((select code from public.codigos where n = 1), true), 'amigos', 'aceitar');
reset role;
select pg_temp.igual(pg_temp.avisos(2, 'pedido')::text, '1', 'aviso de pedido pro Davi');
select pg_temp.igual(pg_temp.avisos(1, 'amigos')::text, '1', 'aviso de aceite pro Miguel');
-- o aviso leva o nome público e o código, nunca o id da conta
select pg_temp.igual((select payload ->> 'trainer' from realtime.messages where event = 'pedido'), 'Miguel G.', 'nome no aviso');
do $$ begin
    if (select payload::text from realtime.messages where event = 'pedido') like '%00000000-%' then
        raise exception 'aviso vazou o id da conta';
    end if;
end $$;
set role authenticated;
select pg_temp.como(2);
select pg_temp.igual((select status from public.amigos_lista()), 'amigo', 'virou amigo (Davi)');
select pg_temp.como(1);
select pg_temp.igual((select status from public.amigos_lista()), 'amigo', 'virou amigo (Miguel)');
select pg_temp.igual((select status from public.amigos_pedir((select code from public.codigos where n = 2))),
    'ja_amigos', 'pedir pra amigo');

-- Ana não vê nada dos dois
select pg_temp.como(3);
do $$ begin
    if exists (select 1 from public.amigos_lista()) then raise exception 'Ana viu a amizade dos outros'; end if;
end $$;
-- os dois se pedem: vira amizade direto (pedido do rival do Duelo, pelo id que está na sala)
select pg_temp.igual((select status from public.amigos_pedir(p_user => '00000000-0000-0000-0000-000000000005')),
    'enviado', 'pedido pelo duelo');
select pg_temp.como(5);
select pg_temp.igual((select status from public.amigos_pedir((select code from public.codigos where n = 3))),
    'amigos', 'pedido cruzado');
-- conta anônima do duelo não recebe pedido (não tem cartão)
select pg_temp.igual((select status from public.amigos_pedir(p_user => '00000000-0000-0000-0000-000000000004')),
    'nao_achei', 'pedido pra anônimo');

-- recusar: some dos dois lados
select pg_temp.como(5);
select pg_temp.igual((select status from public.amigos_pedir((select code from public.codigos where n = 1))),
    'enviado', 'Bia pede pro Miguel');
select pg_temp.como(1);
select pg_temp.igual(public.amigos_responder((select code from public.codigos where n = 5), false), 'recusado', 'recusar');
select pg_temp.como(5);
do $$ begin
    if exists (select 1 from public.amigos_lista() where trainer = 'Miguel G.') then raise exception 'recusa ficou'; end if;
end $$;

-- ------------------------------------------------------------------------- desafiar
select pg_temp.como(1);
select pg_temp.igual(public.amigos_desafiar((select code from public.codigos where n = 2), 'K7M2QX'), 'enviado', 'desafio');
select pg_temp.igual(public.amigos_desafiar((select code from public.codigos where n = 2), 'K7M2QX'), 'rapido_demais',
    'desafio em sequência');
select pg_temp.igual(public.amigos_desafiar((select code from public.codigos where n = 5), 'K7M2QX'), 'nao_achei',
    'desafiar quem não é amigo');
select pg_temp.igual(public.amigos_desafiar((select code from public.codigos where n = 2), 'abc'), 'sala', 'sala inválida');
select pg_temp.como(2);
select pg_temp.igual((select room from public.amigos_lista()), 'K7M2QX', 'Davi vê o desafio');
-- o aviso na hora chega no canal do Davi, e só ele ouve esse canal
select set_config('realtime.topic', 'amigos:00000000-0000-0000-0000-000000000002', false);
select pg_temp.igual((select payload ->> 'room' from realtime.messages where event = 'desafio'), 'K7M2QX',
    'Davi ouve o desafio');
select pg_temp.como(1);
select pg_temp.igual((select count(*)::text from realtime.messages), '0', 'Miguel não ouve o canal do Davi');
select pg_temp.como(4, true);
select pg_temp.igual((select count(*)::text from realtime.messages), '0', 'anônimo não ouve o canal do Davi');
select set_config('realtime.topic', '', false);
-- online: só amigo vê, e some 150 s depois do último sinal
select pg_temp.como(1);
select public.amigos_ping();
select pg_temp.como(2);
select pg_temp.igual((select online::text from public.amigos_lista() where trainer = 'Miguel G.'), 'true', 'online');
reset role;
update public.friend_cards set seen_at = now() - interval '3 minutes' where trainer = 'Miguel G.';
set role authenticated;
select pg_temp.igual((select online::text from public.amigos_lista() where trainer = 'Miguel G.'), 'false',
    'online vencido');
select pg_temp.como(4, true);
select pg_temp.falha($$select public.amigos_ping()$$, 'precisa_conta');
reset role;
update public.friend_cards set seen_at = now() where trainer = 'Miguel G.';
set role authenticated;
select pg_temp.como(2);
reset role;
update public.friend_challenges set created_at = now() - interval '16 minutes';
set role authenticated;
select pg_temp.igual((select room from public.amigos_lista()), null, 'desafio vencido');

-- ------------------------------------------------------------------------- bloquear (silencioso)
select pg_temp.como(2);
select public.amigos_bloquear((select code from public.codigos where n = 1));
select pg_temp.igual((select status from public.amigos_lista()), 'bloqueado', 'Davi vê o bloqueio');
select pg_temp.como(1);
do $$ begin
    if exists (select 1 from public.amigos_lista()) then raise exception 'amizade ficou depois do bloqueio'; end if;
end $$;
-- Miguel não fica sabendo: o pedido "vai", mas Davi não vê
select pg_temp.igual((select status from public.amigos_pedir((select code from public.codigos where n = 2))),
    'enviado', 'pedido pra quem bloqueou');
reset role;
select pg_temp.igual(pg_temp.avisos(2, 'pedido')::text, '1', 'quem bloqueou não recebe aviso');
set role authenticated;
select pg_temp.como(2);
select pg_temp.igual((select string_agg(status, ',') from public.amigos_lista()), 'bloqueado', 'pedido escondido');
-- bloqueado não aparece online (não é mais amigo)
select pg_temp.igual((select online::text from public.amigos_lista()), 'false', 'bloqueado sem online');
select pg_temp.igual(public.amigos_responder((select code from public.codigos where n = 1), true), 'nao_achei',
    'aceitar pedido de bloqueado');
-- desbloquear: o pedido que estava esperando aparece
select public.amigos_desbloquear((select code from public.codigos where n = 1));
select pg_temp.igual((select status from public.amigos_lista()), 'recebido', 'desbloqueado');
-- remover desfaz dos dois lados
select public.amigos_remover((select code from public.codigos where n = 1));
do $$ begin
    if exists (select 1 from public.amigos_lista()) then raise exception 'remover não limpou'; end if;
end $$;

-- ------------------------------------------------------------------------- limites
reset role;
-- 20 pedidos esperando resposta
insert into auth.users select gen_random_uuid() from generate_series(1, 25);
insert into public.friend_cards (user_id, code, trainer, club, club_tag, club_color)
    select u.id, upper(substr(translate(replace(u.id::text, '-', ''), '0189', 'ABCD'), 1, 8)), 'T', 'C', 'C', 'azul'
    from auth.users u where u.id not in (select user_id from public.friend_cards);
insert into public.friend_links (from_id, to_id)
    select '00000000-0000-0000-0000-000000000003', c.user_id from public.friend_cards c
    where c.trainer = 'T' limit 20;
set role authenticated;
select pg_temp.como(3);
select pg_temp.igual((select status from public.amigos_pedir((select code from public.codigos where n = 1))),
    'limite_pedidos', '20 pedidos esperando');
reset role;
-- 30 pedidos por dia (contando os de código errado)
update public.friend_rate set n = 30;
set role authenticated;
select pg_temp.igual((select status from public.amigos_pedir('ZZZZZZZZ')), 'limite_dia', '30 por dia');
reset role;
-- 100 amigos
delete from public.friend_links where from_id = '00000000-0000-0000-0000-000000000003';
delete from public.friend_rate;
insert into auth.users select gen_random_uuid() from generate_series(1, 100);
insert into public.friend_links (from_id, to_id, status)
    select '00000000-0000-0000-0000-000000000002', u.id, 'accepted' from auth.users u
    where u.id::text not like '00000000-0000-0000-0000-00000000000%' limit 100;
set role authenticated;
select pg_temp.como(1);
select pg_temp.igual((select status from public.amigos_pedir((select code from public.codigos where n = 2))),
    'limite_amigos', 'quem tem 100 amigos não recebe pedido');
reset role;

-- apagar a conta leva tudo junto (LGPD)
delete from auth.users where id = '00000000-0000-0000-0000-000000000002';
do $$ begin
    if exists (select 1 from public.friend_cards where user_id = '00000000-0000-0000-0000-000000000002')
        or exists (select 1 from public.friend_links where '00000000-0000-0000-0000-000000000002' in (from_id, to_id))
        or exists (select 1 from public.friend_blocks where '00000000-0000-0000-0000-000000000002' in (user_id, blocked_id))
    then
        raise exception 'apagar conta não limpou';
    end if;
end $$;

select 'ok: regras dos amigos' as resultado;
