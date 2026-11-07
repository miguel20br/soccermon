# Vestiário do Pallet FC · EP 1 "O atrasado" (roteiro v2, episódio completo, 07/11/2026)

Formato F1 da [bíblia](../BIBLIA.md): vestiário fixo (bancos, armários, lousa), câmera parada de frente, risada de
plateia, congelamento com o nome do episódio no fim, vinheta curta anos 90 e funk no meio. Pauta item 13, post na
terça 10/11, 19h. Rascunho de 15 s aprovado pelo Miguel com as opções recomendadas: a lousa com SÁBADO PASSADO, a luz
apagando antes do "!" e plateia gravada (CC0).

**A piada (uma só):** o Slowpoke chega todo pronto pra estreia, que foi semana passada. Tudo no episódio é o atraso
dele: a corrida que não sai do lugar, a ficha que não cai, a reação que chega com a luz já apagada, e até a tela final.

**Herói:** Slowpoke (79, escala 16), faixa vermelha na testa que segue o quadro (`segueFaixa`). **No banco:** Snorlax
(143, dormindo), Magikarp (129, medalha e apito), Pikachu (25), Ditto (132). A única fala é a do Slowpoke.

**Tempo: 100 BPM, 4/4, compasso = 2,4 s, 15 compassos = 36 s + 0,6 s de rabo.** Música própria:
`scripts/musica/pecas/livre-atrasado.mjs` (molde da `livre-ditto`): Fá, funk, o motivo do Slowpoke na tuba entra
sempre um tempo atrasado (F2 A2 C3 Eb3, um bocejo); os passos dele são o bloco de madeira a mil.

| C | Seg. | Cena | Texto na tela | Música e som |
|---|---|---|---|---|
| 0 | 0,0 | **Gancho:** o Slowpoke entra pela direita CORRENDO (Walk 3x), gotas, poeira e riscos de velocidade, e anda um palmo. O time olha | — | passos no bloco a mil, shaker, a tuba atrasada |
| 1 | 2,4 | Vinheta anos 90: fundo turquesa, formas Memphis, os 4 retratos pulam nos acordes, o título carimba | VESTIÁRIO DO PALLET FC | piano elétrico, metais, clap 808, "ta-dá" (F · Dm7 · Bb · C7) |
| 2 | 4,8 | Ele AINDA está correndo, quase no mesmo lugar | — | passos; risada da plateia |
| 3 | 7,2 | Um último arranque, para, ofega, e estufa o peito no 2 (junto da tuba) | — | o funk entra: a banda chama no 1, a tuba responde no 2 |
| 4 | 9,6 | Caixa de fala do PMD com o retrato dele | CHEGUEI PRA ESTREIA! | o grito do Slowpoke |
| 5 | 12,0 | "?" no Magikarp (no 1) e no Pikachu (linha 5); o Snorlax ronca | — | plof, pícolo subindo, ronco |
| 6 | 14,4 | O Magikarp apita; a lousa gira (linha 8); o Slowpoke vira de costas pra ler (linha 12) | — | apito real, breque, "zum", acorde do placar, a plateia explode |
| 7–8 | 16,8 | **A lousa (a punchline, 5,4 s legível):** ele inclina a cabeça a cada nota atrasada da tuba | ESTREIA · 4 × 1 · SÁBADO PASSADO | groove leve debaixo da risada |
| 9 | 21,6 | Nada. O time olha pra ele | — | a música para; a tuba tenta a 1ª nota e desiste; ronco |
| 10 | 24,0 | Balão "..."; o Pikachu não aguenta (linha 8) | HAHA | o grito do Pikachu e a plateia |
| 11 | 26,4 | A luz apaga (clique): todo mundo foi embora; um foco nele, de costas | — | clique e grilo |
| 12 | 28,8 | A ficha cai: vira pra câmera, pula, "!"; **congela** na linha 8 (cor lavada, moldura, a câmera 1,5x nele) | — | golpe da banda + o grito dele em meia velocidade (som de assinatura); "tan-tan-TAAN" de sitcom |
| 13 | 31,2 | Congelado, o nome do episódio carimba | PALLET FC · EP 1 · O ATRASADO | a vinheta volta com o aplauso |
| 14 | 33,6 | Tela final (o logo pisca SOC-CER-MON); na linha 11 o Slowpoke ainda chega correndo pela direita | Temos que chutar! · soccermon.com | SOC-CER-MON; a banda fecha e a tuba responde sozinha, atrasada |

Regras: uma coisa por vez; cada ideia ≥ 2 s; câmera parada (só a vinheta, o congelamento e a tela final mudam o
quadro); sprites em escala inteira (no congelamento 1,5x: 16 → 24); texto de 2 a 5 palavras, sem emoji; textos fora
dos 15% de baixo. `node trailer/qa-quadros.mjs trailer/curtas/vestiario-atrasado`: 0 problema(s) em 1098 quadros.

## Sons de terceiros (todos CC0, domínio público)

Gravações em `scripts/musica/amostras/` (recortadas, mono 44,1 kHz), tocadas pela música:

| Arquivo | Origem | Licença |
|---|---|---|
| `plateia-riso-curto.wav`, `plateia-riso-grande.wav`, `plateia-riso-medio.wav` | "Sitcom Laughter 9x, Small Audience", por Kinoton, freesound.org/s/383207 (trechos 10,9–14,2 s, 0–5,2 s e 15,2–17,9 s) | CC0 1.0 |
| `plateia-aplauso.wav` | "Sitcom Laughter with Applause, Small Audience", por Kinoton, freesound.org/s/371562 | CC0 1.0 |
| `grilo.wav` | "Single Cricket (insect)", por unfa, freesound.org/s/162324 (trecho 1,0–4,6 s) | CC0 1.0 |

Baixados da prévia HQ do Freesound (MP3 128k, sem login). O apito é o do EP 3 (SpliceSound, CC0, ver
`trailer/sons/CREDITOS.md`); os gritos vêm de `public/assets/cries` (`som/79-lento.ogg` = o grito do Slowpoke a meia
velocidade, uma oitava abaixo).

## Gerar

```bash
JOGO=<checkout da main> scripts/pesado.sh node trailer/curtas/preparar.mjs      # sprites + música (midia/)
cd trailer/curtas && ../../scripts/pesado.sh npx hyperframes render vestiario-atrasado -q high -w 1 --no-browser-gpu -o <render.mp4>
scripts/pesado.sh trailer/curtas/finalizar.sh <render.mp4> <saida>              # −14 LUFS e a cópia -celular
```
