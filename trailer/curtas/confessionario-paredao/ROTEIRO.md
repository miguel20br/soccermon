# Confessionário · EP 1 "Paredão" (28 s, rascunho 1, 12/11/2026)

Pauta 14 (aprovado em 07/11): quem vai pro banco? O Magikarp faz campanha com a medalha, o Pikachu faz pose, o Snorlax
dorme na cabine; quem sai é o Ditto, que estava fingindo ser o Psyduck. Formato F2 da [bíblia](../BIBLIA.md): paródia
de reality (cabine com cortina, luz de cima, câmera tremendo, REC, DIA 1, o TUM-TUM de eliminação).

**Miolo cômico:** o apresentador do paredão é o "Psyduck" com os olhinhos de ponto e a boca de risco do Ditto desde
o primeiro plano (quem repara ri antes). As três campanhas são três jeitos de errar: a medalha enfiada na lente até
tampar a câmera, as poses que estouram a câmera de tanto choque (chiado de TV e o Pikachu tostado), e o Snorlax que
dorme e só fala "…ME ACORDA NO JOGO.". O Psyduck de verdade entra, "?", segura a cabeça; o disfarce derrete (BOING) e o
carimbo PRO BANCO cai na carta do Ditto. Tag na tela final: no banco, o Ditto olha o Snorlax dormindo e vira um
Snorlax pequenininho pra dormir junto.

120 BPM, compasso = 2 s. Trilha `scripts/musica/pecas/livre-paredao.mjs` (Ré menor → Sol).

| C | Seg. | Plano | Texto |
|---|---|---|---|
| 0 | 0 | Abertura: placa CONFESSIONÁRIO (TUM), fita DIA 1, EPISÓDIO 1 · PAREDÃO (TUM) | CONFESSIONÁRIO · DIA 1 · PAREDÃO |
| 1 | 2 | O paredão: as 3 cartas caem; o "Psyduck" (cara do Ditto) aparece | QUEM VAI PRO BANCO? |
| 2 | 4 | Cabine: o Magikarp pula na poltrona | EU SOU O CAPITÃO. |
| 3 | 6 | Punch-in: a medalha cresce até tampar a lente, brilho, apito | — |
| 4 | 8 | Cabine: o Pikachu, uma pose por tempo, flash | — |
| 5 | 10 | Mais rápido; o choque estoura a câmera (chiado) e ele volta tostado | — |
| 6 | 12 | Cabine: o Snorlax dorme na poltrona | — |
| 7 | 14 | Punch-in: fala dormindo | …ME ACORDA NO JOGO. |
| 8 | 16 | A eliminação: a luz corre pelas cartas | QUEM SAI É… |
| 9 | 18 | Breque: o Psyduck de verdade entra, "?", segura a cabeça; punch-in no impostor, gota | ? |
| 10 | 20 | BOING: vira o Ditto; a carta dele cai no meio; carimbo | PRO BANCO |
| 11–13 | 22 | Tela final; no banco o Ditto vira um Snorlax pequenininho e dorme junto | Temos que chutar! · soccermon.com |

## Gerar

```bash
node trailer/curtas/musica.mjs trailer/curtas/midia/som paredao   # + loudnorm → midia/som/paredao-14.wav
node trailer/curtas/confessionario-paredao/gerar.cjs              # img/54-ditto.png (já no git)
cd trailer/curtas && ../../scripts/pesado.sh npx hyperframes render confessionario-paredao -q high -w 1 --no-browser-gpu -o <render.mp4>
scripts/pesado.sh trailer/curtas/finalizar.sh <render.mp4> <saida>
```
