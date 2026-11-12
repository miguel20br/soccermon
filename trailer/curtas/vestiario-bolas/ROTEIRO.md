# Vestiário do Pallet FC · EP 2 "Saco de bolas" (26 s, rascunho 1, 12/11/2026)

Pauta 15 (aprovado em 07/11): o Pikachu chuta o Voltorb achando que é a bola; explosão, fumaça, plateia ri. Formato F1
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
