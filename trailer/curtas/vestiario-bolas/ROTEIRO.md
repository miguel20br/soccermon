# Vestiário do Pallet FC · EP 2 "Bola fora" (47 s, mockumentary v5, 13/11/2026)

**Versão 5 (13/11, pra postar sex 13/11 19h):** comédia no ritmo de The Office (timing, silêncio, olhar pra câmera), a
trilha que não para e animação polida. A peça vai na ordem do curta pelo `MAPAS.bolas` de `musica.mjs` (25 compassos;
16 e 17 são a cama dos talking heads, 18 fecha a tag). No `index.html`, as cenas mantêm a numeração da v4 e `CENA` leva
pro compasso do curta.

| Seg. | Plano | Texto |
|---|---|---|
| 0 | Magikarp despeja o saco (puxa antes); cartela por cima, sai com overshoot antes do corte | VESTIÁRIO DO PALLET FC · EP. 2 · BOLA FORA |
| 2 | **TH Magikarp** (tarja no alto); na 2ª fala o Voltorb aparece na estante atrás dele e pisca uma vez | Eu que organizo o material. / Conferi bola por bola. |
| 6 | Pikachu entra; chuta (agacha antes), vira comemorando com a bola no ar; ela amassa na rede atrás dele | — |
| 10 | **TH Pikachu** (6 s) em idle; faísca na pausa | Sabe como é, / eu gosto de comemorar antes. / Economiza tempo. |
| 16–26 | Breque, olhos do Voltorb, câmera lenta, chute, KABOOM (como na v4) | ESSA NÃO! |
| 26 | **O olhar:** punch-in fixo no Psyduck tostado olhando pra lente, 1 s, a trilha para | — |
| 27 | Chuva de bolas; uma cai na barriga do Snorlax, ele abraça a bola e deita de lado | — |
| 29 | Punch-in no golzinho: o Voltorb lá dentro, tostado e tonto; punch-in no Pikachu tostado na pose, respiro, pulinho fraco | Gol. |
| 31 | Magikarp apita, sai fumaça | — |
| 33 | **TH Psyduck** | Eu contei treze bolas. / A gente tem doze. |
| 37 | **Tag:** o Magikarp conta as bolas da tábua de baixo; o Voltorb pisca na cara dele; susto, silêncio, corte seco | …onze, doze, tre— |
| 41 | Tela final | Temos que chutar! · soccermon.com |

Polimento: `salto()` com antecipação, esticada, squash na aterrissagem e overshoot; `respira()` em quem fica parado num
quadro; a bola amassa na rede e a rede estufa; impactos com squash (barriga do Snorlax, chuva de bolas); tarjas com
`back.out`/`back.in`.

## Gerar (v5)

```bash
JOGO=<checkout da main> scripts/pesado.sh node trailer/curtas/preparar.mjs     # sprites + música (bolas-14.wav, na ordem do curta)
# a trilha do curta: do 4 s da peça, 1 s de silêncio no olhar do Psyduck (26 s do vídeo) e ~10 dB a menos nos talking
# heads e na tag (2–6, 10–16 e 33–41 s); o filtro está no histórico da sessão de 13/11, resumo:
#   [0]atrim=4:30 | 1 s de anullsrc | [0]atrim=30, concat, volume='1-0.684*max(janelas com rampa de 0,2 s)'
#   → trailer/curtas/midia/som/bolas-curta.wav
cd trailer/curtas && ../../scripts/pesado.sh npx hyperframes render vestiario-bolas -q high -w 1 --no-browser-gpu -o vestiario-bolas/render/v5.mp4
scripts/pesado.sh trailer/curtas/finalizar.sh <render.mp4> <saida>
```

## Versão 4 (41 s)

**Versão 4 (13/11, pedidos do Miguel depois da v3):** miolo mais longo e a mania do Pikachu na tela. A peça
(`livre-bolas.mjs`) foi pra 16 compassos; o curta usa do 2 ao 15.

| Seg. | C | Plano | Texto |
|---|---|---|---|
| 0 | 2 | Magikarp despeja o saco; cartela da série por cima | VESTIÁRIO DO PALLET FC · EP. 2 · BOLA FORA |
| 2 | TH | **Magikarp** (tarja no alto, y 600, acima da cabeça) | Eu que organizo o material. / Conferi bola por bola. |
| 6 | 3–4 | Pikachu entra (tarja ALA); nos dois chutes ele chuta e já vira pra câmera comemorando (pose, pulinho) com a bola no ar; ela entra atrás dele | — |
| 10 | TH (5 s) | **Pikachu** na pose; faísca na bochecha na pausa | Sabe como é, / eu gosto de comemorar antes. / Economiza tempo. |
| 15 | 5 | Punch-in na "bola" que ronca; aberto: o Pikachu toma distância andando de costas | — |
| 17 | 6 | Close: o Voltorb vira de frente e abre os olhos devagar (pálpebras em 3 passos); aberto: o Pikachu vira e corre | — |
| 19 | 7 | Câmera lenta, cor desbotada, vai-e-vem: olho do Voltorb (3x), Pikachu correndo devagar, Psyduck entrando devagar (grito desacelerado), olho, pé | ESSA NÃO! |
| 21 | 8 | Chute; o Voltorb sobe pro lado do gol; o Pikachu já comemora de costas pra ele; punch-in no Voltorb piscando | — |
| 23 | 9 | KABOOM atrás do Pikachu: clarão branco de 2 quadros, tremida, onda de choque que empurra ele (segue na pose), faíscas, destroços, as bolas voam pra fora da tela, fumaça em pixel art em 3 camadas que baixam em tempos diferentes | — |
| 25 | 10 | Chuva de bolas tostadas; punch-in: uma cai na barriga do Snorlax, quica pro chão e ele só deita de lado no banco | — |
| 27 | 11 | Voltorb pula feliz; punch-in no Pikachu tostado, na pose, pelo arrepiado | …FOI GOL? |
| 29 | 12 | Punch-in: o Magikarp apita, sai fumaça | — |
| 31 | TH | **Psyduck** tostado (tarja no alto) | Eu contei treze bolas. / A gente tem doze. |
| 35 | 13–15 | Tela final | Temos que chutar! · soccermon.com |

Som: a trilha corta seco nos talking heads (4 pedaços de `bolas-14.wav`), `som/sala.ogg` com 5,2 s (o TH do Pikachu tem
5 s), `som/54-lento.ogg` (o grito do Psyduck desacelerado: `asetrate=32728*0.55`).

## Versão 3 (34 s)

**Versão 3 (13/11):** o título virou **"Bola fora"** ("Saco de bolas" tinha duplo sentido). Gancho: sem os 4 s da
abertura; o vídeo abre no Magikarp arrastando o saco, com a cartela da série (VESTIÁRIO DO · PALLET FC, EP. 2, BOLA
FORA) carimbada por cima da lousa de 0 a 2 s numa faixa escura, que sobe. A trilha começa no compasso 2 da peça. A tarja
MAGIKARP · CAPITÃO foi pro talking head dele (a cartela ocupa os 2 s da cena). Legendas dos talking heads 40% maiores
(90 px, contorno de 20 px como as cartelas), base em y 1610 (acima dos 15% de baixo), quebra equilibrada. Na pausa do
Pikachu, uma faísca curta na bochecha. Talking heads em **2–6, 10–14 e 24–28 s**; tela final de 28 a 34 s.

## Versão 2 (38 s)

**Versão 2 (13/11, teste do formato mockumentary; roteiro em `docs/marketing/ep15-mockumentary.md` da pauta 17/11):** as
cenas do rascunho 1 com 3 talking heads de 2 compassos (4 s) na salinha do material (parede com faixa amarela, lâmpada,
estante de metal com bolas e cones), câmera parada, personagem em x 400 olhando pra lente, a fala em legenda embaixo
(frase normal, sem balão). **Sem plateia** (tirada da `livre-bolas.mjs`). A trilha corta seco no talking head e volta de
onde parou (4 pedaços de `bolas-14.wav`); durante ele só o zumbido da sala (`som/sala.ogg`, ruído marrom + 120 Hz).
No `index.html`, `T(compasso, linha)` soma 4 s por talking head já passado, então os tempos das cenas não mudaram.

| Seg. | Talking head | Legenda |
|---|---|---|
| 6–10 | Magikarp, medalha no peito; entre as falas vira a medalha pra câmera (brilho) | O material é comigo. / Conferi bola por bola. |
| 14–18 | Pikachu parado na pose | Eu comemoro antes. / Economiza tempo. |
| 28–32 | Psyduck tostado com a prancheta queimada (tarja PSYDUCK · TÉCNICO); olha a prancheta, olha a lente, segura a cabeça e a prancheta cai | Eu contei treze bolas. / A gente tem doze. |

## Rascunho 1 (26 s, 12/11/2026)

Pauta 15 (aprovado em 07/11): o Pikachu chuta o Voltorb achando que é a bola; explosão, fumaça (no rascunho 1, a plateia ria). Formato F1
da [bíblia](../BIBLIA.md) (sitcom multicâmera: aberto + punch-in, plateia, tarja NOME · POSIÇÃO). Abertura, cenário e
helpers copiados do "A foto do time" (EP 1).

**Miolo cômico:** o Magikarp despeja o saco e, no meio das bolas, rola uma "bola" vermelha e branca de costas (o
Voltorb, do tamanho de uma bola). O Pikachu comemora ANTES de cada chute (a mania dele) e faz dois gols no golzinho. A
última bola respira e solta um Z (punch-in); o Psyduck pula na frente: ESSA NÃO!. O chute, o Voltorb sobe, vira de
frente, abre os olhos e pisca branco… KABOOM. A fumaça abre: todo mundo tostado (o Psyduck voou pra beira da tela, o
Snorlax continua dormindo), o Voltorb novinho pulando. O Pikachu: …FOI GOL?; o Magikarp apita e só sai fumaça. Tag na
tela final: o Voltorb volta rolando de costas pro meio das bolas e pisca pra câmera.

120 BPM, compasso = 2 s. Trilha `scripts/musica/pecas/livre-bolas.mjs` (o tema do Vestiário em Fá na abertura).

| C | Seg. | Plano | Texto |
|---|---|---|---|
| 0–1 | 0 | Abertura (a logo da série) | VESTIÁRIO DO PALLET FC · EPISÓDIO 2 · SACO DE BOLAS |
| 2 | 4 | Aberto: o Magikarp arrasta o saco e despeja; as bolas e o Voltorb rolam | MAGIKARP · CAPITÃO |
| 3 | 6 | O Pikachu entra e comemora antes de chutar | PIKACHU · ALA |
| 4 | 8 | Dois chutes no golzinho, comemorando entre eles | — |
| 5 | 10 | Punch-in: a "bola" respira e solta um Z; aberto: o Psyduck | ESSA NÃO! |
| 6 | 12 | O chute; o Voltorb sobe; punch-in: abre os olhos e pisca | — |
| 7 | 14 | KABOOM, a fumaça cobre e abre | — |
| 8 | 16 | Todos tostados; o Voltorb pula feliz | …FOI GOL? |
| 9 | 18 | Punch-in: o Magikarp apita, sai fumaça | — |
| 10–12 | 20 | Tela final; o Voltorb volta pro meio das bolas e pisca | Temos que chutar! · soccermon.com |

## Gerar

```bash
JOGO=<checkout da main> scripts/pesado.sh node trailer/curtas/preparar.mjs     # sprites (com o Voltorb) + música
cd trailer/curtas && ../../scripts/pesado.sh npx hyperframes render vestiario-bolas -q high -w 1 --no-browser-gpu -o <render.mp4>
scripts/pesado.sh trailer/curtas/finalizar.sh <render.mp4> <saida>
```
