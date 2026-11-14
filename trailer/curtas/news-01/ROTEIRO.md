---
description: Soccermon News #1 (41 s, 9:16), o jornal da 0.9.51; linha do tempo real, gravação e como gerar.
---

# Soccermon News #1 (41 s, primeiro corte, 14/11/2026)

Roteiro aprovado em `docs/marketing/news-01.md` (pauta 21, sex 20/11 19h). Bancada animada com sprites PMD, vinheta de
plantão e trechos do jogo; sem voz, a fala vai em legenda embaixo (até 5 palavras).

## Linha do tempo (música: 120 BPM, compasso = 2 s)

| Seg. | Quadro | Imagem | Fala | Cartela |
|---|---|---|---|---|
| 0–2 | Gancho | gol em câmera lenta (0,4x): a bola passa o goleiro e entra, flash; corte pro artilheiro pulando | — | SAIU A 0.9.51 |
| 2–3 | Vinheta | faixas varrendo, placa SOCCERMON NEWS, a bola girando em cima, selo #1 | — | — |
| 3–4 | Bancada | Alakazam e Meowth; tarjas ALAKAZAM · APRESENTADOR e MEOWTH · ECONOMIA; brilho da colher | Boa noite. | SOCCERMON NEWS #1 |
| 4–7 | Plantão | o botão do capitão com a barrinha Gomos enchendo; N1, N2 e N3 grandes a cada gomo | — | BARRA DE GOLPE NOVA |
| 7–10 | Plantão | Arena → toque em Seus duelos → a gaveta com o placar contra cada amigo | — | PLACAR CONTRA CADA AMIGO |
| 10–13 | Plantão | chute forte (a bola amassa), câmera lenta, a bola na trave, a trave treme | — | A BOLA AMASSA |
| 13–15 | Número da semana | Meowth de perto (a câmera chega), tarja MEOWTH · ECONOMIA; o 40% no telão em 14 s | Esse quadro é meu. | PATROCÍNIO NA RECOMPENSA (14 s) |
| 15–17 | Número da semana | o 1 de 3: o pacote abre e o Patrocínio (Charanga de Pewter) ganha a moldura dourada | — | (segue) |
| 17–19 | Número da semana | vitória num Jogo da Rota (+₽9); as 9 moedas voam pro contador, 27 → 36 | — | ₽3 POR JOGO NA ROTA |
| 19–21 | Número da semana | bancada: chovem 11 moedas, o Meowth pula e junta tudo com a pata | Pay Day! | (segue) |
| 21–24 | Convidado | Porygon chega na cadeira; ele e o estúdio borrados; tarja PORYGON · CONVIDADO | Antes eu era borrado. | — |
| 24–28 | Convidado | a quadra de perto, nítida, o lance correndo | Agora eu tenho quina. | SPRITES NÍTIDOS |
| 28–30 | Convidado | o Porygon gira uma vez na cadeira | — | MAIS LEVE NO CELULAR |
| 30–33 | Vem aí | Alakazam; no telão, o calendário das 4 sextas (20/11, 27/11, 04/12, 11/12), uma bola em cada | Agora é uma atualização / por semana. | ATUALIZAÇÃO TODA SEMANA |
| 33–36 | Vem aí | a fatia do Time Ultimate (EM BREVE 27/11) no telão; a carta ouro sai dele girando | Sexta que vem, Time Ultimate. | TIME ULTIMATE 27/11 |
| 36–38 | Vem aí | a carta termina de virar (flash e estouro) e flutua | — | FALTAM 7 DIAS |
| 38–41 | Tela final | logo com a piscada SOC-CER-MON, Temos que chutar!, soccermon.com, os três na bancada pulando no MON | — | — |

A fala "Agora é uma atualização por semana." (7 palavras) virou duas legendas, pra caber no limite de 5.

## Música

`scripts/musica/pecas/news-plantao.mjs` (vinheta de plantão própria, molde do livre-ditto): funk em Dó dórico com o motivo
do jornal nos metais; cada personagem canta com a própria voz (Alakazam = teremim, Meowth = `miau`, Porygon = `bit`,
as duas novas em `scripts/musica/curtas.mjs`); sobe pra Ré no Vem aí e pra Mi♭ maior na carta; os três cantam o
SOC-CER-MON na tela final. Detalhes no comentário do topo da peça.

## Gerar

```bash
scripts/pesado.sh node trailer/curtas/preparar.mjs                      # sprites, retratos, logo e as trilhas (news-14.wav)
npx vite --config vite/config.dev.mjs --port 8137 --strictPort          # em outro terminal
BASE_URL=http://localhost:8137 scripts/pesado.sh node trailer/curtas/news-01/capturar.mjs trailer/curtas/midia/news
# os lances (CHROME_PATH = o Chromium do Playwright, BASE_URL igual):
scripts/pesado.sh node scripts/trailer-capture.mjs --demo "dribles&evento=goal" --de 14.5 --ate 16.6 --vel 0.4 --vertical 528 --out trailer/curtas/midia/news/gol-l
scripts/pesado.sh node scripts/trailer-capture.mjs --demo "dribles&evento=post" --de 110.3 --ate 113.4 --lento 110.75:111.15:0.4:0.15,112.55:113.0:0.3:0.15 --vertical 528 --out trailer/curtas/midia/news/trave-l
scripts/pesado.sh node scripts/trailer-capture.mjs --demo "dribles" --ate +5.5 --vertical 300 --out trailer/curtas/midia/news/close
# PNG → mp4 (crf 14, 30 fps) e os recortes das telas: duelos-c (y 270, 910 px), patrocinio-c (y 100, 640), rota-c (y 0, 830),
# gomos (1080x528), ultimate-fatia.png (520x470 em 32,1170 do último quadro de ultimate/), carta-ouro.png (o .pc2 do ?cards=1, 4x)
node trailer/qa-quadros.mjs trailer/curtas/news-01                      # 0 problema(s)
cd trailer/curtas && ../../scripts/pesado.sh npx hyperframes render news-01 -q high -w 1 --no-browser-gpu -o news-01/render/v1.mp4
scripts/pesado.sh trailer/curtas/finalizar.sh trailer/curtas/news-01/render/v1.mp4 ~/Vídeos/soccermon-postar/pauta-16-22/news-01
```
