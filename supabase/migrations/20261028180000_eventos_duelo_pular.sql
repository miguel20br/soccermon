-- Soccermon 0.9.24: 'match_skip' (tocou em "Pular pro fim"), 'duel_join' (ganhou lugar numa sala do Duelo) e
-- 'duel_match_end' (um jogo do Duelo acabou). Sem eles, quem chega por convite e joga o Duelo não aparece no funil.
-- Mesma lista da 20261022180000, com os três a mais. Aplicar ANTES de publicar o código que envia os eventos.
-- Aprovado pelo Miguel em 28/10/2026.

alter table public.game_events drop constraint if exists game_events_name_check;
alter table public.game_events add constraint game_events_name_check check (
    name in (
        'session_start', 'screen', 'onboarding_done', 'run_start', 'formation', 'pick', 'match_end',
        'run_end', 'reward', 'run_abandon', 'club_color', 'setting', 'login', 'error', 'share',
        'shop_buy', 'shop_leave', 'coach_shown', 'coach_next', 'coach_skip',
        'match_skip', 'duel_join', 'duel_match_end'
    )
);
