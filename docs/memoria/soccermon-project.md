---
name: soccermon-project
description: "Soccermon — fan game de navegador (draft de Pokémon Gen 1 + futsal 5v5 simulado), sem fins lucrativos, AGPL-3.0, com visão de carreira/modo jogável"
metadata:
  node_type: memory
  type: project
  originSessionId: 49f0265d-d052-4d1e-ae53-01ffc67babc1
  modified: 2026-10-14T21:33:14.345Z
---

Soccermon é um fan project pessoal do Miguel, **sem fins lucrativos**: draft roguelike "1 de 3" com os 151 da Gen 1 + partida de futsal 5v5 simulada em campo 2D top-down (Phaser 4 + sprites PMD SpriteCollab), narração PT-BR, single-player vs IA em copa mata-mata. Código sob **AGPL-3.0** (permite reaproveitar Pokemon Auto Chess/PokeRogue). Cries legacy+latest com opção nas configurações. Plano aprovado em 2026-10-13: `~/.claude/plans/fala-claude-eu-tenho-peppy-wolf.md`.

**Why:** Miguel é fã enorme de Pokémon ([[user-pokemon-fan]]); não quer alertas legais alarmistas — já sabe que é fan game tolerado.

**Status (2026-10-14, noite):** v0.7.2 no ar; o contexto completo e as pendências estão no `CLAUDE.md` do repositório (criado para o Miguel continuar pelo celular). Vercel ligada ao GitHub: push na main = deploy em produção. Pendentes dele: consentimento OAuth do Google em produção e tornar o repo público. **Status anterior (2026-10-14, tarde):** contas Google + save na nuvem no ar (Supabase via Vercel, projeto vszcxacbcabohhdwxfpb; migração em supabase/migrations). Também no ar: lab de golpes (?lab=golpes, botão Golpes na Home), evolução em tela cheia, substituição andando, painel ao tocar no Pokémon, setinhas de bônus (src/engine/modifiers.ts = regra única carta/campo), estatísticas de partida e copa. Próximo combinado: melhores momentos/replay (snapshots já existem), revisão dos golpes pelo Miguel no lab. **Status (2026-10-13):** v0.6 no ar: carta Metal (bronze/prata/ouro), edições especiais (Shiny/Destaque/Ícone/Evento semanal), ícones oficiais de tipo, VERSUS na diagonal, sinergias de história, Ditto, físico. Próximo: quadras temáticas + treinadores (0.6.x), contas (0.7), carreira (0.8+).

**Status (2026-10-15):** v0.7.3 "Beta aberta" no ar e **repo público** (Release v0.7.3, Discussions, relato
privado de falhas). Histórico reescrito com o e-mail noreply; clones antigos (PC) precisam re-clonar, ver o
aviso no topo do CLAUDE.md. Novidades da 0.7.3: painel do time na partida, cartas na escalação, cenas
animadas na Home, aviso de erro (ErrorBoundary), créditos "Criado por Miguel Cunha". Próximo: domínio próprio
(Cloudflare) e trailer de lançamento; brainstorm de personalização/Pokédex em docs/planos.

**How to apply:** Visão de longo prazo inclui **modo carreira** (temporadas, XP, evolução) e **modo jogável** (controlar 1 pokémon ou o time inteiro estilo FC 27). Toda decisão de arquitetura do motor deve preservar isso: controllers plugáveis (IA e humano emitem os mesmos Commands), física real com tick fixo 20 Hz determinístico, BatchRunner + LiveRunner, MatchConfig paramétrico, PokemonInstance (não só espécie).
