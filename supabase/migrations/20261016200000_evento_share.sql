-- Soccermon 0.8.3: evento 'share' (quem compartilhou o resultado: imagem, texto ou baixou a arte).
-- Mesma lista fixa da 20261015190000, com 'share' a mais. Aplicar ANTES de publicar o código que envia o evento
-- (um nome fora da lista derruba o lote inteiro de eventos daquele envio).

alter table public.game_events drop constraint if exists game_events_name_check;
alter table public.game_events add constraint game_events_name_check check (
    name in (
        'session_start', 'screen', 'onboarding_done', 'run_start', 'formation', 'pick', 'match_end',
        'run_end', 'reward', 'run_abandon', 'club_color', 'setting', 'login', 'error', 'share'
    )
);
