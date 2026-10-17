-- Soccermon 0.8.5: duelo ao vivo por link (docs/planos/multiplayer.md).
-- Sem tabela nova: a sala é um canal privado do Realtime, `duel:<código>` (Broadcast pras mensagens e Presence pra
-- quem está na sala). Canal privado só deixa entrar quem passa nestas políticas em realtime.messages: aqui, qualquer
-- conta logada, só nos tópicos do duelo. Visitante (anon) não entra. A sala some sozinha quando os dois saem.
-- Depois de aplicar: Realtime → Settings → desligar "Allow public access" (o jogo não usa canal público).

create policy "duelo: logado ouve a sala" on realtime.messages
    for select to authenticated
    using (
        (select realtime.topic()) like 'duel:%'
        and realtime.messages.extension in ('broadcast', 'presence')
    );

create policy "duelo: logado fala na sala" on realtime.messages
    for insert to authenticated
    with check (
        (select realtime.topic()) like 'duel:%'
        and realtime.messages.extension in ('broadcast', 'presence')
    );
