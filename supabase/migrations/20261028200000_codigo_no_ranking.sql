-- Soccermon: o nome no ranking abre o perfil do treinador (pedir amizade, desafiar se já for amigo).
-- Aprovada pelo Miguel e aplicada em produção em 28/10/2026.
--
-- Os rankings (Copa do Dia geral e de amigos, Liga) passam a devolver o código de amigo de cada linha: o mesmo código
-- público que a pessoa já compartilha (friend_cards.code), nunca o id da conta nem o e-mail. Só quem entrou com o
-- Google recebe o código (public.conta_google(); quem não entrou ou está no login anônimo do Duelo vê null), porque
-- só conta Google pede amizade. Quem nunca abriu a versão com amigos não tem cartão: null, e o nome fica só texto.
-- Muda a promessa da tela de Amigos ("ninguém te procura pelo nome"): quem está no ranking pode receber pedido de
-- quem viu o nome lá. Os limites de amigos_pedir (30 por dia, 20 esperando) e o bloquear continuam valendo.
-- A vitrine (amigos_perfil) continua só pra amigo aceito.

-- Mudou o que a função devolve: precisa apagar e criar de novo (e repetir os grants).
drop function public.copa_dia_ranking(date);
drop function public.copa_dia_ranking_amigos(date);
drop function public.liga_ranking(text);

/** Ranking do dia: os 100 primeiros e você (se jogou). Público; o código de amigo só pra conta Google. */
create function public.copa_dia_ranking(p_day date default null)
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
    me boolean,
    squad smallint[],
    captain smallint,
    code text
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
            d.squad, d.captain,
            d.user_id,
            d.finished_at
        from public.daily_runs d
        where d.day = coalesce(p_day, public.hoje_brasilia())
    )
    select r.pos, r.trainer, r.club, r.club_tag, r.club_color, r.wins, r.champion, r.gf, r.ga, r.done, r.me,
        r.squad, r.captain,
        case when public.conta_google() then f.code end
    from r
    left join public.friend_cards f on f.user_id = r.user_id
    where r.pos <= 100 or r.me
    order by r.pos, r.finished_at nulls last
    limit 101
$$;

/** Ranking da Copa do Dia só com você e os seus amigos (mesma ordem do geral). */
create function public.copa_dia_ranking_amigos(p_day date default null)
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
    me boolean,
    squad smallint[],
    captain smallint,
    code text
)
language sql
stable
security definer
set search_path = ''
as $$
    with me as (select public.amigos_conta() as id),
    turma as (
        select me.id as user_id from me
        union
        select case when l.from_id = me.id then l.to_id else l.from_id end
        from public.friend_links l, me
        where l.status = 'accepted' and (l.from_id = me.id or l.to_id = me.id)
    ),
    r as (
        select
            rank() over (order by d.wins desc, d.champion desc, (d.gf - d.ga) desc, d.gf desc) as pos,
            d.trainer, d.club, d.club_tag, d.club_color, d.wins, d.champion, d.gf, d.ga,
            d.finished_at is not null as done,
            d.user_id = (select id from me) as me,
            d.squad, d.captain,
            d.user_id,
            d.finished_at
        from public.daily_runs d
        join turma t on t.user_id = d.user_id
        where d.day = coalesce(p_day, public.hoje_brasilia())
    )
    select r.pos, r.trainer, r.club, r.club_tag, r.club_color, r.wins, r.champion, r.gf, r.ga, r.done, r.me,
        r.squad, r.captain, f.code
    from r
    left join public.friend_cards f on f.user_id = r.user_id
    order by r.pos, r.finished_at nulls last
    limit 101
$$;

/** Ranking da temporada: os 100 primeiros e você. Público; o código de amigo só pra conta Google. */
create function public.liga_ranking(p_season text default null)
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
    me boolean,
    code text
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
            l.user_id = auth.uid() as me,
            l.user_id
        from public.league_ratings l
        join public.league_teams t on t.user_id = l.user_id
        where l.season = coalesce(p_season, to_char(public.hoje_brasilia(), 'YYYY-MM')) and l.games > 0
    )
    select r.pos, r.trainer, r.club, r.club_tag, r.club_color, r.elo, r.games, r.wins, r.losses, r.me,
        case when public.conta_google() then f.code end
    from r
    left join public.friend_cards f on f.user_id = r.user_id
    where r.pos <= 100 or r.me
    order by r.pos
    limit 101
$$;

grant execute on function public.copa_dia_ranking(date) to anon, authenticated;
grant execute on function public.liga_ranking(text) to anon, authenticated;
revoke execute on function public.copa_dia_ranking_amigos(date) from public, anon;
grant execute on function public.copa_dia_ranking_amigos(date) to authenticated;
