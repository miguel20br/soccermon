-- Soccermon 0.8: limites nas estatísticas anônimas (revisão antes do lançamento).
-- Evita que alguém lote o banco com a chave pública: eventos só de uma lista fixa, props pequenos e
-- só as colunas do evento podem ser inseridas (id e created_at são do banco).

alter table public.game_events drop constraint if exists game_events_name_check;
alter table public.game_events add constraint game_events_name_check check (
    name in (
        'session_start', 'screen', 'onboarding_done', 'run_start', 'formation', 'pick', 'match_end',
        'run_end', 'reward', 'run_abandon', 'club_color', 'setting', 'login', 'error'
    )
);

alter table public.game_events drop constraint if exists game_events_props_check;
alter table public.game_events add constraint game_events_props_check check (pg_column_size(props) <= 512);

revoke insert on public.game_events from anon, authenticated;
grant insert (session, name, props, app_version, device) on public.game_events to anon, authenticated;

-- Limpeza: a página de privacidade promete guardar os eventos por no máximo 12 meses.
create extension if not exists pg_cron;
select cron.schedule(
    'limpar-estatisticas-antigas',
    '0 4 1 * *',
    $$delete from public.game_events where created_at < now() - interval '12 months'$$
);
