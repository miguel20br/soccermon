-- Soccermon 0.7.2: apagar a própria conta (LGPD) e limite de tamanho do save.
--
-- delete_my_account(): o jogador logado apaga o próprio login (auth.users); perfil e save vão junto
-- (on delete cascade). SECURITY DEFINER porque auth.users não é acessível ao papel `authenticated`;
-- por isso a função só age sobre auth.uid(), tem search_path vazio e só `authenticated` pode chamá-la.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    uid uuid := auth.uid();
begin
    if uid is null then
        raise exception 'precisa estar logado';
    end if;
    delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from public;
revoke execute on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;

-- save de um jogo de navegador não passa de algumas dezenas de KB: 1 MB barra abuso do armazenamento
alter table public.saves
    add constraint saves_data_tamanho check (pg_column_size(data) < 1048576);

-- perfil só guarda nome e foto do Google para exibição
alter table public.profiles
    add constraint profiles_nome_tamanho check (char_length(display_name) <= 120),
    add constraint profiles_foto_tamanho check (char_length(avatar_url) <= 1000);
