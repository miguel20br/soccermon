-- Soccermon 0.10.0: Desafio de Natal comunitário (docs/planos/natal.md, §2.2 e "Plano técnico do desafio comunitário").
-- NÃO aplicar sem o ok do Miguel (o comando está no fim do natal.md).
--
-- De 07/12/2026 a 05/01/2027 (Brasília), os gols de todo mundo somam numa meta só. Só conta Google entra (a sessão
-- anônima do Duelo também é `authenticated`, mas não soma). O jogo manda os gols do jogador ao fim de cada partida
-- terminada pela função natal_gols_somar (SECURITY DEFINER, com teto por partida e por conta por dia); ninguém escreve
-- nas tabelas direto pela API.
--   * natal_gols: uma linha por dia com a soma. Leitura pública (a barra da Home e do Estádio, até sem conta).
--   * natal_marcou: os gols de cada conta por dia. Cada um lê só as próprias linhas ("você marcou N gols" e o
--     "marcou pelo menos 1 gol" que libera os prêmios, que o próprio jogo abre na conta).
-- Apagar a conta leva as linhas dela em natal_marcou (a soma do dia fica: os gols foram marcados).

create table public.natal_gols (
    dia date primary key check (dia between date '2026-12-07' and date '2027-01-05'),
    gols bigint not null default 0 check (gols >= 0)
);

create table public.natal_marcou (
    user_id uuid not null references auth.users (id) on delete cascade,
    dia date not null check (dia between date '2026-12-07' and date '2027-01-05'),
    gols integer not null default 0 check (gols between 0 and 100),
    partidas integer not null default 0 check (partidas between 0 and 200),
    primary key (user_id, dia)
);

alter table public.natal_gols enable row level security;
alter table public.natal_marcou enable row level security;

create policy "natal_gols: leitura pública" on public.natal_gols
    for select to anon, authenticated
    using (true);

create policy "natal_marcou: cada um lê as suas" on public.natal_marcou
    for select to authenticated
    using ((select auth.uid()) = user_id);

-- sem política de escrita: só a função abaixo (SECURITY DEFINER) grava
revoke all on public.natal_gols, public.natal_marcou from anon, authenticated;
grant select on public.natal_gols to anon, authenticated;
grant select on public.natal_marcou to authenticated;
grant select, insert, update, delete on public.natal_gols, public.natal_marcou to service_role;

/**
 * Soma os gols de uma partida terminada. Teto: 15 gols por partida, 100 gols e 200 partidas por conta por dia (o que
 * passa do teto não entra na soma, o resto entra). Fora do prazo ou sem conta Google: erro curto (o jogo ignora).
 * Devolve quantos gols a conta já tem no desafio (o "você marcou N gols").
 */
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
    insert into public.natal_marcou (user_id, dia) values (uid, d) on conflict do nothing;
    -- trava a linha do dia: duas partidas ao mesmo tempo não passam do teto
    select m.gols, m.partidas into atual, jogos
    from public.natal_marcou m
    where m.user_id = uid and m.dia = d
    for update;
    if jogos < 200 then
        g := least(g, 100 - atual);
        update public.natal_marcou
        set gols = gols + g, partidas = partidas + 1
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

revoke execute on function public.natal_gols_somar(integer) from public, anon;
grant execute on function public.natal_gols_somar(integer) to authenticated;
