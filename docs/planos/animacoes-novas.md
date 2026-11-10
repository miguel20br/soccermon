
## Feito (10/11, branch `animacoes`)

- **B1:** `goalCelebPose` (walkout-plan.ts) na MatchScene: pulo, giro ou pose nos 2,5 s do Celebrate, pros dois times;
  na Final, a partícula do tipo sai do corpo. Demo `?demo=final&gol=pulo|giro|pose`.
- **A2 e A1:** palco da cerimônia na MatchScene, roteiro puro em `src/game/ceremony.ts`. Taça curta 3 s em todo título;
  invasão ~10,5 s só na Rota (38 torcedores, Pidgey, Rattata, Oddish e Psyduck, capitão pro alto, foto com o letreiro).
  Toque/Pular vai pra foto; Reduzir movimento = só a foto. O FinalCard espera ('match:ceremony-end'). Desfile do Hall
  só na Rota e no 1º título de cada modo (`paradeOn`), 0,95 s por Pokémon com flash. Demos `?demo=campeao&taca=1`,
  `?demo=rota-titulo`.
- **A5:** a insígnia batendo na fila dos avisos (2,3 s), jingle `scripts/musica/pecas/insignia.mjs`
  (`public/assets/sfx/insignia.mp3`). Demo `?demo=insignia[&lider=misty]`.
- **C2:** Estádio com a ola, o letreiro CAMPEÕES DA … e o capitão com a taça enquanto a copa campeã é a atual.
  Demo `?demo=estadio-campeao[&rota=1]`.
- **A7:** créditos curtos depois do desfile no 1º título da Rota (`creditsOn`, `champ.credited`). Demo `?demo=rota-fim`.
