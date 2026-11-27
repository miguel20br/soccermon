-- Soccermon: perfil público (decidido com o Miguel em 26/11/2026, docs/planos/sala-de-trofeus.md, "Mudou em 26/11", e
-- docs/adr/0009-perfil-publico-foto-so-pra-amigo.md). Aplicar só com o ok do Miguel (Supabase de produção).
--
-- Qualquer jogador com sessão (conta Google ou a sessão anônima do Duelo) lê a vitrine de outro pelo código de amigo:
-- personagem, título, escudo e uniforme, medalhas, cartas e números. É o mesmo pacote que a sala do Duelo já manda pra
-- qualquer rival, inclusive o anônimo, então a sessão anônima não abre nada novo.
-- A foto do Google só vai pra amigo aceito. Pros outros o banco tira a foto e o nome que veio do jogo: o avatar só fica
-- se for um sprite nosso (assets/cards/N.gif), o nome passa a ser o do cartão público (o mesmo do ranking). Sem
-- avatar, o jogo mostra o Pikachu de sempre (peerAvatar).
-- Quem bloqueou você continua invisível (null), como no resto dos amigos.
-- amigos_perfil (o jogo 0.9.53.3 chama pro amigo aceito) fica como está.

create or replace function public.perfil_publico(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
    select case
        when exists (
            select 1 from public.friend_links l
            where l.status = 'accepted'
                and ((l.from_id = auth.uid() and l.to_id = c.user_id)
                    or (l.from_id = c.user_id and l.to_id = auth.uid()))
        ) then c.perfil
        else (c.perfil - 'avatar' - 'avatarGoogle' - 'name')
            || jsonb_build_object('name', c.trainer, 'avatarGoogle', false)
            || case
                when c.perfil ->> 'avatar' ~ '^assets/(cards|avatars)/(shiny/)?[0-9]{1,3}\.gif$'
                    then jsonb_build_object('avatar', c.perfil -> 'avatar')
                else '{}'::jsonb
            end
    end
    from public.friend_cards c
    where auth.uid() is not null
        and c.perfil is not null
        and c.code = upper(trim(p_code))
        and not exists (
            select 1 from public.friend_blocks b where b.user_id = c.user_id and b.blocked_id = auth.uid()
        )
$$;

revoke execute on function public.perfil_publico(text) from public, anon;
grant execute on function public.perfil_publico(text) to authenticated;
