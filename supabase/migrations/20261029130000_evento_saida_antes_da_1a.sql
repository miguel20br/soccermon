-- Soccermon: 'first_leave' (a pessoa escondeu ou fechou a aba antes de chegar ao apito da 1ª partida), com a tela, o
-- passo da copa, as cartas já escolhidas, o ponto da partida e o tempo de página. Mede onde os ~27% que saem antes da
-- 1ª partida largam (docs/planos/funil-draft.md). Uma vez por sessão, sem dado pessoal.
-- Mesma lista da 20261028180000, com 'first_leave' a mais. Aplicar ANTES de publicar o código que envia o evento.

alter table public.game_events drop constraint if exists game_events_name_check;
alter table public.game_events add constraint game_events_name_check check (
    name in (
        'session_start', 'screen', 'onboarding_done', 'run_start', 'formation', 'pick', 'match_end',
        'run_end', 'reward', 'run_abandon', 'club_color', 'setting', 'login', 'error', 'share',
        'shop_buy', 'shop_leave', 'coach_shown', 'coach_next', 'coach_skip',
        'match_skip', 'duel_join', 'duel_match_end', 'first_leave'
    )
);
