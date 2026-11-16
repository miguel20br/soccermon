---
description: Soccermon News #1 v9 (79,7 s, 9:16), telejornal com a dupla Raichu e Machoke de terno, vinheta de abertura nova (a bola-globo), a Rota com o Mercado, a entrevista com o Psyduck no vestiário e o Voltorb reagindo; linha do tempo real (gerada por linha.mjs), regra de leitura, música e como gerar.
---

# Soccermon News #1 v9 (79,7 s, 16/11/2026)

Da v8 pra v9, o que o Miguel pediu:

- **sem horário:** o relógio 19:00/19:01 saiu. O selo do canal (logo + SOCCERMON NEWS) fica o vídeo todo (menos vinheta,
  escalada e tela final); o **AO VIVO** só aparece no link de rua (o Meowth na Rota), com o ponto piscando;
- **o terno do Raichu cobre a bunda:** em 3/4 o paletó cobre o tronco inteiro até a mesa, costas e quadril incluídos (o
  pano se espalha do terno pelo pelo ligado a ele, sem atravessar o contorno preto, então o rabo fica de fora). Mesma
  troca de cor do sprite (`teste-gravata/gravata.mjs`, `terno.costas`), conferido nos 6 quadros do Idle de frente e
  em 3/4;
- **a vinheta de abertura nova (2 a 4,5 s):** a bola do jogo gira como um globo (CSS 3D: os 12 gomos pretos nos
  vértices do icosaedro e a grade de latitude e longitude em traços, o equador dourado), faixas de luz e linhas varrem a
  tela, e o logo monta em camadas: a placa abre, a faixa vermelha corre, as letras de SOCCERMON caem uma a uma, o NEWS
  fecha o espaçamento, o brilho passa e o #1 carimba. Na música: o pulso de sintetizador subindo, o tímpano em cada
  batida, o acorde dos metais com prato no logo e o tímpano no #1. A escalada abre com a mesma batida (a bola-globo
  pequena no banner e as linhas de luz em cada cartela);
- **animações acertadas:** veja "O que mudou nas animações";
- **sem a sonora do Magikarp** (a fala, a tarja e o retrato) e **sem o atraso no sinal** (o link é direto: o Raichu
  chama e corta pro Meowth em tela cheia);
- **a Rota com o que é da notícia:** a barraca do Mercado (placa MERCADO, toldo, balcão e os preços ₽3, ₽6 e ₽9
  pendurados, que balançam e pulam a cada vitória), a arquibancada com a torcida pulando no ritmo (e mais alto nas
  vitórias e no Pay Day), a faixa ROTA ÍNDIGO e dois holofotes balançando. A partida continua rolando atrás e o
  microfone continua no pedestal. O painel do ₽ ficou compacto no canto de cima;
- **a entrevista no vestiário do Pallet FC:** o Psyduck de pé (com a prancheta queimada), o Voltorb de colete sentado
  no banco atrás dele, a tarja PSYDUCK · TÉCNICO DO PALLET FC e a janelinha ESTÚDIO no canto com o Raichu de terno
  chamando. A escalada diz E MAIS: O VESTIÁRIO DO PALLET FC (a cartela com os armários e a sombra do Psyduck);
- **o Voltorb reage quando falam dele** (no gancho, no vestiário e no PRA FECHAR): pisca vermelho e brilha como um
  pavio (4 pulsos acelerando, a aura cresce), treme e incha, sua uma gota, fecha os olhos de alívio e volta ao normal.
  Na música, 4 "plins" subindo e a gota. No "reserva" ele murcha;
- **PRA FECHAR** no lugar de NOTA PÉ;
- **ritmo:** a caixa digita 1 letra a cada 25 ms (2x), cada fala fica no mínimo 2,7 s na tela e 1,8 s inteira depois
  de digitar; o retrato foi pra cima da caixa, à esquerda (como no PMD), e a caixa voltou à largura toda (de 28 a 946,
  fora da faixa dos botões; ~31 letras por linha, 2 linhas, a letra do mesmo tamanho). Só a f17 tem 2 páginas.

**Diferente do pedido:** o alvo era ~70–75 s; deu 79,7 s. Com 19 falas e a regra de leitura (1,8 s inteira depois de
digitar), só as falas somam ~60 s; com o gancho (2 s), a vinheta (2,5 s), a escalada (5,5 s), a tela final (3,2 s) e os
blocos começando na batida, não sobra onde cortar sem tirar fala.

## O que mudou nas animações (revisão quadro a quadro da v8)

- **quem fala:** o pulinho a cada palavra (tremido) virou um pulinho só no começo da fala e um balanço leve do corpo, a
  partir do pé, enquanto a caixa digita;
- **o Machoke em 3/4:** fica no quadro 0 (em pé); os quadros da flexão do Idle deixavam ele corcunda. De frente também
  (a flexão a cada 0,9 s parecia um tique) e ele respira devagar;
- **viradas:** quem vira pro parceiro tem um achatamento de 0,2 s na virada (não pula seco);
- **trocas de cena:** a cena nova entra em fade de 0,25 s com um leve recuo da câmera (as 2 varridas com a cartinha
  continuam secas, cobertas pela cartinha); o clipe do EP 2 entra e sai em fade;
- **câmera do estúdio:** a troca de plano dentro do estúdio desliza 0,5 s em vez de pular;
- **painéis:** entram em fade com subida (0,25 s, power3.out) e saem em fade (0,2 s); o telão troca em crossfade com a
  tela nova crescendo de 0,9 (back.out); a caixa e o retrato abrem e fecham com easing (0,24/0,2 s); o retrato troca de
  expressão em crossfade com um leve pulo de escala;
- **manchete, selo e AO VIVO:** entram e saem em fade (0,25/0,2 s);
- **painéis que ficavam embaixo do retrato:** a recompensa ficou menor, os troféus, a carta do Onix, o placar, as
  barras e a escalação do pacote subiram (nada fica atrás do retrato);
- **tarja de nome (GC):** fica logo acima da caixa, no lugar da aba de nome (a aba some enquanto a tarja está no ar);
- **tela final:** a bancada sobe e a turma entra (fade + subida, um de cada vez) antes do pulo;
- **jogadores da Rota:** os passos e o passe com easing (antes linear).

## Regra de leitura (linha.mjs)

- a caixa digita 1 letra a cada 25 ms e segura 0,15 s depois de pontuação no meio da frase;
- cada fala fica no mínimo 2,7 s na tela contando a digitação e no mínimo 1,8 s inteira depois de digitar; a página que
  não é a última, 1,2 s; no máximo 2 linhas por página;
- cada bloco novo (manchete nova) começa na batida (0,5 s) e o texto entra 0,3 s depois da manchete;
- a fala seguinte troca 0,1 s depois da anterior acabar.

## Linha do tempo (v9; música: 120 BPM, compasso = 2 s)

"Texto" = quando a 1ª letra aparece. Todos os instantes saem do `linha.mjs` (a cena lê `midia/som/news-falas.js`).

| Seg. | Manchete | Quem (retrato) | Fala (texto a partir de) | Imagem |
|---|---|---|---|---|
| 0–2 | PLANTÃO · VOLTORB VIRA RESERVA | — | — | o Voltorb de colete no banco do Pallet FC; reage em 0,45 (pavio, gota) |
| 2–4,5 | — | — | — | a vinheta de abertura: a bola-globo, as luzes, o logo em camadas, brilho em 3,55, #1 em 3,85 |
| 4,5–7,75 | SOCCERMON NEWS #1 | Raichu (happy) | Boa noite, Kanto! Eu sou o Raichu… (4,8) | a bancada; faíscas; GC RAICHU |
| 7,75–10,93 | | Machoke (happy) | …e eu sou o Machoke. Este é o Soccermon News! (7,85) | GC MACHOKE; o Raichu vira pra ele (3/4) |
| 10,93–14,05 | | Raichu (determined) | Hoje: as novidades da semana, e mais. (11,03) | VERSÃO NOVA: 0.9.51 em 11,03, + 0.9.52 em 11,4 |
| 14,5–20 | HOJE NO SOCCERMON NEWS | — | — | varrida 1; a vinheta curta; 4 cartelas (15 · 16,25 · 17,5 · 18,75), a 4ª: E MAIS: O VESTIÁRIO DO PALLET FC |
| 20–23,77 | PLANTÃO | Raichu (normal) | Na Copa do Dia e na Relâmpago, a recompensa da vitória mudou. (20,3) | a recompensa no telão; 21,13 o VT: as 3 opções, o holofote na Charanga em 21,83 |
| 23,77–27,25 | | Machoke (determined) | Em 4 de cada 10 vitórias, uma das opções é um Patrocínio… (23,88) | 10 troféus, 4 acendem (24,28 a 25,33), 4/10; o Patrocínio em 25,18 |
| 27,25–30,2 | | Raichu (joyous) | …um bônus forte que vale pro time inteiro. (27,35) | a carta do Onix, 0 × 1 PERDENDO, as barras +4 a partir de 27,6 |
| 30,5–34,23 | AO VIVO | Raichu (normal) | Agora, ao vivo da Rota Índigo, nosso repórter Meowth. (30,8) | o Meowth no telão |
| 34,23–37,48 | | Meowth (happy) | Boa noite! Aqui na Rota, cada jogo vencido (34,33) | corte pra Rota em tela cheia: Mercado, torcida, holofotes, a partida; AO VIVO no selo; GC MEOWTH |
| 37,48–40,27 | | Meowth (happy) | agora paga ₽3 pra gastar no Mercado. (37,58) | ₽3 em 37,85, ₽6 em 38,98 |
| 40,27–43,55 | | Meowth (joyous) | Três vitórias, ₽9. Pay Day! (40,38) | ₽9 em 40,9; o pulo no "Pay" (41,15), 14 moedas; a pose em 43 |
| 44–47,63 | VESTIÁRIO | Machoke (surprised) | No Vestiário do Pallet FC, uma bola explodiu no treino. (44,3) | o clipe do EP 2; o KABOOM em 45,35 |
| 47,63–48,63 | | (Raichu, sigh) | — | o Raichu de perto, sem graça, gota de suor (a banda para) |
| 48,63–51,75 | | Raichu (determined) | Psyduck, o que vocês fizeram com o Voltorb? (48,73) | o vestiário: o Psyduck de pé, o Voltorb no banco atrás; GC PSYDUCK; a janelinha ESTÚDIO; o Voltorb reage em 49,75 |
| 51,75–54,55 | | Psyduck (sigh) | Agora ele é reserva. (51,85) | o Psyduck balança; o Voltorb murcha no "reserva" |
| 55–58,55 | VEM AÍ | Raichu (inspired) | A partir de agora, sai atualização nova toda semana. (55,3) | varrida 2; o calendário TODA SEXTA; uma bola por sexta (56,9 a 58,1) |
| 58,55–61,98 | | Machoke (joyous) | E na sexta que vem, dia 27, abre o Time Ultimate… (58,65) | o 27/11 vira TIME ULTIMATE em 59,83 |
| 61,98–66,8 | | Raichu (joyous) | …o modo novo em que você abre pacotes / e monta o time da temporada. (62,08) | o pacote cai, rasga em 62,7, as cartas viram (64,3), o Mewtwo 93 em 64,75 e vem pro meio |
| 67–70,28 | PRA FECHAR | Machoke (happy) | E o Voltorb pediu pra avisar: ele tá bem. (67,3) | o Voltorb no telão: reage em 67,4, pula no "bem" (68,38) |
| 70,28–73,4 | | Raichu (happy) | Muito obrigado pela companhia, e boa noite! (70,38) | faíscas no "boa noite" (71,35) e uma reverência |
| 73,4–76,5 | | Todos (os 4) | Temos que chutar! (73,5) | o Meowth e o Psyduck no telão; todos pulam (73,8 e 74) |
| 76,5–79,7 | — | — | — | tela final: logo, Temos que chutar!, soccermon.com e a turma (3,2 s) |

## Música

`scripts/musica/pecas/news-plantao.mjs` (120 BPM, Dó dórico) importa o `linha.mjs`: a cama de cada bloco começa no corte
dele (o groove do estúdio na abertura, no vestiário e no PRA FECHAR; o funk leve nas matérias; sobe pra Ré no Time
Ultimate e vai pra Mi♭ depois do Mewtwo). O gancho tem a batida de plantão e o fusível do Voltorb; a vinheta, o pulso de
sintetizador subindo, o tímpano e o acorde dos metais no logo; a escalada abre com a mesma batida e cada cartela é uma
batida; um toque (metais, sino e prato) em cada manchete; a varrida nas 2 transições e um whoosh curto nas outras trocas;
palmas da torcida no corte pra Rota. Os sons das animações caem nos mesmos instantes do `linha.mjs`. A banda só para na
reação sem graça do Raichu. No "Temos que chutar!" os metais tocam o ritmo do grito; na tela final o SOC-CER-MON e o fecho
em Mi♭. Os blips ficam em `news-voz.wav`.

## Gerar

```bash
# o clipe do EP 2: 20,5 a 28 s do render v7 do ep14 (o KABOOM em 3,5 s do arquivo)
scripts/pesado.sh ffmpeg -ss 20.5 -t 7.5 -i <ep14>/trailer/curtas/vestiario-bolas/render/v7.mp4 -an -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p trailer/curtas/midia/news/bola-fora-longa.mp4
# sprites (com o 67), retratos, a dupla de terno, a linha do tempo + blips e só a música do News, em −14 LUFS
scripts/pesado.sh node trailer/curtas/preparar.mjs news
# (mudou só uma fala? node trailer/curtas/news-01/linha.mjs trailer/curtas/midia/som refaz o news-falas.js, os blips e
#  as durações fixas do index.html; depois a música: o preparar.mjs news)
# o terno do Raichu (v9: cobre as costas e o quadril em 3/4) sai do teste-gravata/gravata.mjs, no preparar.mjs
node trailer/qa-quadros.mjs trailer/curtas/news-01                      # 0 problema(s)
cd trailer/curtas && ../../scripts/pesado.sh npx hyperframes render news-01 -q high -w 1 --no-browser-gpu -o news-01/render/v9.mp4
scripts/pesado.sh trailer/curtas/finalizar.sh trailer/curtas/news-01/render/v9.mp4 ~/Vídeos/soccermon-postar/pauta-16-22/news-01-v9
```

As cartas e o pacote (v6): `BASE_URL=http://localhost:<p> node trailer/curtas/news-01/cartas.mjs trailer/curtas/midia/news/cartas 25 143 95 26 130 150 pack`.
A v8 (136,5 s) está no commit f5119283; a v7 (75,6 s, o Pikachu apresentando) no c15b52ed; a v6 no f01b7ac1; a v5c no d91dbca5.
