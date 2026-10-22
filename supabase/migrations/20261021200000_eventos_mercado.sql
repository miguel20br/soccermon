-- Soccermon 0.9.0: eventos do Mercado da Copa rápida ('shop_buy' compra, 'shop_leave' saiu com ₽ guardado).
-- Mesma lista fixa da 20261016200000, com os dois a mais. Aplicar ANTES de publicar o código que envia os eventos
-- (um nome fora da lista derruba o lote inteiro de eventos daquele envio).

alter table public.game_events drop constraint if exists game_events_name_check;
alter table public.game_events add constraint game_events_name_check check (
    name in (
        'session_start', 'screen', 'onboarding_done', 'run_start', 'formation', 'pick', 'match_end',
        'run_end', 'reward', 'run_abandon', 'club_color', 'setting', 'login', 'error', 'share',
        'shop_buy', 'shop_leave'
    )
);
