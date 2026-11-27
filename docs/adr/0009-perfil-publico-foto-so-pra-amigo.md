---
description: Qualquer jogador com sessão vê o perfil de outro pelo código; a foto do Google só pra amigo aceito, tirada no banco.
status: aceito
data: 2026-11-26
---

# 0009. Perfil público, foto do Google só pra amigo

## Contexto

Até a 0.9.53, quem tocava no nome de um jogador que não era amigo (ranking da Copa do Dia, Liga, Desafio de Natal,
histórico do Duelo) via só o nome, o clube e o "Adicionar amigo": a vitrine (`friend_cards.perfil`) só saía pra amigo
aceito (`amigos_perfil`). O mesmo pacote já ia pra qualquer rival na sala do Duelo, inclusive o anônimo. Em 26/11/2026
o Miguel aprovou abrir o perfil. Opção de "perfil privado" ficou de fora (ninguém pediu).

## Decisão

Qualquer sessão (conta Google ou a anônima do Duelo) lê a vitrine de outro pelo código de amigo
(`perfil_publico`, `supabase/migrations/20261126120000_perfil_publico.sql`). A foto do Google só vai pra amigo aceito:
pros outros, o banco tira a URL e o nome que veio do jogo antes de responder. Quem bloqueou você continua sem aparecer.

## Consequências

- O filtro da foto é do servidor: o navegador de quem não é amigo nunca recebe a URL. Não mover isso pro cliente.
- Personagem, título, escudo, medalhas, cartas e números passam a ser públicos pra quem tem o código (o ranking mostra
  o código). Voltar atrás é trocar a função, mas o que já foi visto foi visto.
- Sem a migração (prévia, banco antigo) ou com erro, o jogo cai no cartão só com nome e clube.
- Conferir: `supabase/tests/perfil_publico.test.sql`.
