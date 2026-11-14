-- Soccermon 0.9.10: o time de cada um no ranking da Copa do Dia (geral e amigos), em ícones.
-- NÃO aplicar sem o ok do Miguel. Não mexe em Edge Function (a `liga` fica como está) nem em copa_dia_partida.
--
-- O servidor já recebe o time a cada partida (matches[].team, via copa_dia_partida), mas a limpeza apaga o time depois
-- de 30 dias e as funções de ranking nunca devolveram nada disso. Aqui ficam guardados só os ids das 5 espécies
-- titulares e a vaga do capitão (0 a 4): número de Pokédex, nada pessoal. Um gatilho preenche as duas colunas sempre
-- que `matches` muda (a função que grava a partida não muda) e o fim do arquivo preenche as linhas que já existem.
-- Linha sem time (partida mandada sem o time, ou limpa antes desta migração) devolve squad nulo: a tela não mostra ícones.

alter table public.daily_runs
    add column squad smallint[] check (squad is null or cardinality(squad) = 5),
    add column captain smallint check (captain is null or captain between 0 and 4);

/**
 * Tira de `matches` o time da última partida que tem 5 titulares válidos (speciesId inteiro de 1 a 2000). O JSON vem do
 * navegador (qualquer um edita): nada aqui pode dar erro de cast, senão a partida deixaria de ser gravada. Sem time
 * válido, deixa as colunas como estão (a limpeza dos 30 dias tira o time de `matches` e o squad continua).
 */
create or replace function public.daily_runs_squad()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    m jsonb;
    ids integer[];
    cap integer;
begin
    for m in
        select e.m from jsonb_array_elements(new.matches) with ordinality as e (m, i) order by e.i desc
    loop
        continue when jsonb_typeof(m -> 'team' -> 'lineup') is distinct from 'array';
        select
            array_agg(case when (l.e ->> 'speciesId') ~ '^[0-9]{1,4}$' and jsonb_typeof(l.e -> 'speciesId') = 'number'
                then (l.e ->> 'speciesId')::integer end order by l.i),
            min(l.i) filter (where l.e ->> 'uid' = m -> 'team' ->> 'captainUid') - 1
        into ids, cap
        from jsonb_array_elements(m -> 'team' -> 'lineup') with ordinality as l (e, i);
        if cardinality(ids) = 5 and not exists (select 1 from unnest(ids) x where x is null or x not between 1 and 2000) then
            new.squad := ids::smallint[];
            new.captain := case when cap between 0 and 4 then cap::smallint end;
            return new;
        end if;
    end loop;
    return new;
end;
$$;

create trigger daily_runs_squad
    before insert or update of matches on public.daily_runs
    for each row execute function public.daily_runs_squad();

-- linhas que já existem (os últimos 30 dias ainda têm o time em matches)
update public.daily_runs set matches = matches where matches @? '$[*].team.lineup';

-- ------------------------------------------------------------------------------------------- rankings

-- Mudou o que a função devolve: precisa apagar e criar de novo (e repetir os grants).
drop function public.copa_dia_ranking(date);
drop function public.copa_dia_ranking_amigos(date);

/** Ranking do dia: os 100 primeiros e você (se jogou). Público, só as colunas do ranking (agora com o time). */
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
    captain smallint
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
            d.finished_at
        from public.daily_runs d
        where d.day = coalesce(p_day, public.hoje_brasilia())
    )
    select r.pos, r.trainer, r.club, r.club_tag, r.club_color, r.wins, r.champion, r.gf, r.ga, r.done, r.me,
        r.squad, r.captain
    from r
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
    captain smallint
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
            d.finished_at
        from public.daily_runs d
        join turma t on t.user_id = d.user_id
        where d.day = coalesce(p_day, public.hoje_brasilia())
    )
    select r.pos, r.trainer, r.club, r.club_tag, r.club_color, r.wins, r.champion, r.gf, r.ga, r.done, r.me,
        r.squad, r.captain
    from r
    order by r.pos, r.finished_at nulls last
    limit 101
$$;

grant execute on function public.copa_dia_ranking(date) to anon, authenticated;
revoke execute on function public.copa_dia_ranking_amigos(date) from public, anon;
grant execute on function public.copa_dia_ranking_amigos(date) to authenticated;
