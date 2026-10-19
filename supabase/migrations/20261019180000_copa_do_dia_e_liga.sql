-- Soccermon 0.8.x: Copa do Dia (ranking do dia) e Liga ranqueada com times fantasma.
-- Plano e decisões: docs/planos/liga.md. NÃO aplicar sem o ok do Miguel; a Edge Function `liga` sobe junto.
--
-- Quem entra no ranking: só conta Google (a sessão anônima do duelo também é `authenticated`, mas não entra).
-- O que fica público: nome do treinador e do clube (sigla e cor), placar do dia, Elo e divisão. Nada de e-mail, foto
-- ou nome da conta Google. A leitura pública é só pelas funções de ranking (que devolvem só essas colunas); as
-- tabelas mesmo só deixam cada um ler as próprias linhas, e ninguém escreve nelas direto pela API:
--   * Copa do Dia: as funções copa_dia_comecar / copa_dia_partida (SECURITY DEFINER, com as checagens);
--   * Liga: só a Edge Function `liga` (service_role), que refaz cada partida com o motor antes de gravar o Elo.
-- O dia vira à meia-noite de Brasília (America/Sao_Paulo), igual ao jogo (src/store/daily.ts).

-- ------------------------------------------------------------------------------------------- comum

create or replace function public.conta_google()
returns boolean
language sql
stable
set search_path = ''
as $$
    select auth.uid() is not null and not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)
$$;

create or replace function public.hoje_brasilia()
returns date
language sql
stable
set search_path = ''
as $$
    select (now() at time zone 'America/Sao_Paulo')::date
$$;

-- ------------------------------------------------------------------------------------------- Copa do Dia

create table public.daily_runs (
    user_id uuid not null references auth.users (id) on delete cascade,
    day date not null,
    trainer text not null check (char_length(trainer) between 1 and 40),
    club text not null check (char_length(club) between 1 and 22),
    club_tag text not null check (char_length(club_tag) between 1 and 3),
    club_color text not null check (
        club_color in ('vermelho', 'azul', 'verde', 'amarelo', 'laranja', 'roxo', 'rosa', 'ciano', 'vinho', 'grafite')
    ),
    engine_version integer not null check (engine_version between 1 and 100000),
    started_at timestamptz not null default now(),
    last_at timestamptz not null default now(),
    finished_at timestamptz,
    wins smallint not null default 0 check (wins between 0 and 4),
    champion boolean not null default false,
    gf smallint not null default 0 check (gf between 0 and 200),
    ga smallint not null default 0 check (ga between 0 and 200),
    -- cada partida: placar, pênaltis, o time escalado e as ordens (pra refazer a partida numa auditoria)
    matches jsonb not null default '[]'::jsonb check (
        jsonb_typeof(matches) = 'array' and jsonb_array_length(matches) <= 4 and pg_column_size(matches) < 98304
    ),
    primary key (user_id, day)
);

create index daily_runs_ranking on public.daily_runs (day, wins desc, gf desc);

alter table public.daily_runs enable row level security;
create policy "copa do dia: ler a própria" on public.daily_runs
    for select to authenticated
    using ((select auth.uid()) = user_id);
revoke all on public.daily_runs from anon, authenticated;
grant select on public.daily_runs to authenticated;

/**
 * Registra a tentativa de hoje (1 por conta por dia: a chave primária garante). Só quem registrou ao começar entra
 * no ranking: jogar sem rede e mandar depois não vale (senão dava pra tentar várias vezes e mandar a melhor).
 */
create or replace function public.copa_dia_comecar(
    p_trainer text,
    p_club text,
    p_tag text,
    p_color text,
    p_engine integer
)
returns table (day date, seed text)
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_day date := public.hoje_brasilia();
begin
    if not public.conta_google() then
        raise exception 'precisa_conta' using errcode = 'P0001';
    end if;
    insert into public.daily_runs as d (user_id, day, trainer, club, club_tag, club_color, engine_version)
    values (auth.uid(), v_day, left(trim(p_trainer), 40), left(trim(p_club), 22), left(trim(p_tag), 3), p_color, p_engine)
    on conflict on constraint daily_runs_pkey do nothing;
    if not found then
        raise exception 'ja_jogou' using errcode = 'P0001';
    end if;
    return query select v_day, 'dia-' || to_char(v_day, 'YYYYMMDD');
end;
$$;

/**
 * Uma partida da Copa do Dia, na ordem. Checagens de plausibilidade (o motor roda no navegador): fase certa, placar
 * possível (futsal: 0 a 30), empate só com pênaltis, intervalo mínimo entre partidas, tentativa de no máximo 12 h,
 * time e ordens pequenos. O time e as ordens ficam guardados pra auditoria (scripts/liga-auditar.ts refaz a partida).
 */
create or replace function public.copa_dia_partida(
    p_day date,
    p_stage integer,
    p_gf integer,
    p_ga integer,
    p_pen_gf integer,
    p_pen_ga integer,
    p_team jsonb,
    p_orders jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    r public.daily_runs%rowtype;
    v_won boolean;
begin
    if not public.conta_google() then
        raise exception 'precisa_conta' using errcode = 'P0001';
    end if;
    select * into r from public.daily_runs d where d.user_id = auth.uid() and d.day = p_day for update;
    if not found then
        raise exception 'sem_tentativa' using errcode = 'P0001';
    end if;
    if r.finished_at is not null then
        raise exception 'ja_acabou' using errcode = 'P0001';
    end if;
    if now() - r.started_at > interval '12 hours' then
        raise exception 'expirou' using errcode = 'P0001';
    end if;
    if p_stage is distinct from jsonb_array_length(r.matches) or p_stage > 3 then
        raise exception 'fora_de_ordem' using errcode = 'P0001';
    end if;
    if now() - r.last_at < interval '5 seconds' then
        raise exception 'rapido_demais' using errcode = 'P0001';
    end if;
    if p_gf is null or p_ga is null or p_gf not between 0 and 30 or p_ga not between 0 and 30 then
        raise exception 'placar' using errcode = 'P0001';
    end if;
    if p_gf = p_ga then
        if p_pen_gf is null or p_pen_ga is null or p_pen_gf not between 0 and 30 or p_pen_ga not between 0 and 30
            or p_pen_gf = p_pen_ga then
            raise exception 'penaltis' using errcode = 'P0001';
        end if;
    elsif p_pen_gf is not null or p_pen_ga is not null then
        raise exception 'penaltis' using errcode = 'P0001';
    end if;
    if jsonb_typeof(p_team) is distinct from 'object' or pg_column_size(p_team) >= 16384 then
        raise exception 'time' using errcode = 'P0001';
    end if;
    if jsonb_typeof(p_orders) is distinct from 'array' or jsonb_array_length(p_orders) > 80
        or pg_column_size(p_orders) >= 8192 then
        raise exception 'ordens' using errcode = 'P0001';
    end if;
    v_won := p_gf > p_ga or (p_gf = p_ga and p_pen_gf > p_pen_ga);
    update public.daily_runs d set
        matches = d.matches || jsonb_build_array(jsonb_build_object(
            'gf', p_gf, 'ga', p_ga, 'pen', case when p_gf = p_ga then jsonb_build_array(p_pen_gf, p_pen_ga) end,
            'team', p_team, 'orders', p_orders, 'at', now()
        )),
        wins = d.wins + v_won::int,
        gf = d.gf + p_gf,
        ga = d.ga + p_ga,
        last_at = now(),
        champion = v_won and p_stage = 3,
        finished_at = case when not v_won or p_stage = 3 then now() end
    where d.user_id = auth.uid() and d.day = p_day;
end;
$$;

/** Ranking do dia: os 100 primeiros e você (se jogou). Público (visitante também vê), só as colunas do ranking. */
create or replace function public.copa_dia_ranking(p_day date default null)
returns table (
    pos bigint,
    trainer text,
    club text,
    club_tag text,
    club_color text,
    wins smallint,
    champion boolean,
    gf smallint,
    ga smallint,
    done boolean,
    me boolean
)
language sql
stable
security definer
set search_path = ''
as $$
    with r as (
        select
            rank() over (order by d.wins desc, d.champion desc, (d.gf - d.ga) desc, d.gf desc) as pos,
            d.trainer, d.club, d.club_tag, d.club_color, d.wins, d.champion, d.gf, d.ga,
            d.finished_at is not null as done,
            d.user_id = auth.uid() as me,
            d.finished_at
        from public.daily_runs d
        where d.day = coalesce(p_day, public.hoje_brasilia())
    )
    select r.pos, r.trainer, r.club, r.club_tag, r.club_color, r.wins, r.champion, r.gf, r.ga, r.done, r.me
    from r
    where r.pos <= 100 or r.me
    order by r.pos, r.finished_at nulls last
    limit 101
$$;

-- ------------------------------------------------------------------------------------------- Liga

-- O time que cada um inscreveu (receita do time, src/engine/duel-validate.ts): é o fantasma que os outros enfrentam.
create table public.league_teams (
    user_id uuid primary key references auth.users (id) on delete cascade,
    team jsonb not null check (jsonb_typeof(team) = 'object' and pg_column_size(team) < 16384),
    ovr smallint not null check (ovr between 1 and 99),
    trainer text not null check (char_length(trainer) between 1 and 40),
    club text not null check (char_length(club) between 1 and 22),
    club_tag text not null check (char_length(club_tag) between 1 and 3),
    club_color text not null check (
        club_color in ('vermelho', 'azul', 'verde', 'amarelo', 'laranja', 'roxo', 'rosa', 'ciano', 'vinho', 'grafite')
    ),
    engine_version integer not null,
    updated_at timestamptz not null default now()
);

create table public.league_ratings (
    user_id uuid not null references auth.users (id) on delete cascade,
    season text not null check (season ~ '^\d{4}-\d{2}$'),
    elo integer not null check (elo between 0 and 5000),
    peak integer not null check (peak between 0 and 5000),
    games integer not null default 0 check (games >= 0),
    wins integer not null default 0 check (wins >= 0),
    losses integer not null default 0 check (losses >= 0),
    updated_at timestamptz not null default now(),
    primary key (user_id, season)
);

create index league_ratings_ranking on public.league_ratings (season, elo desc);

-- Cada partida contra um fantasma. O servidor sorteia o fantasma (fica esperando, sem prazo, até a pessoa jogar) e só
-- entrega a seed no "Jogar" (started_at): antes disso não dá pra simular em casa e fugir das partidas ruins. Começou e
-- largou por mais de 2 h = derrota. O placar sai do motor na Edge Function (com as ordens do jogador), nunca do navegador.
create table public.league_matches (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    ghost_id uuid references auth.users (id) on delete set null,
    season text not null check (season ~ '^\d{4}-\d{2}$'),
    seed text not null check (char_length(seed) between 8 and 64),
    my_team jsonb not null check (pg_column_size(my_team) < 16384),
    ghost_team jsonb not null check (pg_column_size(ghost_team) < 16384),
    -- como o fantasma aparece (treinador, clube, sigla, cor, nota) no momento da partida
    ghost_info jsonb not null check (pg_column_size(ghost_info) < 1024),
    ghost_elo integer not null,
    elo_before integer not null,
    elo_after integer,
    status text not null default 'open' check (status in ('open', 'done', 'abandoned')),
    gf smallint,
    ga smallint,
    shootout jsonb,
    won boolean,
    orders jsonb check (orders is null or (jsonb_typeof(orders) = 'array' and pg_column_size(orders) < 8192)),
    engine_version integer not null,
    created_at timestamptz not null default now(),
    started_at timestamptz,
    finished_at timestamptz
);

-- 1 partida aberta por vez: recarregar a página devolve a mesma (mesma seed, mesmo fantasma)
create unique index league_matches_one_open on public.league_matches (user_id) where status = 'open';
create index league_matches_user on public.league_matches (user_id, created_at desc);

alter table public.league_teams enable row level security;
alter table public.league_ratings enable row level security;
alter table public.league_matches enable row level security;

create policy "liga: ler o próprio time" on public.league_teams
    for select to authenticated
    using ((select auth.uid()) = user_id);
create policy "liga: ler o próprio elo" on public.league_ratings
    for select to authenticated
    using ((select auth.uid()) = user_id);
create policy "liga: ler as próprias partidas" on public.league_matches
    for select to authenticated
    using ((select auth.uid()) = user_id);

revoke all on public.league_teams, public.league_ratings, public.league_matches from anon, authenticated;
grant select on public.league_teams, public.league_ratings, public.league_matches to authenticated;
-- a Edge Function escreve com a service_role (ignora o RLS); o grant é explícito como nas outras tabelas
grant select, insert, update, delete on public.league_teams, public.league_ratings, public.league_matches to service_role;
grant select, insert, update, delete on public.daily_runs to service_role;

/** Ranking da temporada: os 100 primeiros e você. Público, só as colunas do ranking. */
create or replace function public.liga_ranking(p_season text default null)
returns table (
    pos bigint,
    trainer text,
    club text,
    club_tag text,
    club_color text,
    elo integer,
    games integer,
    wins integer,
    losses integer,
    me boolean
)
language sql
stable
security definer
set search_path = ''
as $$
    with r as (
        select
            rank() over (order by l.elo desc, l.games desc) as pos,
            t.trainer, t.club, t.club_tag, t.club_color, l.elo, l.games, l.wins, l.losses,
            l.user_id = auth.uid() as me
        from public.league_ratings l
        join public.league_teams t on t.user_id = l.user_id
        where l.season = coalesce(p_season, to_char(public.hoje_brasilia(), 'YYYY-MM')) and l.games > 0
    )
    select * from r where r.pos <= 100 or r.me order by r.pos limit 101
$$;

revoke execute on function public.copa_dia_comecar(text, text, text, text, integer) from public, anon;
revoke execute on function public.copa_dia_partida(date, integer, integer, integer, integer, integer, jsonb, jsonb)
    from public, anon;
grant execute on function public.copa_dia_comecar(text, text, text, text, integer) to authenticated;
grant execute on function public.copa_dia_partida(date, integer, integer, integer, integer, integer, jsonb, jsonb)
    to authenticated;
grant execute on function public.copa_dia_ranking(date) to anon, authenticated;
grant execute on function public.liga_ranking(text) to anon, authenticated;

-- ------------------------------------------------------------------------------------------- limpeza

-- O ranking fica; o time e as ordens de cada partida (só pra auditoria) saem depois de 30 dias, a Copa do Dia inteira
-- depois de 12 meses e as partidas da Liga depois de 3 meses (o Elo da temporada continua). A privacidade promete isso.
select cron.schedule(
    'limpar-copa-do-dia-e-liga',
    '30 4 * * *',
    $$
    update public.daily_runs d
        set matches = (select coalesce(jsonb_agg(m - 'team' - 'orders'), '[]'::jsonb) from jsonb_array_elements(d.matches) m)
        where d.day < public.hoje_brasilia() - 30 and d.matches @? '$[*].team';
    delete from public.daily_runs where day < public.hoje_brasilia() - interval '12 months';
    delete from public.league_matches where created_at < now() - interval '3 months';
    $$
);
