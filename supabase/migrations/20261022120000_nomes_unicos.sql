-- Soccermon 0.9.1: nome do treinador e do clube únicos entre quem tem conta (pedido do Miguel, 21/10/2026).
-- A comparação ignora maiúsculas, acentos e espaços a mais ("Tesão FC" = "tesao  fc"). Os nomes padrão (Treinador,
-- Trainer, Pallet FC) ficam livres pra todo mundo. Quem já usava um nome repetido: fica com quem tem a conta mais antiga.
-- Ninguém lê nem escreve a tabela direto: só pela função reservar_nome (security definer).

create extension if not exists unaccent with schema extensions;

create table public.nomes (
    tipo text not null check (tipo in ('treinador', 'clube')),
    chave text not null,
    nome text not null check (char_length(nome) between 1 and 40),
    user_id uuid not null references auth.users (id) on delete cascade,
    criado_em timestamptz not null default now(),
    primary key (tipo, chave)
);
create unique index nomes_um_por_conta on public.nomes (tipo, user_id);
alter table public.nomes enable row level security;
revoke all on public.nomes from anon, authenticated;

create or replace function public.nome_chave(p_nome text)
returns text
language sql
stable
set search_path = public, extensions
as $$
    select lower(regexp_replace(trim(extensions.unaccent(coalesce(p_nome, ''))), '\s+', ' ', 'g'));
$$;

-- 'ok' = o nome é seu; 'ocupado' = de outra conta; 'livre' = nome padrão (não reserva); 'sem_conta'; 'invalido'.
create or replace function public.reservar_nome(p_tipo text, p_nome text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
    uid uuid := auth.uid();
    k text := public.nome_chave(p_nome);
    dono uuid;
begin
    if uid is null then
        return 'sem_conta';
    end if;
    if p_tipo not in ('treinador', 'clube') or char_length(coalesce(p_nome, '')) > 40 then
        return 'invalido';
    end if;
    if k = '' or k in ('treinador', 'trainer', 'pallet fc') then
        delete from public.nomes where tipo = p_tipo and user_id = uid;
        return 'livre';
    end if;
    select user_id into dono from public.nomes where tipo = p_tipo and chave = k;
    if dono is not null and dono <> uid then
        return 'ocupado';
    end if;
    delete from public.nomes where tipo = p_tipo and user_id = uid and chave <> k;
    insert into public.nomes (tipo, chave, nome, user_id)
    values (p_tipo, k, trim(p_nome), uid)
    on conflict (tipo, chave) do update set nome = excluded.nome;
    return 'ok';
end;
$$;

revoke all on function public.reservar_nome(text, text) from public, anon;
grant execute on function public.reservar_nome(text, text) to authenticated;

-- nomes que já existem nos saves: a conta mais antiga fica com o nome
insert into public.nomes (tipo, chave, nome, user_id, criado_em)
select distinct on (x.tipo, x.chave) x.tipo, x.chave, x.nome, x.user_id, x.criado_em
from (
    select 'treinador' as tipo, public.nome_chave(s.data -> 'profile' ->> 'trainerName') as chave,
        trim(s.data -> 'profile' ->> 'trainerName') as nome, s.user_id, coalesce(p.created_at, s.updated_at) as criado_em
    from public.saves s left join public.profiles p on p.id = s.user_id
    union all
    select 'clube', public.nome_chave(s.data -> 'profile' ->> 'clubName'),
        trim(s.data -> 'profile' ->> 'clubName'), s.user_id, coalesce(p.created_at, s.updated_at)
    from public.saves s left join public.profiles p on p.id = s.user_id
) x
where x.chave <> '' and x.chave not in ('treinador', 'trainer', 'pallet fc') and char_length(x.nome) between 1 and 40
order by x.tipo, x.chave, x.criado_em
on conflict do nothing;
