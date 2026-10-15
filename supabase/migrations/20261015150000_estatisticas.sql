-- Soccermon 0.8: estatísticas anônimas do jogo (copas, partidas, escolhas do draft, telas).
-- Sem conta, sem e-mail, sem IP: cada evento tem só um id de sessão aleatório (some quando a aba fecha).
-- Visitante e logado podem INSERIR; ninguém lê pela API (só o Miguel, no painel/SQL Editor).

create table public.game_events (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    session text not null check (char_length(session) between 8 and 40),
    name text not null check (name ~ '^[a-z_]{2,32}$'),
    props jsonb not null default '{}'::jsonb check (pg_column_size(props) <= 2048),
    app_version text check (char_length(app_version) <= 16),
    device text check (char_length(device) <= 16)
);

create index game_events_created_at on public.game_events (created_at);
create index game_events_name on public.game_events (name, created_at);

alter table public.game_events enable row level security;

create policy "estatísticas: qualquer um registra" on public.game_events
    for insert to anon, authenticated
    with check (true);

revoke all on public.game_events from anon, authenticated;
grant insert on public.game_events to anon, authenticated;

-- Painel do Miguel: consultas prontas num schema que não sai pela API.
create schema if not exists analytics;
revoke all on schema analytics from anon, authenticated;

create or replace view analytics.por_dia as
select
    date_trunc('day', created_at at time zone 'America/Sao_Paulo')::date as dia,
    count(distinct session) as sessoes,
    count(*) filter (where name = 'run_start') as copas_iniciadas,
    count(*) filter (where name = 'match_end') as partidas,
    count(*) filter (where name = 'run_end' and (props ->> 'champion')::boolean) as titulos,
    count(*) filter (where name = 'login') as logins,
    count(*) filter (where name = 'session_start' and not coalesce((props ->> 'returning')::boolean, false)) as novos
from public.game_events
group by 1
order by 1 desc;

create or replace view analytics.funil as
select
    count(distinct session) as sessoes,
    count(distinct session) filter (where name = 'onboarding_done') as viram_boas_vindas,
    count(distinct session) filter (where name = 'run_start') as comecaram_copa,
    count(distinct session) filter (where name = 'match_end') as jogaram_partida,
    count(distinct session) filter (where name = 'run_end') as terminaram_copa,
    count(distinct session) filter (where name = 'run_end' and (props ->> 'champion')::boolean) as campeoes
from public.game_events
where created_at > now() - interval '30 days';

create or replace view analytics.pokemon_escolhidos as
select
    (props ->> 'species')::int as especie,
    count(*) as escolhas,
    count(*) filter (where (props ->> 'captain')::boolean) as como_capitao
from public.game_events
where name = 'pick'
group by 1
order by escolhas desc;

create or replace view analytics.formacoes as
select props ->> 'formation' as formacao, count(*) as copas
from public.game_events
where name = 'formation'
group by 1
order by copas desc;

create or replace view analytics.fases as
select
    (props ->> 'stage')::int as fase,
    count(*) as partidas,
    round(avg(((props ->> 'won')::boolean)::int) * 100, 1) as pct_vitorias,
    round(avg((props ->> 'gf')::numeric + (props ->> 'ga')::numeric), 2) as gols_por_jogo
from public.game_events
where name = 'match_end'
group by 1
order by 1;

create or replace view analytics.telas as
select props ->> 'screen' as tela, count(*) as visitas, count(distinct session) as sessoes
from public.game_events
where name = 'screen'
group by 1
order by visitas desc;

create or replace view analytics.origem as
select coalesce(props ->> 'ref', 'direto') as origem, props ->> 'device' as aparelho, count(*) as sessoes
from public.game_events
where name = 'session_start'
group by 1, 2
order by sessoes desc;

create or replace view analytics.erros as
select created_at, app_version, device, props ->> 'msg' as erro
from public.game_events
where name = 'error'
order by created_at desc;
