-- Soccermon: amigos (código de amigo, pedido → aceite, lista, desafiar pro Duelo, remover e bloquear).
-- Proposta e decisões: docs/planos/amigos.md. NÃO aplicar sem o ok do Miguel.
--
-- Só conta Google (a sessão anônima do duelo não tem amigos). Sem chat: o único texto que passa entre duas pessoas é o
-- nome do treinador e do clube (os mesmos do ranking) e o código da sala do Duelo.
-- Ninguém lê nem escreve as tabelas direto pela API (RLS ligado e nenhuma política = nega tudo): tudo passa pelas
-- funções abaixo (SECURITY DEFINER), que só mexem nas linhas de quem chama (auth.uid()) e só devolvem colunas
-- públicas. O identificador que o navegador vê é o código de amigo, nunca o id da conta nem o e-mail.
-- Bloqueio é silencioso: quem foi bloqueado não fica sabendo (o pedido dele "vai", mas nunca aparece pro outro).
-- Apagar a conta leva tudo junto (on delete cascade).
--
-- Online e avisos na hora (decididos com o Miguel em 19/10):
--   * "online" = o jogo aberto e visível nos últimos 150 s (amigos_ping a cada 60 s). Só os amigos aceitos veem.
--     Não usa Presence do Realtime: num canal comum todo mundo veria todo mundo (e cada entrada/saída vira mensagem pra
--     todos), e um canal por amigo bate no limite de canais por conexão. O ponto verde vem junto da lista.
--   * avisos (pedido, amizade aceita, desafio pro Duelo) saem do banco pelo Realtime Broadcast (realtime.send) no
--     canal privado `amigos:<id da conta>`, que só o dono ouve (política em realtime.messages). Ninguém escreve
--     nesse canal pelo navegador: só as funções daqui.

-- ------------------------------------------------------------------------------------------- tabelas

-- O cartão público de cada um: o código de amigo e o nome que os amigos veem (o jogo atualiza ao mudar o Perfil).
create table public.friend_cards (
    user_id uuid primary key references auth.users (id) on delete cascade,
    -- 8 letras/números sem I, O, 0 e 1 (mesmo alfabeto da sala do Duelo): 32^8 ≈ 1 trilhão, não dá pra chutar
    code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
    trainer text not null check (char_length(trainer) between 1 and 40),
    club text not null check (char_length(club) between 1 and 22),
    club_tag text not null check (char_length(club_tag) between 1 and 3),
    club_color text not null check (
        club_color in ('vermelho', 'azul', 'verde', 'amarelo', 'laranja', 'roxo', 'rosa', 'ciano', 'vinho', 'grafite')
    ),
    updated_at timestamptz not null default now(),
    -- última vez que o jogo dele estava aberto (amigos_ping); os amigos veem "online" até 150 s depois
    seen_at timestamptz
);

-- Pedido (pending) ou amizade (accepted). Um par só tem uma linha, não importa quem pediu.
create table public.friend_links (
    from_id uuid not null references auth.users (id) on delete cascade,
    to_id uuid not null references auth.users (id) on delete cascade,
    status text not null default 'pending' check (status in ('pending', 'accepted')),
    created_at timestamptz not null default now(),
    accepted_at timestamptz,
    primary key (from_id, to_id),
    check (from_id <> to_id)
);
create unique index friend_links_par on public.friend_links (least(from_id, to_id), greatest(from_id, to_id));
create index friend_links_to on public.friend_links (to_id);

create table public.friend_blocks (
    user_id uuid not null references auth.users (id) on delete cascade,
    blocked_id uuid not null references auth.users (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, blocked_id),
    check (user_id <> blocked_id)
);

-- Desafio: "venha pra minha sala do Duelo". Vale 15 minutos (a sala do Realtime some quando os dois saem).
create table public.friend_challenges (
    from_id uuid not null references auth.users (id) on delete cascade,
    to_id uuid not null references auth.users (id) on delete cascade,
    room text not null check (room ~ '^[A-HJ-NP-Z2-9]{6}$'),
    created_at timestamptz not null default now(),
    primary key (from_id, to_id)
);
create index friend_challenges_to on public.friend_challenges (to_id);

-- Quantos pedidos cada um fez no dia (inclusive os de código errado): limite contra spam e contra chutar códigos.
create table public.friend_rate (
    user_id uuid not null references auth.users (id) on delete cascade,
    day date not null,
    n integer not null default 0,
    primary key (user_id, day)
);

alter table public.friend_cards enable row level security;
alter table public.friend_links enable row level security;
alter table public.friend_blocks enable row level security;
alter table public.friend_challenges enable row level security;
alter table public.friend_rate enable row level security;
revoke all on public.friend_cards, public.friend_links, public.friend_blocks, public.friend_challenges,
    public.friend_rate from anon, authenticated;
grant select, insert, update, delete on public.friend_cards, public.friend_links, public.friend_blocks,
    public.friend_challenges, public.friend_rate to service_role;

-- ------------------------------------------------------------------------------------------- funções

-- Limites (docs/planos/amigos.md, "Anti-abuso"): mudar aqui e no texto do plano.
--   100 amigos · 20 pedidos esperando resposta · 30 pedidos por dia · desafio a cada 10 s pro mesmo amigo

/** Exige conta Google (a do duelo anônimo não serve). Mesma regra de public.conta_google(), da Copa do Dia. */
create or replace function public.amigos_conta()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
begin
    if auth.uid() is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
        raise exception 'precisa_conta' using errcode = 'P0001';
    end if;
    return auth.uid();
end;
$$;

/**
 * Cria ou atualiza o seu cartão (nome do treinador e clube que os amigos veem) e devolve o seu código de amigo.
 * O jogo chama ao entrar com o Google e ao mudar o Perfil.
 */
create or replace function public.amigos_cartao(p_trainer text, p_club text, p_tag text, p_color text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_me uuid := public.amigos_conta();
    v_code text;
    v_try int := 0;
begin
    update public.friend_cards c set
        trainer = coalesce(nullif(left(trim(p_trainer), 40), ''), 'Treinador'),
        club = coalesce(nullif(left(trim(p_club), 22), ''), 'Pallet FC'),
        club_tag = coalesce(nullif(left(trim(p_tag), 3), ''), 'PAL'),
        club_color = p_color,
        updated_at = now()
    where c.user_id = v_me
    returning c.code into v_code;
    if found then
        return v_code;
    end if;
    loop
        -- gen_random_uuid() usa o sorteio forte do Postgres; 256 é múltiplo de 32, então nenhuma letra sai mais
        v_code := (
            select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + get_byte(b, i) % 32, 1), '' order by i)
            from (select uuid_send(gen_random_uuid()) as b) r, generate_series(0, 7) i
        );
        begin
            insert into public.friend_cards (user_id, code, trainer, club, club_tag, club_color)
            values (
                v_me, v_code,
                coalesce(nullif(left(trim(p_trainer), 40), ''), 'Treinador'),
                coalesce(nullif(left(trim(p_club), 22), ''), 'Pallet FC'),
                coalesce(nullif(left(trim(p_tag), 3), ''), 'PAL'),
                p_color
            );
            return v_code;
        exception when unique_violation then
            v_try := v_try + 1;
            if v_try > 5 then raise; end if;
        end;
    end loop;
end;
$$;

/** Quantos amigos (aceitos) a conta tem. */
create or replace function public.amigos_total(p_user uuid)
returns int
language sql
stable
set search_path = ''
as $$
    select count(*)::int from public.friend_links l
    where l.status = 'accepted' and (l.from_id = p_user or l.to_id = p_user)
$$;

/**
 * Aviso na hora pro outro jogador, no canal privado dele (`amigos:<id>`): quem mandou (código e nome público, nunca
 * o id) + `p_extra`. Se o Realtime falhar, a ação continua (a lista mostra tudo na próxima atualização).
 */
create or replace function public.amigos_avisar(p_to uuid, p_event text, p_extra jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    perform realtime.send(
        (select jsonb_build_object('code', c.code, 'trainer', c.trainer, 'club', c.club, 'club_tag', c.club_tag,
            'club_color', c.club_color) from public.friend_cards c where c.user_id = auth.uid()) || p_extra,
        p_event,
        'amigos:' || p_to::text,
        true
    );
exception when others then
    null;
end;
$$;

/** "Estou com o jogo aberto": o jogo chama a cada 60 s com a aba visível. Os amigos veem online por 150 s. */
create or replace function public.amigos_ping()
returns void
language sql
security definer
set search_path = ''
as $$
    update public.friend_cards c set seen_at = now() where c.user_id = public.amigos_conta()
$$;

/**
 * Pede amizade pelo código de amigo (`p_code`) ou pelo rival do Duelo (`p_user`, o id que já está na sala).
 * Devolve um status em vez de erro (o contador do dia não pode voltar atrás num erro):
 *   enviado · amigos (ele já tinha te pedido: viram amigos) · ja_amigos · ja_pediu · nao_achei · voce_mesmo ·
 *   limite_dia · limite_pedidos · limite_amigos
 * Quem te bloqueou recebe o pedido "enviado", mas ele nunca aparece pra ele (bloqueio silencioso).
 */
create or replace function public.amigos_pedir(p_code text default null, p_user uuid default null)
returns table (status text, trainer text, club text, club_tag text, club_color text)
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_me uuid := public.amigos_conta();
    v_n int;
    c public.friend_cards%rowtype;
    l public.friend_links%rowtype;
begin
    insert into public.friend_rate as r (user_id, day, n) values (v_me, public.hoje_brasilia(), 1)
    on conflict (user_id, day) do update set n = r.n + 1
    returning r.n into v_n;
    if v_n > 30 then
        return query select 'limite_dia', null::text, null::text, null::text, null::text;
        return;
    end if;

    if p_user is not null then
        select * into c from public.friend_cards f where f.user_id = p_user;
    else
        select * into c from public.friend_cards f where f.code = upper(trim(p_code));
    end if;
    if not found then
        return query select 'nao_achei', null::text, null::text, null::text, null::text;
        return;
    end if;
    if c.user_id = v_me then
        return query select 'voce_mesmo', null::text, null::text, null::text, null::text;
        return;
    end if;

    select * into l from public.friend_links f
    where (f.from_id = v_me and f.to_id = c.user_id) or (f.from_id = c.user_id and f.to_id = v_me);
    if found then
        if l.status = 'accepted' then
            return query select 'ja_amigos', c.trainer, c.club, c.club_tag, c.club_color;
            return;
        end if;
        if l.from_id = v_me then
            return query select 'ja_pediu', c.trainer, c.club, c.club_tag, c.club_color;
            return;
        end if;
        -- ele já tinha pedido: os dois querem, viram amigos (se eu tinha bloqueado ele, pedir de volta desbloqueia)
        if public.amigos_total(v_me) >= 100 or public.amigos_total(c.user_id) >= 100 then
            return query select 'limite_amigos', c.trainer, c.club, c.club_tag, c.club_color;
            return;
        end if;
        delete from public.friend_blocks b where b.user_id = v_me and b.blocked_id = c.user_id;
        update public.friend_links f set status = 'accepted', accepted_at = now()
        where f.from_id = c.user_id and f.to_id = v_me;
        perform public.amigos_avisar(c.user_id, 'amigos');
        return query select 'amigos', c.trainer, c.club, c.club_tag, c.club_color;
        return;
    end if;

    if public.amigos_total(v_me) >= 100 or public.amigos_total(c.user_id) >= 100 then
        return query select 'limite_amigos', c.trainer, c.club, c.club_tag, c.club_color;
        return;
    end if;
    if (select count(*) from public.friend_links f where f.from_id = v_me and f.status = 'pending') >= 20 then
        return query select 'limite_pedidos', c.trainer, c.club, c.club_tag, c.club_color;
        return;
    end if;
    -- pedir pra quem eu bloqueei desbloqueia
    delete from public.friend_blocks b where b.user_id = v_me and b.blocked_id = c.user_id;
    insert into public.friend_links (from_id, to_id) values (v_me, c.user_id);
    -- quem me bloqueou não recebe aviso (o pedido fica escondido pra ele)
    if not exists (select 1 from public.friend_blocks b where b.user_id = c.user_id and b.blocked_id = v_me) then
        perform public.amigos_avisar(c.user_id, 'pedido');
    end if;
    return query select 'enviado', c.trainer, c.club, c.club_tag, c.club_color;
end;
$$;

/** Quem é o dono do código, se ele tem algo comigo ou não (nunca devolve o id pra fora). */
create or replace function public.amigos_id(p_code text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
    select f.user_id from public.friend_cards f where f.code = upper(trim(p_code))
$$;

/** Aceitar ou recusar um pedido recebido. Recusar não avisa ninguém (o pedido some). */
create or replace function public.amigos_responder(p_code text, p_aceitar boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_me uuid := public.amigos_conta();
    v_other uuid := public.amigos_id(p_code);
begin
    if v_other is null
        or not exists (select 1 from public.friend_links f where f.from_id = v_other and f.to_id = v_me
            and f.status = 'pending')
        or exists (select 1 from public.friend_blocks b where b.user_id = v_me and b.blocked_id = v_other) then
        return 'nao_achei';
    end if;
    if not p_aceitar then
        delete from public.friend_links f where f.from_id = v_other and f.to_id = v_me;
        return 'recusado';
    end if;
    if public.amigos_total(v_me) >= 100 or public.amigos_total(v_other) >= 100 then
        return 'limite_amigos';
    end if;
    update public.friend_links f set status = 'accepted', accepted_at = now()
    where f.from_id = v_other and f.to_id = v_me;
    perform public.amigos_avisar(v_other, 'amigos');
    return 'amigos';
end;
$$;

/** Desfaz a amizade ou cancela/recusa o pedido, dos dois lados. O outro não é avisado (só some da lista dele). */
create or replace function public.amigos_remover(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_me uuid := public.amigos_conta();
    v_other uuid := public.amigos_id(p_code);
begin
    delete from public.friend_links f
    where (f.from_id = v_me and f.to_id = v_other) or (f.from_id = v_other and f.to_id = v_me);
    delete from public.friend_challenges f
    where (f.from_id = v_me and f.to_id = v_other) or (f.from_id = v_other and f.to_id = v_me);
end;
$$;

/** Bloqueia: desfaz a amizade, apaga desafios, e os pedidos novos dele nunca aparecem. Silencioso. */
create or replace function public.amigos_bloquear(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_me uuid := public.amigos_conta();
    v_other uuid := public.amigos_id(p_code);
begin
    if v_other is null or v_other = v_me then
        return;
    end if;
    perform public.amigos_remover(p_code);
    insert into public.friend_blocks (user_id, blocked_id) values (v_me, v_other) on conflict do nothing;
end;
$$;

create or replace function public.amigos_desbloquear(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_me uuid := public.amigos_conta();
begin
    delete from public.friend_blocks b where b.user_id = v_me and b.blocked_id = public.amigos_id(p_code);
end;
$$;

/** Chama um amigo pra sua sala do Duelo: aviso na hora (Realtime) e na lista e na Home por 15 minutos. */
create or replace function public.amigos_desafiar(p_code text, p_room text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_me uuid := public.amigos_conta();
    v_other uuid := public.amigos_id(p_code);
begin
    if p_room is null or p_room !~ '^[A-HJ-NP-Z2-9]{6}$' then
        return 'sala';
    end if;
    if v_other is null or not exists (
        select 1 from public.friend_links f where f.status = 'accepted'
            and ((f.from_id = v_me and f.to_id = v_other) or (f.from_id = v_other and f.to_id = v_me))
    ) then
        return 'nao_achei';
    end if;
    if exists (select 1 from public.friend_challenges f where f.from_id = v_me and f.to_id = v_other
        and f.created_at > now() - interval '10 seconds') then
        return 'rapido_demais';
    end if;
    insert into public.friend_challenges as f (from_id, to_id, room) values (v_me, v_other, p_room)
    on conflict (from_id, to_id) do update set room = excluded.room, created_at = now();
    perform public.amigos_avisar(v_other, 'desafio', jsonb_build_object('room', p_room));
    return 'enviado';
end;
$$;

/**
 * Sua lista: amigos, pedidos recebidos e enviados, e quem você bloqueou. Só colunas públicas (código, treinador,
 * clube). `room` = a sala do Duelo pra onde esse amigo te chamou nos últimos 15 minutos. `online` só pros amigos.
 * Pedido de quem você bloqueou não aparece.
 */
create or replace function public.amigos_lista()
returns table (
    code text,
    trainer text,
    club text,
    club_tag text,
    club_color text,
    status text,
    since timestamptz,
    room text,
    room_at timestamptz,
    online boolean
)
language sql
stable
security definer
set search_path = ''
as $$
    with me as (select public.amigos_conta() as id),
    rel as (
        select
            case when l.from_id = me.id then l.to_id else l.from_id end as other,
            case
                when l.status = 'accepted' then 'amigo'
                when l.from_id = me.id then 'enviado'
                else 'recebido'
            end as status,
            coalesce(l.accepted_at, l.created_at) as since
        from public.friend_links l, me
        where l.from_id = me.id or l.to_id = me.id
        union all
        select b.blocked_id, 'bloqueado', b.created_at from public.friend_blocks b, me where b.user_id = me.id
    )
    select c.code, c.trainer, c.club, c.club_tag, c.club_color, rel.status, rel.since, ch.room, ch.created_at,
        rel.status = 'amigo' and coalesce(c.seen_at > now() - interval '150 seconds', false)
    from rel
    join public.friend_cards c on c.user_id = rel.other
    cross join me
    left join public.friend_challenges ch
        on rel.status = 'amigo' and ch.from_id = rel.other and ch.to_id = me.id
        and ch.created_at > now() - interval '15 minutes'
    where not (rel.status = 'recebido'
        and exists (select 1 from public.friend_blocks b where b.user_id = me.id and b.blocked_id = rel.other))
    order by rel.status, c.trainer
    limit 300
$$;

revoke execute on function public.amigos_conta(), public.amigos_cartao(text, text, text, text),
    public.amigos_total(uuid), public.amigos_pedir(text, uuid), public.amigos_id(text),
    public.amigos_responder(text, boolean), public.amigos_remover(text), public.amigos_bloquear(text),
    public.amigos_desbloquear(text), public.amigos_desafiar(text, text), public.amigos_lista(),
    public.amigos_avisar(uuid, text, jsonb), public.amigos_ping()
    from public, anon;
-- as ajudantes (conta, total, id, avisar) ficam só pras outras funções: o navegador não chama
revoke execute on function public.amigos_total(uuid), public.amigos_id(text), public.amigos_avisar(uuid, text, jsonb)
    from authenticated;
grant execute on function public.amigos_conta(), public.amigos_cartao(text, text, text, text),
    public.amigos_pedir(text, uuid), public.amigos_responder(text, boolean), public.amigos_remover(text),
    public.amigos_bloquear(text), public.amigos_desbloquear(text), public.amigos_desafiar(text, text),
    public.amigos_lista(), public.amigos_ping()
    to authenticated;

-- ------------------------------------------------------------------------------------------- Realtime

-- Canal privado de avisos `amigos:<id>`: só o dono ouve. Sem política de insert: o navegador não fala nesse canal,
-- só as funções acima (realtime.send roda como dono do banco).
create policy "amigos: ouvir o próprio canal" on realtime.messages
    for select to authenticated
    using (
        (select realtime.topic()) = 'amigos:' || (select auth.uid())::text
        and realtime.messages.extension = 'broadcast'
    );

-- ------------------------------------------------------------------------------------------- limpeza

-- Pedido sem resposta some em 30 dias, desafio velho em 1 dia, o contador do dia em 2 dias.
select cron.schedule(
    'limpar-amigos',
    '45 4 * * *',
    $$
    delete from public.friend_links where status = 'pending' and created_at < now() - interval '30 days';
    delete from public.friend_challenges where created_at < now() - interval '1 day';
    delete from public.friend_rate where day < public.hoje_brasilia() - 2;
    $$
);
