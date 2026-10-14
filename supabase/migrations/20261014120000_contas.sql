-- Soccermon 0.7: contas (login Google) e save na nuvem.
-- Cada jogador tem 1 perfil e 1 save (copa em andamento, configurações e recordes num jsonb).
-- RLS: cada um só lê e escreve o que é seu. Projetos novos não expõem tabelas sozinhos à Data API,
-- então os GRANTs para `authenticated` são explícitos (visitante/anon não acessa nada).

create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    display_name text,
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.saves (
    user_id uuid primary key references auth.users (id) on delete cascade,
    data jsonb not null,
    -- versão do formato do save (store do jogo), para migrar no futuro
    version integer not null default 1,
    updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.saves enable row level security;

create policy "perfil: ler o próprio" on public.profiles
    for select to authenticated
    using ((select auth.uid()) = id);
create policy "perfil: criar o próprio" on public.profiles
    for insert to authenticated
    with check ((select auth.uid()) = id);
create policy "perfil: editar o próprio" on public.profiles
    for update to authenticated
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);

create policy "save: ler o próprio" on public.saves
    for select to authenticated
    using ((select auth.uid()) = user_id);
create policy "save: criar o próprio" on public.saves
    for insert to authenticated
    with check ((select auth.uid()) = user_id);
create policy "save: editar o próprio" on public.saves
    for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.saves to authenticated;
revoke all on public.profiles from anon;
revoke all on public.saves from anon;
