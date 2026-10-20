-- Soccermon: perfil do amigo (decidido com o Miguel em 20/10/2026, docs/planos/sala-de-trofeus.md, decisões 6–10).
-- Aplicar só com o ok do Miguel (Supabase de produção).
--
-- Cada um publica a sua vitrine (o mesmo pacote que a sala do Duelo já manda pro rival: avatar, treinador, título,
-- clube, medalhas e cartas da vitrine; mais os números da carreira e os últimos títulos). Só amigo aceito lê.
-- A foto do Google, quando a pessoa escolheu ela de avatar, vai dentro da vitrine: fora do Duelo, só os amigos veem.
-- O jogo valida cada campo ao mostrar (é dado escrito pelo próprio jogador, como o peer do Duelo).
-- Ranking da Copa do Dia só com amigos: a mesma conta do ranking geral, só com você e os seus amigos.

alter table public.friend_cards
    add column perfil jsonb check (perfil is null or (jsonb_typeof(perfil) = 'object' and pg_column_size(perfil) < 16384));

/** Publica a sua vitrine (o jogo chama quando ela muda). */
create or replace function public.amigos_vitrine(p_perfil jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
    update public.friend_cards c set perfil = p_perfil where c.user_id = public.amigos_conta()
$$;

/** A vitrine de um amigo pelo código. Quem não é amigo aceito (ou não publicou) recebe null. */
create or replace function public.amigos_perfil(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
    select c.perfil
    from public.friend_cards c
    where c.code = upper(trim(p_code))
        and exists (
            select 1 from public.friend_links l
            where l.status = 'accepted'
                and ((l.from_id = public.amigos_conta() and l.to_id = c.user_id)
                    or (l.from_id = c.user_id and l.to_id = public.amigos_conta()))
        )
$$;

/** Ranking da Copa do Dia só com você e os seus amigos (mesma ordem do geral). */
create or replace function public.copa_dia_ranking_amigos(p_day date default null)
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
            d.finished_at
        from public.daily_runs d
        join turma t on t.user_id = d.user_id
        where d.day = coalesce(p_day, public.hoje_brasilia())
    )
    select r.pos, r.trainer, r.club, r.club_tag, r.club_color, r.wins, r.champion, r.gf, r.ga, r.done, r.me
    from r
    order by r.pos, r.finished_at nulls last
    limit 101
$$;

revoke execute on function public.amigos_vitrine(jsonb), public.amigos_perfil(text),
    public.copa_dia_ranking_amigos(date) from public, anon;
grant execute on function public.amigos_vitrine(jsonb), public.amigos_perfil(text),
    public.copa_dia_ranking_amigos(date) to authenticated;
