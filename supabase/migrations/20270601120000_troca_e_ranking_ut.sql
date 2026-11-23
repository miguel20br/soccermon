-- Soccermon: troca de cartas entre amigos e ranking do Time Ultimate (docs/planos/troca-e-ranking.md).
-- NÃO aplicar sem o ok do Miguel. Nome com data futura (Temporada 2, 01/06/2027) de propósito: o `supabase db push`
-- só aplica na hora de ligar. Precisa da Edge Function `ut` publicada (supabase/functions/ut) e da migração de amigos
-- (20261020120000_amigos.sql). Nada aqui mexe em tabela que já existe.
--
-- Ninguém lê nem escreve estas tabelas pela API (RLS ligado, nenhuma política): tudo passa pela Edge Function `ut`
-- (service_role), que confere cartas e placar. A única leitura pública é o ranking (ut_ranking, SECURITY DEFINER).
-- Apagar a conta leva tudo junto (on delete cascade).

-- ------------------------------------------------------------------------------------------- troca

-- Uma oferta de A para B: "dou esta carta". B aceita escolhendo uma carta dele (give_*); o servidor confere as duas
-- contra os saves da nuvem e fecha. Cada ponta aplica a troca no próprio save na próxima vez que abre o jogo
-- (applied_*): o servidor nunca escreve no save de ninguém.
create table public.ut_trades (
    id uuid primary key default gen_random_uuid(),
    from_id uuid not null references auth.users (id) on delete cascade,
    to_id uuid not null references auth.users (id) on delete cascade,
    season smallint not null,
    status text not null default 'pending' check (status in ('pending', 'done', 'declined', 'cancelled', 'expired')),
    offer_uid text not null check (char_length(offer_uid) between 1 and 80),
    offer_card jsonb not null,
    give_uid text check (give_uid is null or char_length(give_uid) between 1 and 80),
    give_card jsonb,
    created_at timestamptz not null default now(),
    done_at timestamptz,
    applied_from boolean not null default false,
    applied_to boolean not null default false,
    check (from_id <> to_id),
    check (status <> 'done' or (give_uid is not null and give_card is not null and done_at is not null))
);
-- a mesma carta não está em duas ofertas abertas
create unique index ut_trades_offer_aberta on public.ut_trades (from_id, offer_uid) where status = 'pending';
create index ut_trades_to on public.ut_trades (to_id, status);
create index ut_trades_from on public.ut_trades (from_id, status);
-- carta que chegou numa troca só sai de novo depois de TRADE.regiftH (rules em src/store/ultimate/trade.ts)
create index ut_trades_done_give on public.ut_trades (to_id, give_uid) where status = 'done';

-- ------------------------------------------------------------------------------------------- ranking

-- O time inscrito (receita conferida contra o save da nuvem) de cada conta, por temporada.
create table public.ut_rank_teams (
    user_id uuid not null references auth.users (id) on delete cascade,
    season smallint not null,
    team jsonb not null,
    ovr smallint not null,
    trainer text not null check (char_length(trainer) between 1 and 40),
    club text not null check (char_length(club) between 1 and 22),
    club_tag text not null check (char_length(club_tag) between 1 and 3),
    club_color text not null check (char_length(club_color) between 1 and 12),
    updated_at timestamptz not null default now(),
    primary key (user_id, season)
);

-- Uma partida do ranking: o servidor sorteia nível, seed e rival; o navegador só manda as ordens. Resultado refeito
-- aqui, no motor empacotado (mesmo molde da Liga: ADR 0002).
create table public.ut_rank_rounds (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    season smallint not null,
    level text not null check (level in ('facil', 'normal', 'dificil', 'mestre')),
    seed text not null,
    my_team jsonb not null,
    rival_team jsonb not null,
    engine_version integer not null,
    status text not null default 'open' check (status in ('open', 'done', 'abandoned')),
    created_at timestamptz not null default now(),
    started_at timestamptz,
    finished_at timestamptz,
    gf smallint,
    ga smallint,
    shootout jsonb,
    orders jsonb,
    points smallint
);
create unique index ut_rank_rounds_aberta on public.ut_rank_rounds (user_id) where status = 'open';
create index ut_rank_rounds_dia on public.ut_rank_rounds (user_id, created_at);

create table public.ut_ranking (
    user_id uuid not null references auth.users (id) on delete cascade,
    season smallint not null,
    points integer not null default 0,
    games integer not null default 0,
    wins integer not null default 0,
    updated_at timestamptz not null default now(),
    primary key (user_id, season)
);
create index ut_ranking_pontos on public.ut_ranking (season, points desc, wins desc);

alter table public.ut_trades enable row level security;
alter table public.ut_rank_teams enable row level security;
alter table public.ut_rank_rounds enable row level security;
alter table public.ut_ranking enable row level security;
revoke all on public.ut_trades, public.ut_rank_teams, public.ut_rank_rounds, public.ut_ranking from anon, authenticated;
grant select, insert, update, delete on public.ut_trades, public.ut_rank_teams, public.ut_rank_rounds,
    public.ut_ranking to service_role;

-- ------------------------------------------------------------------------------------------- leitura pública

/** Ranking da temporada: os 100 primeiros e você (se jogou). Só nome público e time (ids de espécie), nunca o save. */
create or replace function public.ut_ranking_lista(p_season smallint)
returns table (
    pos bigint,
    trainer text,
    club text,
    club_tag text,
    club_color text,
    points integer,
    games integer,
    wins integer,
    me boolean,
    squad smallint[]
)
language sql
stable
security definer
set search_path = ''
as $$
    with r as (
        select
            rank() over (order by k.points desc, k.wins desc, k.games asc) as pos,
            t.trainer, t.club, t.club_tag, t.club_color, k.points, k.games, k.wins,
            k.user_id = auth.uid() as me,
            (select array_agg((m ->> 'speciesId')::smallint order by i)
               from jsonb_array_elements(t.team -> 'lineup') with ordinality as e (m, i)
              where (m ->> 'speciesId') ~ '^[0-9]{1,4}$') as squad
        from public.ut_ranking k
        join public.ut_rank_teams t on t.user_id = k.user_id and t.season = k.season
        where k.season = p_season
    )
    select r.pos, r.trainer, r.club, r.club_tag, r.club_color, r.points, r.games, r.wins, r.me, r.squad
    from r
    where r.pos <= 100 or r.me
    order by r.pos
    limit 101
$$;

grant execute on function public.ut_ranking_lista(smallint) to anon, authenticated;
