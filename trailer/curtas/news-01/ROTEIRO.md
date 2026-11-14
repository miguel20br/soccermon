---
description: Soccermon News #1 v2 (35 s, 9:16, mais calma), o jornal da 0.9.51; linha do tempo real, regra de leitura e como gerar.
---

# Soccermon News #1 v2 (35 s, 14/11/2026)

Roteiro aprovado em `docs/marketing/news-01.md` (pauta 21, sex 20/11 19h). A v1 (41 s) ficou frenética e difícil de ler;
a v2 segue a linha do tempo nova aprovada pelo Miguel. Bancada animada com sprites PMD, vinheta de plantão e trechos do
jogo; sem voz, a fala vai em legenda embaixo. Duelos, a bola amassando na trave, os ₽3 da Rota e o "Mais leve no
celular" saíram (ficam pro News #2; as capturas continuam em `trailer/curtas/midia/news`).

**Regra de leitura:** um texto por vez (cartela no alto, tarja ou fala embaixo; nunca dois juntos), cada um parado no
mínimo 2 s, até 5 palavras. Só o gancho e a vinheta têm corte de menos de 2 s. O selo AO VIVO · PLANTÃO fica pequeno e
fixo no topo de 3 s a 32 s. O telão e a frente da bancada mostram o símbolo do jogo, não letreiro. A tela final é a
exceção aprovada (logo, "Temos que chutar!" e o site juntos; o selo "grátis no navegador" e o crédito saíram).

## Linha do tempo (música: 120 BPM, compasso = 2 s)

| Seg. | Quadro | Imagem | Texto (o único na tela) | Tempo do texto |
|---|---|---|---|---|
| 0–2 | Gancho | o gol em câmera lenta (gol.mp4 de 1,3 s: o goleiro, o flash do gol); corte em 1 s pro artilheiro pulando de perto (gol-pulo.mp4, o pulo a 0,6x, zoom 1,35) | — | — |
| 2–3 | Vinheta | faixas varrendo, placa SOCCERMON NEWS, a bola girando em cima, selo #1 em 2,5 s | a placa | 1 s (vinheta) |
| 3–8 | Barra de golpe | o botão do capitão grande; os gomos acendem devagar (gomos-lento.mp4) em 4,25, 5 e 6 s, com um estouro em cada | BARRA DE GOLPE NOVA · ATÉ O N3 | 3,05–5,5 (2,45 s) · 5,6–8,0 (2,4 s) |
| 8–10 | Meowth | a bancada de perto, o 40% no telão; o Meowth faz pose | 40% (telão) | 2,0 s |
| 10–12 | Meowth | o 1 de 3 ampliado 1,5x no Patrocínio (Charanga de Pewter), a moldura dourada pulsando | PATROCÍNIO NA RECOMPENSA | 2,0 s |
| 12–14 | Meowth | chovem 9 moedas na bancada, o Meowth pula e junta tudo com as patas (13,4 s) | Pay Day! | 2,0 s |
| 14–18,5 | Porygon | ele sobe na cadeira atrás da bancada (longe da borda direita); ele e o estúdio borrados | PORYGON · CONVIDADO · "Antes eu era borrado." | 14,1–16,4 (2,1 s parada) · 16,45–18,5 (2,05 s) |
| 18,5–21 | Porygon | a quadra de perto, nítida (close.mp4 de 0,65 s: sem o ícone de status; termina no chute do Persian) | "Agora eu tenho quina." | 2,5 s |
| 21–26 | Alakazam | a colher brilha; no telão, o calendário das 4 sextas, uma bola em cada (23,5, 24, 24,5 e 25 s) | ALAKAZAM · APRESENTADOR · ATUALIZAÇÃO TODA SEMANA | 21,05–23,35 (2,1 s parada) · 23,4–26,0 (2,6 s) |
| 26–28,8 | Vem aí | a fatia do Time Ultimate da tela do jogo, ampliada num painel | TIME ULTIMATE · EM BREVE 27/11 (da própria tela) | 2,9 s |
| 28,8–32 | Vem aí | a carta ouro sai do pacote girando, vira em 30 s (flash) e flutua no meio, sem ninguém atrás | FALTAM 7 DIAS | 30,0–32,0 (2,0 s) |
| 32–35 | Tela final | logo com a piscada SOC-CER-MON, Temos que chutar!, soccermon.com, os três na bancada pulando no MON | (tela final) | 3 s |

"Agora é uma atualização por semana." virou só a cartela ATUALIZAÇÃO TODA SEMANA (a fala saiu). A tarja do Meowth saiu
(o 40% e o Patrocínio ocupam os 6 s dele; três textos de 2 s). O "Sexta que vem, Time Ultimate." saiu: a própria fatia
do jogo diz TIME ULTIMATE e EM BREVE 27/11.

## Música

`scripts/musica/pecas/news-plantao.mjs` (vinheta de plantão própria, molde do livre-ditto), refeita pra v2 com 18
compassos: funk em Dó dórico com o motivo do jornal nos metais; cada personagem canta com a própria voz (Alakazam =
teremim, Meowth = `miau`, Porygon = `bit`, as duas em `scripts/musica/curtas.mjs`); a banda fica abafada no Porygon
borrado (14–18,5 s) e abre no "quina" com o zap; sobe pra Ré no Vem aí (21 s) e pra Mi♭ maior na carta (30 s); os três
cantam o SOC-CER-MON na tela final e acaba no "ting" da colher (34 s). Groove leve nos trechos com texto pra ler.
Detalhes no comentário do topo da peça.

## Gerar

```bash
scripts/pesado.sh node trailer/curtas/preparar.mjs                      # sprites, retratos, logo e as trilhas (news-14.wav)
npx vite --config vite/config.dev.mjs --port 8137 --strictPort          # em outro terminal
BASE_URL=http://localhost:8137 scripts/pesado.sh node trailer/curtas/news-01/capturar.mjs trailer/curtas/midia/news
# os lances (CHROME_PATH = o Chromium do Playwright, BASE_URL igual):
scripts/pesado.sh node scripts/trailer-capture.mjs --demo "dribles&evento=goal" --de 14.5 --ate 16.6 --vel 0.4 --vertical 528 --out trailer/curtas/midia/news/gol-l
scripts/pesado.sh node scripts/trailer-capture.mjs --demo "dribles&evento=post" --de 110.3 --ate 113.4 --lento 110.75:111.15:0.4:0.15,112.55:113.0:0.3:0.15 --vertical 528 --out trailer/curtas/midia/news/trave-l
scripts/pesado.sh node scripts/trailer-capture.mjs --demo "dribles" --ate +5.5 --vertical 300 --out trailer/curtas/midia/news/close
# v2: gomos-lento.mp4 (os PNG de gomos/ retimados: o 1º gomo em 1,25 s, o 2º em 2 s e o N3 em 3 s, 5 s no total) e
# gol-pulo.mp4 (gol-l/ de 5,05 a 5,85 s, o pulo de 5,35 a 5,65 s a 0,6x): links simbólicos quadro a quadro + ffmpeg crf 14
# PNG → mp4 (crf 14, 30 fps) e os recortes das telas: patrocinio-c (y 100, 640; duelos-c e rota-c são do News #2),
# gomos (1080x528), ultimate-fatia.png (520x470 em 32,1170 do último quadro de ultimate/), carta-ouro.png (o .pc2 do ?cards=1, 4x)
node trailer/qa-quadros.mjs trailer/curtas/news-01                      # 0 problema(s)
cd trailer/curtas && ../../scripts/pesado.sh npx hyperframes render news-01 -q high -w 1 --no-browser-gpu -o news-01/render/v2.mp4
scripts/pesado.sh trailer/curtas/finalizar.sh trailer/curtas/news-01/render/v2.mp4 ~/Vídeos/soccermon-postar/pauta-16-22/news-01-v2
```
