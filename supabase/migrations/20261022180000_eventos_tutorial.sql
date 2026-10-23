-- Soccermon 0.9.6: eventos dos balões do tutorial ('coach_shown' apareceu, 'coach_next' avançou, 'coach_skip' pulou).
-- Mesma lista fixa da 20261021200000, com os três a mais. Aplicar ANTES de publicar o código que envia os eventos
-- (um nome fora da lista derruba o lote inteiro de eventos daquele envio). Produção só com o ok do Miguel.

alter table public.game_events drop constraint if exists game_events_name_check;
alter table public.game_events add constraint game_events_name_check check (
    name in (
        'session_start', 'screen', 'onboarding_done', 'run_start', 'formation', 'pick', 'match_end',
        'run_end', 'reward', 'run_abandon', 'club_color', 'setting', 'login', 'error', 'share',
        'shop_buy', 'shop_leave', 'coach_shown', 'coach_next', 'coach_skip'
    )
);
