-- Soccermon 0.10.0: Copa do Dia confere o time e o placar (auditoria do UT de 27/11/2026, C4).
-- Aplicação autorizada pelo Miguel (27/11/2026). Só troca o corpo de copa_dia_partida (mesma assinatura: as
-- permissões ficam); o resto das checagens (ordem, 5 s, 12 h, pênaltis, tamanho) continua igual.
--
-- Antes: aceitava 0 a 30 gols e p_team = {}; 4 chamadas com 30 x 0 punham qualquer um no topo do ranking público.
-- Agora:
--   * time: 5 titulares (lineup) e até 2 no banco (bench), cada um com speciesId inteiro de 1 a 151;
--   * gols por fase: 0 a 20 de cada lado (em 305 partidas reais, o máximo foi 12 pró e 9 contra).
-- O jogo manda o time escalado a cada partida (src/league/sync.ts); erro de time ou placar não é tentado de novo.

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
    if p_gf is null or p_ga is null or p_gf not between 0 and 20 or p_ga not between 0 and 20 then
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
    -- o JSON vem do navegador: nada aqui pode dar erro de cast (o jsonpath só compara número com número)
    if jsonb_typeof(p_team) is distinct from 'object' or pg_column_size(p_team) >= 16384
        or jsonb_typeof(p_team -> 'lineup') is distinct from 'array' or jsonb_array_length(p_team -> 'lineup') <> 5
        or jsonb_typeof(coalesce(p_team -> 'bench', '[]'::jsonb)) is distinct from 'array'
        or jsonb_array_length(coalesce(p_team -> 'bench', '[]'::jsonb)) > 2
        or exists (
            select 1
            from jsonb_array_elements((p_team -> 'lineup') || coalesce(p_team -> 'bench', '[]'::jsonb)) e (m)
            where not (m @? '$.speciesId ? (@.type() == "number" && @ >= 1 && @ <= 151 && @ == @.floor())')
        ) then
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
