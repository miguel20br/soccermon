-- Soccermon: 'nav' (a pessoa trocou de aba do ambiente, abriu uma porta, as Metas, as Novidades, uma fatia do menu de
-- modos ou a Ajuda), com `kind`, `to`, `from` e, nas abas, `lit` (quantas abas acesas). Mede a navegação depois da
-- 0.9.49 (docs/planos/menos-e-mais.md, D6). Sem dado pessoal.
-- Mesma lista da 20261029130000, com 'nav' a mais. Aplicar ANTES de publicar o código que envia o evento.

alter table public.game_events drop constraint if exists game_events_name_check;
alter table public.game_events add constraint game_events_name_check check (
    name in (
        'session_start', 'screen', 'onboarding_done', 'run_start', 'formation', 'pick', 'match_end',
        'run_end', 'reward', 'run_abandon', 'club_color', 'setting', 'login', 'error', 'share',
        'shop_buy', 'shop_leave', 'coach_shown', 'coach_next', 'coach_skip',
        'match_skip', 'duel_join', 'duel_match_end', 'first_leave', 'nav'
    )
);
