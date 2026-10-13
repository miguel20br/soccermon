# Soccermon

Fan game de navegador, **sem fins lucrativos**: monte um time com os 151 Pokémon de Kanto num draft
"escolha 1 de 3" e dispute uma copa de **futsal 5v5 simulado** contra clubes temáticos dos ginásios.

- Draft roguelike de 7 rodadas: goleiro, fixo, 2 alas, pivô e 2 reservas
- Partida simulada em quadra 2D vista de cima, com sprites PMD animados em 8 direções e narração em PT-BR
- Stats, tipos, golpes (learnset da Gen 1) e habilidades viram atributos e ações de futsal
- Táticas, sinergias de tipo, substituições no intervalo e pênaltis no mata-mata

## Rodando

```bash
npm install
npm run dev        # http://localhost:8080
npm test           # testes do motor (Vitest)
npm run build      # build estático em dist/
```

Os dados e assets já estão no repositório. Para regenerar:

```bash
npm run data           # src/data/*.json a partir do @pkmn/dex + textos pt-BR
npm run assets:cards   # GIFs de Black/White (PokeAPI/sprites)
npm run assets:field   # atlas PMD por Pokémon (PMDCollab/SpriteCollab) + CREDITS-PMD.md
npm run assets:audio   # gritos legacy/latest (PokeAPI/cries) + partículas do Showdown
npm run calibrate -- --n 1000   # balanceamento headless
```

## Arquitetura

```
src/engine/   motor headless e determinístico (TS puro, sem Phaser)
  match.ts            estado + step(dt, commands) a 20 Hz → snapshots + eventos
  commands.ts         Commands que IA e humano emitem igualmente
  controllers/        AIController (estilo "Simple Soccer") e HumanController (modo jogável futuro)
  runners/            BatchRunner (Worker/calibração) e LiveRunner (tick a tick)
  attributes.ts       stats base → atributos 1–99 por posição
  moves.ts            golpe → ação de futsal · abilities.ts · synergy.ts · types.ts · xg.ts
  draft.ts, cup.ts    draft 1-de-3 e adversários da copa
src/game/     Phaser 4: MatchScene toca os snapshots com interpolação, efeitos e sons
src/ui/       React: telas, cards, narração
src/store/    Zustand com save em IndexedDB
```

O motor já está preparado para dois modos futuros: **carreira** (`PokemonInstance` com nível, XP e
evolução; `MatchConfig` paramétrico para 7v7/11v11) e **modo jogável** (troca o controller de um jogador
por um `HumanController`; o `LiveRunner` roda tick a tick).

## Licença e créditos

O código é licenciado sob **AGPL-3.0-or-later** (veja `LICENSE`). Pokémon e todos os nomes, imagens e sons
relacionados são © Nintendo, Game Freak, Creatures Inc. e The Pokémon Company. Este projeto não é afiliado
nem endossado por eles. Créditos completos em [CREDITS.md](CREDITS.md) e [CREDITS-PMD.md](CREDITS-PMD.md).
