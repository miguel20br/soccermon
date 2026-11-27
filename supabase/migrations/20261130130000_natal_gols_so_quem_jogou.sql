-- Soccermon 0.10.0: Desafio de Natal sem gol de graça (auditoria do UT de 27/11/2026, C5).
-- NÃO aplicar sem o ok do Miguel. Junto da 20261125120000_desafio_natal.sql (depois dela).
--
-- Antes: natal_gols_somar aceitava qualquer chamada (15 gols por vez, 100 por conta por dia) sem partida por trás;
-- 7 chamadas davam os 100 do dia sem jogar. Agora:
--   * no máximo 1 chamada a cada 60 s por conta (natal_marcou.ultimo_em). Antes disso: erro 'rapido_demais', e o jogo
--     guarda os gols e tenta de novo depois de 1 min (src/cloud/desafio.ts);
--   * só soma conta que já jogou: o save na nuvem (public.saves) com partida em copa ou Rota (career.matches) ou no Time
--     Ultimate (ultimate.played), ou Copa do Dia (daily_runs com partida) ou Liga (league_matches). A Liga fica fechada
--     até 12/01, então só ela deixava quem joga Copa, Rota ou UT de fora. Sem isso: erro 'sem_partida', e o jogo não tenta de novo.

alter table public.natal_marcou add column ultimo_em timestamptz;

create or replace function public.natal_gols_somar(p_gols integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    uid uuid := auth.uid();
    d date := public.hoje_brasilia();
    g integer := least(greatest(coalesce(p_gols, 0), 0), 15);
    atual integer;
    jogos integer;
    soma integer;
begin
    if not public.conta_google() then
        raise exception 'sem_conta';
    end if;
    if d < date '2026-12-07' or d > date '2027-01-05' then
        raise exception 'fora_do_prazo';
    end if;
    if not exists (
            select 1 from public.saves s
            where s.user_id = uid
              and (coalesce((s.data #>> '{career,matches}')::numeric, 0) > 0
                   or coalesce((s.data #>> '{ultimate,played}')::numeric, 0) > 0)
        )
        and not exists (select 1 from public.daily_runs r where r.user_id = uid and jsonb_array_length(r.matches) > 0)
        and not exists (select 1 from public.league_matches l where l.user_id = uid) then
        raise exception 'sem_partida';
    end if;
    insert into public.natal_marcou (user_id, dia) values (uid, d) on conflict do nothing;
    -- trava a linha do dia: duas partidas ao mesmo tempo não passam do teto
    select m.gols, m.partidas into atual, jogos
    from public.natal_marcou m
    where m.user_id = uid and m.dia = d
    for update;
    -- 60 s entre chamadas da conta (a linha do dia travada acima: duas abas não passam juntas)
    if exists (
        select 1 from public.natal_marcou m where m.user_id = uid and m.ultimo_em > now() - interval '60 seconds'
    ) then
        raise exception 'rapido_demais';
    end if;
    if jogos < 200 then
        g := least(g, 100 - atual);
        update public.natal_marcou
        set gols = gols + g, partidas = partidas + 1, ultimo_em = now()
        where user_id = uid and dia = d;
        if g > 0 then
            insert into public.natal_gols as n (dia, gols) values (d, g)
            on conflict (dia) do update set gols = n.gols + excluded.gols;
        end if;
    end if;
    select coalesce(sum(m.gols), 0)::integer into soma from public.natal_marcou m where m.user_id = uid;
    return soma;
end;
$$;
