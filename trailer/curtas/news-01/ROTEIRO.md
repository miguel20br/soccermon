---
description: Soccermon News #1 v10 (85,7 s, 9:16), telejornal com a dupla Raichu e Machoke de terno; ritmo "texto, coisinha, texto" com 7 beats sem texto, uma manchete por vez, o Psyduck de volta à bancada, o Voltorb no banco e 3 vinhetas pro Miguel escolher; linha do tempo real (gerada por linha.mjs), regra de leitura, música e como gerar.
---

# Soccermon News #1 v10 (85,7 s, 16/11/2026)

Composição pronta, **sem render**: a música vai ser trocada. Prévia em quadros parados: `previa.mjs` (abaixo).

Da v9 pra v10, o que o Miguel pediu:

- **o Psyduck volta pra bancada** (como na v8): sentado na cadeira de convidado, na ponta, ao lado do Raichu, que vira
  pra ele na pergunta e escuta a resposta. Saiu a entrevista no vestiário com a janelinha ESTÚDIO;
- **o corte pro Voltorb voltou**: depois de "Agora ele é reserva.", o Voltorb sozinho no banco do vestiário, de colete,
  1,45 s sem texto: pisca, se encolhe, solta uma faísca e olha pros lados;
- **"texto, coisinha, texto"**: entre os blocos de fala entra um beat visual de 0,95 a 1,45 s sem texto nenhum: a caixa
  fecha, a manchete sai e só fica a imagem (`beat()` no `linha.mjs`, exportados em `BEATS`). Os 7 beats estão na tabela;
- **fácil de ler**: texto só na caixa de fala e numa manchete por vez; uma ação de fundo por vez. O que saiu da tela:
  - **tarjas de nome (GC)** do Raichu, do Machoke, do Meowth e do Psyduck: o nome fica na aba da caixa, e o cargo do
    repórter e do convidado vai junto (MEOWTH · REPÓRTER, PSYDUCK · TÉCNICO);
  - **o selo do canal** ficou só com o símbolo (sem o texto SOCCERMON NEWS) e sem a etiqueta AO VIVO (o AO VIVO já é a
    manchete do bloco);
  - **telão da versão**: saiu a fita VERSÃO NOVA (ficam 0.9.51 e + 0.9.52, que são a notícia);
  - **escalada**: saíram os números das cartelas (1, 2, 3, +), a bola-globo do banner e as linhas de luz;
  - **f6 (o bônus)**: saíram o placar 0 × 1, o PERDENDO, o bumbo e os números das 6 barras; ficam a carta do Onix
    (no meio) e as barras com o rótulo e o +4;
  - **a Rota**: saíram os preços ₽3/₽6/₽9 e a placa MERCADO (a barraca fica só como cenário: toldo e balcão) e a faixa
    ROTA ÍNDIGO; a torcida virou uma fileira só, sem pulinho a cada batida (pula uma vez, no Pay Day); os holofotes
    pararam de balançar; a partida rola até o Pay Day e para;
  - **estúdio**: saiu o vapor das canecas (o fundo fica só com os raios do telão);
  - **vestiário**: saiu a janelinha ESTÚDIO (a entrevista voltou pra bancada);
- **a vinheta da bola-globo saiu.** No lugar, 3 alternativas, todas com o logo do jogo (`logo-horizontal.svg`, não
  escrito em fonte), a faixa vermelha com NEWS e o #1 carimbando em 3,85 s, nas cores e na Galmuri da marca:
  - **A**: a bola de pixel do jogo (a do `ensureBallTexture`, 18 x 18, 30 px por pixel) girando quadro a quadro (8
    quadros a 12 fps), linhas de luz em pixel andando em degraus; a placa do logo abre em degraus embaixo;
  - **B**: sem bola: 4 faixas de cor da marca (amarelo, vermelho, azul, azul-noite) varrem a tela na diagonal, duas
    faixas finas ficam atrás do logo e a placa entra de lado;
  - **C**: a cartinha da marca (a das transições) gira no eixo Y cada vez mais rápido e, de lado, vira a placa do logo.

  A escolha é a constante `VINHETA` no `index.html` (ou `?vinheta=a|b|c` na prévia). Está em A só por ser a primeira:
  **falta o Miguel escolher**.

Fica da v9: a dupla de terno, os retratos, os blips suaves, a digitação a 25 ms, as falas (sem o Magikarp e sem o
atraso), PRA FECHAR, as reações do Voltorb (o pavio no gancho e no PRA FECHAR), sem relógio, o Growlithe escondido.
As notas da v9 (as animações acertadas quadro a quadro) estão no commit 29885b2d.

**Pra música nova** (o `linha.mjs` mudou): os instantes mudaram todos depois de 14 s. `M.voltorbReage[1]` agora é o
começo do beat do Voltorb no banco (57,55), com a gag em `M.gag` (pisca, encolhe, faísca, olha, volta); `M.payFim` é o
beat das moedas (1,35 s); os beats estão em `BEATS` (`nome`, `s`, `z`) e cada um tem a sua chave em `M`. `M.perdendo`
continua existindo, mas o PERDENDO saiu da tela. `CORTES` tem os cortes novos.

## Regra de leitura (linha.mjs)

- a caixa digita 1 letra a cada 25 ms e segura 0,15 s depois de pontuação no meio da frase;
- cada fala fica no mínimo 2,7 s na tela contando a digitação e no mínimo 1,8 s inteira depois de digitar; a página que
  não é a última, 1,2 s; no máximo 2 linhas por página;
- cada bloco novo (manchete nova) começa na batida (0,5 s) e o texto entra 0,3 s depois da manchete;
- a fala seguinte troca 0,1 s depois da anterior acabar.

## Linha do tempo (v10; música: 120 BPM, compasso = 2 s)

"Texto" = quando a 1ª letra aparece. **BEAT** = sem texto nenhum (a caixa fechada, sem manchete). Todos os instantes
saem do `linha.mjs` (a cena lê `midia/som/news-falas.js`).

| Seg. | Manchete | Quem (retrato) | Fala (texto a partir de) | Imagem |
|---|---|---|---|---|
| 0–2 | PLANTÃO · VOLTORB VIRA RESERVA | — | — | o Voltorb de colete no banco do Pallet FC; reage em 0,45 (pavio, gota) |
| 2–4,5 | — | — | — | a vinheta (A, B ou C); o #1 em 3,85 |
| 4,5–7,75 | SOCCERMON NEWS #1 | Raichu (happy) | Boa noite, Kanto! Eu sou o Raichu… (4,8) | a bancada; faíscas |
| 7,75–10,93 | | Machoke (happy) | …e eu sou o Machoke. Este é o Soccermon News! (7,85) | o Raichu vira pra ele (3/4) |
| 10,93–14,05 | | Raichu (determined) | Hoje: as novidades da semana, e mais. (11,03) | no telão, 0.9.51 em 11,03 e + 0.9.52 em 11,4 |
| **14,05–15** | — | — | **BEAT bDupla (0,95 s)** | a câmera abre na bancada, a dupla se olha e acena; o telão volta pro símbolo |
| 15–20,5 | (HOJE NO SOCCERMON NEWS) | — | — | varrida 1; 4 cartelas (15,5 · 16,75 · 18 · 19,25), a 4ª: E MAIS: O VESTIÁRIO DO PALLET FC |
| **20,5–21,5** | — | — | **BEAT bCartas (1 s)** | de volta ao estúdio, a câmera perto do telão: 3 cartas viradas caem nele |
| 21,5–25,28 | PLANTÃO | Raichu (normal) | Na Copa do Dia e na Relâmpago, a recompensa da vitória mudou. (21,8) | a recompensa no telão; 22,63 o VT: as 3 opções, o holofote na Charanga em 23,33 |
| 25,28–28,75 | | Machoke (determined) | Em 4 de cada 10 vitórias, uma das opções é um Patrocínio… (25,38) | 10 troféus, 4 acendem (25,78 a 26,83), 4/10; o Patrocínio em 26,68 |
| 28,75–31,7 | | Raichu (joyous) | …um bônus forte que vale pro time inteiro. (28,85) | a carta do Onix e as 6 barras, +4 a partir de 29,1 |
| **31,7–33** | — | — | **BEAT bRua (1,3 s)** | a câmera vai pra rua: chega perto do telão, ele chia e abre na Rota, o Meowth acena |
| 33–36,73 | AO VIVO | Raichu (normal) | Agora, ao vivo da Rota Índigo, nosso repórter Meowth. (33,3) | o Meowth no telão |
| 36,73–39,98 | | Meowth (happy) | Boa noite! Aqui na Rota, cada jogo vencido (36,83) | corte pra Rota em tela cheia: a partida rolando atrás |
| 39,98–42,78 | | Meowth (happy) | agora paga ₽3 pra gastar no Mercado. (40,08) | ₽3 em 40,35, ₽6 em 41,48 |
| 42,78–45,65 | | Meowth (joyous) | Três vitórias, ₽9. Pay Day! (42,88) | ₽9 em 43,4; o pulo no "Pay" (43,65), a torcida pula, 14 moedas |
| **45,65–47** | — | — | **BEAT payFim (1,35 s)** | as moedas assentam e o Meowth faz a pose |
| 47–50,63 | VESTIÁRIO | Machoke (surprised) | No Vestiário do Pallet FC, uma bola explodiu no treino. (47,3) | o clipe do EP 2; o KABOOM em 48,35 |
| 50,63–51,63 | | (Raichu, sigh) | — | o Raichu de perto, sem graça, gota de suor (a banda para) |
| 51,63–54,75 | | Raichu (determined) | Psyduck, o que vocês fizeram com o Voltorb? (51,73) | a bancada: o Psyduck na cadeira de convidado, o Raichu vira pra ele; fumacinha da prancheta |
| 54,75–57,55 | | Psyduck (sigh) | Agora ele é reserva. (54,85) | o Psyduck balança, a mão na cabeça |
| **57,55–59** | — | — | **BEAT bVoltorb (1,45 s)** | o Voltorb sozinho no banco: pisca 57,7, se encolhe 57,9, faísca 58,15, olha pros lados 58,4 e 58,65, volta 58,87 |
| 59–62,55 | VEM AÍ | Raichu (inspired) | A partir de agora, sai atualização nova toda semana. (59,3) | varrida 2; o calendário TODA SEXTA; uma bola por sexta (60,9 a 62,1) |
| 62,55–65,98 | | Machoke (joyous) | E na sexta que vem, dia 27, abre o Time Ultimate… (62,65) | o 27/11 vira TIME ULTIMATE em 63,83 |
| 65,98–70,8 | | Raichu (joyous) | …o modo novo em que você abre pacotes / e monta o time da temporada. (66,08) | o pacote rasga em 66,7, as cartas viram (68,3), o Mewtwo 93 em 68,75 |
| **70,8–72** | — | — | **BEAT bRola (1,2 s)** | o estúdio aberto: o Voltorb entra rolando no telão e para |
| 72–75,28 | PRA FECHAR | Machoke (happy) | E o Voltorb pediu pra avisar: ele tá bem. (72,3) | o Voltorb no telão: reage em 72,4, pula no "bem" (73,38) |
| **75,28–76,28** | — | — | **BEAT bRisada (1 s)** | a câmera abre, a dupla se olha e ri; o Voltorb pisca no telão |
| 76,28–79,4 | (PRA FECHAR) | Raichu (happy) | Muito obrigado pela companhia, e boa noite! (76,38) | faíscas no "boa noite" (77,35) e uma reverência |
| 79,4–82,5 | | Todos (os 4) | Temos que chutar! (79,5) | o Meowth e o Psyduck no telão; todos pulam (79,8 e 80) |
| 82,5–85,7 | — | — | — | tela final: logo, Temos que chutar!, soccermon.com e a turma (3,2 s) |

## Música (a da v9: vai ser trocada; o compositor lê os instantes novos do linha.mjs)

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
# prévia sem render: um quadro por bloco e por beat, e as 3 vinhetas (news-v10-previa.png, news-v10-vinhetas.png)
scripts/pesado.sh node trailer/curtas/news-01/previa.mjs ~/Vídeos/soccermon-postar/pauta-16-22
cd trailer/curtas && ../../scripts/pesado.sh npx hyperframes render news-01 -q high -w 1 --no-browser-gpu -o news-01/render/v10.mp4
scripts/pesado.sh trailer/curtas/finalizar.sh trailer/curtas/news-01/render/v10.mp4 ~/Vídeos/soccermon-postar/pauta-16-22/news-01-v10
```

As cartas e o pacote (v6): `BASE_URL=http://localhost:<p> node trailer/curtas/news-01/cartas.mjs trailer/curtas/midia/news/cartas 25 143 95 26 130 150 pack`.
A v9 (79,7 s) está no commit 29885b2d; a v8 (136,5 s) no f5119283; a v7 (75,6 s, o Pikachu apresentando) no c15b52ed; a v6 no f01b7ac1; a v5c no d91dbca5.
