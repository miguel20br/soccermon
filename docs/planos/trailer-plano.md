# Plano do trailer de lançamento (15/10/2026)

Baseado em [trailer-pesquisa.md](trailer-pesquisa.md) (o Miguel chegou nas mesmas conclusões) e no roteiro de
[divulgacao-trailer.md](divulgacao-trailer.md). Rascunho pra aprovar: storyboard e visual se decidem com o Miguel.

## Resumo

- **Duração:** 33 s, corte mestre 16:9 (1920×1080) + versão 4:5 (1080×1350) pro LinkedIn no celular.
- **Sem narração.** Texto curto na tela (o feed toca mudo), música chiptune própria, gritos e efeitos do jogo.
- **Tudo é gameplay real** do Soccermon, gravado quadro a quadro de partidas escolhidas a dedo. Nada redesenhado.
- **Stack:** motor do jogo (caça de seeds) → Chromium headless (captura com tempo virtual) → HyperFrames
  (composição e render) → ffmpeg (versões e legendas) + ZzFXM (música).

## Storyboard

Tempo em segundos. A música tem ~140 BPM; os cortes caem na batida (1 compasso ≈ 1,7 s).

| # | Tempo | Cena | De onde vem | Texto na tela | Áudio |
|---|---|---|---|---|---|
| 1 | 0,0–3,0 | **GANCHO:** evolução no meio da partida. A partida para, silhueta, clarão, e ele volta evoluído e já parte pro gol | partida escolhida (seed com evolução cedo) | nenhum | nota longa + grito do Pokémon evoluído |
| 2 | 3,0–6,4 | Draft: 3 cartas viram, uma é escolhida e voa pra vaga na escalação (com o visual de carta novo) | tela do draft | **"Escolha 1 de 3. Os 151 de Kanto."** | entra a batida |
| 3 | 6,4–9,8 | VERSUS na diagonal: seu time × ginásio | VersusIntro | **"Monte o time. Enfrente os ginásios."** | impacto no corte |
| 4 | 9,8–15,0 | Partida aberta: tabela, drible, chute, gol, narração aparecendo | partida escolhida (gol bonito de jogada) | **"Futsal 5 contra 5"** | ritmo cheio |
| 5 | 15,0–19,3 | Montagem rápida de 4 golpes (um por compasso curto): Flamethrower, Thunderbolt, Hydro Pump, Psychic (nomes como aparecem no jogo) | `?lab=golpes` + partidas | **"164 golpes viram jogada"** | efeito ZzFX de cada golpe |
| 6 | 19,3–22,7 | Ditto se transforma no melhor do campo + combo Gênese (Mew + Mewtwo) | `?demo=ditto` | **"Ditto copia o melhor em campo"** | — |
| 7 | 22,7–26,1 | Você é o técnico: painel do time (fôlego caindo), troca de tática, substituição entrando | partida + TeamPanel | **"Você é o técnico"** | pausa curta na batida |
| 8 | 26,1–29,5 | Pênaltis: cobrança decisiva → tela de campeão com troféu e confete | `?demo=penaltis`, `?demo=campeao` | **"Até a taça."** | subida até o clímax |
| 9 | 29,5–33,0 | Cartela final: logo SOCCERMON animado + Pokémon da Home correndo atrás da bola | composição | **"Beta aberta · Jogue grátis no navegador"** + **endereço do site** + "Fan game sem fins lucrativos" (pequeno) | acorde final |

Alternativa de gancho (cena 1): um golpe que vira gol (por exemplo o Psychic do Mewtwo cruzando a quadra).
Testar as duas no rascunho e escolher olhando.

**Versão 4:5:** mesma sequência, com a quadra em cima e o texto embaixo (composição própria no HyperFrames,
não um corte do 16:9, senão perde as laterais da quadra).

## Passo a passo

### Fase 0: ferramentas (Claude, ~1 h)
1. Pasta `trailer/` no repo: composição HyperFrames, scripts de captura e de música (os quadros e vídeos
   gerados ficam no `.gitignore`).
2. Atalho só de dev `?demo=trailer&cena=N`: monta exatamente a partida/tela de cada cena (time, seed, ordens),
   no mesmo estilo do `dev-demo.ts`.
3. Script de captura com **tempo virtual** (Chromium + CDP): avança o relógio da página 1/30 s por vez e tira
   print a cada passo, então o vídeo sai liso mesmo no celular. **Primeiro risco a validar:** o Phaser respeitar
   o tempo virtual. Plano B: gravar em velocidade 0,25× e acelerar 4× no ffmpeg.

### Fase 1: caça de lances (Claude, ~1 h, roda sozinho)
4. Script em `trailer/` (estilo `scripts/calibrate.ts`) roda centenas de partidas com times montados pra cada
   cena e pontua os eventos: evolução nos primeiros minutos, gol de golpe, Ditto transformando, combo, virada,
   pênaltis decididos na última cobrança.
5. Sai uma lista com as melhores seeds e o tick de cada lance. Eu recorto e te mostro miniaturas pra escolher.

### Fase 2: gravação (Claude, ~1 h, roda sozinho)
6. Gravar cada cena escolhida em 1920×1080, 30 fps (PNG → MP4 sem perdas).
7. Telas de interface (draft, VERSUS, painel, campeão) gravadas pelo mesmo método.

### Fase 3: música (Claude, ~30 min)
8. Faixa chiptune de 33 s em ZzFXM (4 canais, ~140 BPM), com os acentos nos tempos do storyboard. Exportar WAV.
9. Efeitos: gritos (`public/assets/cries`) e sons ZzFX do próprio jogo nos momentos certos.

### Fase 4: composição e rascunho (Claude + Miguel)
10. Montar no HyperFrames: clipes em trilhas, textos na fonte Galmuri com as cores do jogo, transições
    simples (corte seco na batida; nada de efeitos "de template").
11. Render rascunho (`--quality draft`). Eu confiro um quadro do meio de cada cena (texto cortado, leitura em
    tela de celular, fato errado) e mando o vídeo pra você.
12. **Você assiste e pede ajustes** ("cena 5 mais rápida", "troca o gancho"). Repete.

### Fase 5: final e entrega
13. Revisão dos 4 críticos: design, leitura no celular, ritmo, marca/fatos/jurídico (sem logo oficial, sem
    trilha oficial, aviso de fan game).
14. Render final + versão 4:5 + capa (thumbnail) + legendas dos posts (X e LinkedIn).
15. A cartela final usa o **domínio novo**: o render final sai depois que você comprar o domínio. Até lá, o
    endereço é uma variável.

## Riscos e planos B

| Risco | Plano B |
|---|---|
| Phaser não respeita o tempo virtual | Gravar em velocidade lenta (0,25×) e acelerar no ffmpeg |
| Render pesado demais no celular (pouca RAM) | Rascunho aqui com 1 worker; final no PC |
| Lance raro não aparece na caça de seeds | Montar o cenário direto (como os `?demo=`), forçando o time e a posição |
| Música chiptune soar pobre | Faixa royalty-free com crédito, ou música por IA com licença clara |

## Pra decidir

1. **Duração:** 33 s está bom?
2. **Idioma:** só português, ou também uma versão em inglês pro público internacional do X?
3. **Gancho:** evolução ou golpe virando gol? (Proposta: testar os dois no rascunho.)
4. **Versões:** 16:9 + 4:5 bastam, ou quer 9:16 também (Reels/TikTok)?
5. **Música:** chiptune própria em ZzFXM, ok?
