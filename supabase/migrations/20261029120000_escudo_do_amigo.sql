-- Soccermon: o escudo de verdade de cada amigo na lista (formato, símbolo, 2ª cor e uniforme). Aplicar só com o ok
-- do Miguel (Supabase de produção).
--
-- A vitrine (friend_cards.perfil, 20261021120000_perfil_do_amigo.sql) já leva esses campos (o mesmo pacote da sala do
-- Duelo), e o jogo já republica a vitrine quando o Perfil muda. A lista passa a devolver só esses quatro campos dela,
-- numa coluna nova no fim (`escudo`); o resto da vitrine continua só pra amigo aceito (amigos_perfil). O escudo é tão
-- público quanto a cor do clube, que a lista já mostra pra pedidos e bloqueados.
-- Cliente antigo (0.9.25) lê as colunas pelo nome e ignora a nova. O jogo valida cada campo ao mostrar
-- (lookOfPeer, src/store/club-kit.ts); quem ainda não publicou a vitrine vem com `escudo` null (o escudo padrão).

-- mudar as colunas de saída exige recriar a função (o resto é igual ao de 20261020120000_amigos.sql)
drop function public.amigos_lista();

create function public.amigos_lista()
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
    online boolean,
    escudo jsonb
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
        rel.status = 'amigo' and coalesce(c.seen_at > now() - interval '150 seconds', false),
        case when c.perfil is not null then jsonb_build_object(
            'color2', c.perfil -> 'color2',
            'kitPattern', c.perfil -> 'kitPattern',
            'crestShape', c.perfil -> 'crestShape',
            'crestSymbol', c.perfil -> 'crestSymbol'
        ) end
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

revoke execute on function public.amigos_lista() from public, anon;
grant execute on function public.amigos_lista() to authenticated;
