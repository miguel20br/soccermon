---
description: Soccermon News #1 v8 (136,5 s, 9:16), telejornal com a dupla Raichu e Machoke de terno na bancada, retrato PMD em toda fala e blips suaves; linha do tempo real (gerada por linha.mjs), regra de leitura, música e como gerar.
---

# Soccermon News #1 v8 (136,5 s, 15/11/2026)

Na v8 o Miguel aprovou um roteiro novo (falas exatas) e o visual dos testes (`teste-golduck`, `teste-gravata`,
`teste-machoke`):

- **a dupla na bancada:** o Raichu (26, escala 13, a linha 28 do quadro no tampo) à esquerda e o Machoke (67, escala
  15, linha 22) à direita, os dois de terno no marinho do Machoke. O Raichu com a gravata vermelha comprida e a gola 1
  linha mais baixa (`desce = 1`, sem sombra no queixo nem pontas de gola); o Machoke com a gravata dourada no eixo. Os
  sprites vestidos saem do `preparar.mjs` (`midia/sp/26-terno.png` e `67-terno.png`, só o Idle de frente e o 3/4).
  Quem escuta vira pro parceiro (o 3/4 do Idle); o Raichu espelha o 3/4 pra olhar o Psyduck. Canecas na mesa (a
  amarela do Raichu, a azul do Machoke) e cadeiras vinho escuro. O telão subiu pra y 330 e tudo nele fica acima das
  cabeças;
- **o Psyduck** senta na cadeira de convidado na ponta esquerda da bancada (x −250, fora do plano aberto): aparece só
  no plano CONVIDADO, com o Raichu;
- **a caixa de fala com o retrato PMD** ao lado (o do teste do Golduck: retrato 4x, nearest-neighbor) e a expressão
  escolhida pelo sentido de cada fala (tabela abaixo); na reação sem graça do Raichu (86) só o retrato `26-sigh`; no
  "Temos que chutar!" os quatro retratos juntos;
- **blips suaves** pra todos (`curtas.mjs`: `blipRaichu`, e os novos `blipMachoke` Dó 4 calmo, `blipMeowth` Sol 5,
  `blipPsyduck` Mi 4 e `blipMagikarp` Ré 5, todos triangulares, sem saturação), num arquivo à parte (`news-voz.wav`,
  sem normalizar). As vozes cantadas (`pika`, `miau`, `psy`, o PLOF) saíram da música. A banda abaixa 3 dB enquanto a
  caixa digita;
- **manchete com o nome do bloco** (PLANTÃO · VOLTORB VIRA RESERVA no gancho, SOCCERMON NEWS #1, PLANTÃO, AO VIVO,
  VESTIÁRIO, VEM AÍ, NOTA PÉ; na escalada o banner HOJE NO SOCCERMON NEWS) e o **selo 19:00 · AO VIVO** no canto o
  vídeo todo (menos vinheta, escalada e tela final), virando 19:01 em 66,4 (o corte pro Meowth em tela cheia);
- **GC** na primeira aparição: RAICHU · APRESENTADOR, MACHOKE · APRESENTADOR, MAGIKARP · JOGADOR DO PALLET FC, MEOWTH ·
  REPÓRTER · ROTA ÍNDIGO (a pequena, na tela dividida), PSYDUCK · TÉCNICO DO PALLET FC, e a tarja VOLTORB · RESERVA no
  banco;
- **só 2 transições com a cartinha** (a varrida de 0,44 s: 20,5 e 97,5); os outros cortes são secos com um whoosh curto;
- **novo:** o gancho com o Voltorb de colete no banco; o selo VERSÃO NOVA com 0.9.51 e + 0.9.52 no "Hoje"; a tarja
  ATRASO NO SINAL no link; uma partida rolando atrás do Meowth (Squirtle, Charmander, Bulbasaur e Pidgey passando a bola
  na faixa acima da cabeça dele); o clipe do EP 2 mais longo (o Psyduck tostado no fim); o 27/11 do calendário virando
  Time Ultimate (a folhinha saiu: o 27/11 aparece uma vez só); o Voltorb no telão na nota pé; o Meowth e o Psyduck no
  telão no "Temos que chutar!"; a turma (Meowth, Raichu, Machoke, Psyduck) na tela final;
- **fica da v7:** as outras opções da recompensa borradas e o holofote na Charanga, os troféus 4/10, as barras +4 com a
  carta do Onix (um pouco maior), o painel ₽3 → ₽6 → ₽9, as moedas do Pay Day caindo de cima, o calendário, o pacote com
  o Mewtwo 93 e a tela final.

**Diferente do pedido:** o alvo era ~60 s, mas com a regra de leitura (1 letra a cada 50 ms, cada fala inteira no
mínimo 2,7 s, 2 linhas) as 20 falas aprovadas sozinhas somam ~115 s. E na caixa ao lado do retrato cabem ~40 letras em
2 linhas (Galmuri11 43 px): 10 falas viraram 2 ou 3 páginas, como nos jogos (a página de antes fica inteira 1,2 s).

## Regra de leitura (linha.mjs)

- a caixa digita 1 letra a cada 50 ms e segura 0,2 s depois de pontuação no meio da frase;
- cada fala fica inteira no mínimo 2,7 s; a página que não é a última, 1,2 s; no máximo 2 linhas por página;
- cada bloco novo (manchete nova) começa na batida (0,5 s) e o texto entra 0,3 s depois da manchete;
- a fala seguinte troca 0,1 s depois da anterior acabar.

## Linha do tempo (v8; música: 120 BPM, compasso = 2 s)

"Texto" = quando a 1ª letra aparece. Todos os instantes saem do `linha.mjs` (a cena lê `midia/som/news-falas.js`).

| Seg. | Manchete | Quem (retrato) | Fala (texto a partir de) | Imagem |
|---|---|---|---|---|
| 0–2 | PLANTÃO · VOLTORB VIRA RESERVA | — | — | o Voltorb de colete no banco do Pallet FC, pisca em 0,75 e 1,1 |
| 2–4 | — | — | — | a vinheta de plantão |
| 4–9,1 | SOCCERMON NEWS #1 | Raichu (happy) | Boa noite, Kanto! Eu sou o Raichu… (4,3) | a bancada; faíscas; GC RAICHU |
| 9,1–15,4 | | Machoke (happy) | …e eu sou o Machoke. / Este é o Soccermon News! (9,2) | GC MACHOKE; o Raichu vira pra ele |
| 15,4–20,5 | | Raichu (determined) | Hoje: as novidades da semana, e mais. (15,5) | no telão, VERSÃO NOVA: 0.9.51 carimba em 15,5, + 0.9.52 em 16,15 |
| 20,5–26,5 | HOJE NO SOCCERMON NEWS | — | — | varrida 1; 4 cartelas de 1,5 s (20,5 · 22 · 23,5 · 25) |
| 26,5–33,8 | PLANTÃO | Raichu (normal) | Na Copa do Dia e na Relâmpago, / a recompensa da vitória mudou. (26,8) | a recompensa no telão; 29,55 o VT: as 3 opções (29,7 · 29,95 · 30,2), o holofote na Charanga no "mudou" |
| 33,8–40,7 | | Machoke (determined) | Em 4 de cada 10 vitórias, / uma das opções é um Patrocínio… (33,9) | 10 troféus, 4 acendem (a partir de "vitórias", a cada 0,45 s), 4/10; a carta do Patrocínio no "Patrocínio" |
| 40,7–45,6 | | Raichu (joyous) | …um bônus forte que vale pro time inteiro. (40,8) | a carta do Onix, 0 × 1 PERDENDO (41,1), as barras +4 a partir de "forte" |
| 45,6–52,6 | | Magikarp (determined) | A gente perdia. / A charanga tocou e o time ficou mais forte. (45,7) | a sonora na quadra; GC MAGIKARP; ele quica no "charanga" |
| 53–62,5 | AO VIVO | Raichu (normal) | Agora, ao vivo da Rota Índigo, / nosso repórter Meowth. / Boa noite, Meowth. (53,3) | o Meowth no telão; 54,4 a tela dividida, GC MEOWTH; 61,2–62,6 o atraso: o Meowth congela, ATRASO NO SINAL |
| 62,5–66,4 | | Meowth (surprised → happy) | Boa noite, Raichu! (62,6) | o Meowth acorda no susto e faz pose |
| 66,4–74,05 | | Meowth (happy) | Aqui na Rota, cada jogo vencido / agora paga ₽3 pra gastar no Mercado. (66,5) | tela cheia, a partida rolando atrás; o relógio vira 19:01; ₽3 no "₽3" (70,1), ₽6 em 71,95 |
| 74,05–78,6 | | Meowth (joyous) | Três vitórias, ₽9. Pay Day! (74,15) | ₽9 no "₽9" (75,1); o pulo no "Pay" (75,5), 14 moedas caem e quicam |
| 79–86 | VESTIÁRIO | Machoke (surprised) | No Vestiário do Pallet FC, / uma bola explodiu no treino. (79,3) | o clipe do EP 2 numa moldura de VT; o KABOOM no "explodiu" (82,35) |
| 86–87,2 | | (Raichu, sigh) | — | o Raichu de perto, sem graça, gota de suor |
| 87,2–92,35 | | Raichu (determined) | Psyduck, o que vocês fizeram com o Voltorb? (87,3) | o Raichu e o Psyduck na ponta da bancada; GC PSYDUCK |
| 92,35–96,15 | | Psyduck (sigh) | Agora ele é reserva. (92,45) | o Psyduck balança; 93,95 o banco: o Voltorb de colete, tarja VOLTORB · RESERVA, até 97,5 |
| 97,5–104,35 | VEM AÍ | Raichu (inspired) | A partir de agora, / sai atualização nova toda semana. (97,8) | varrida 2; o calendário TODA SEXTA; uma bola por sexta (101,85 a 103,35) |
| 104,35–111,05 | | Machoke (joyous) | E na sexta que vem, dia 27, / abre o Time Ultimate… (104,45) | o 27/11 vira TIME ULTIMATE no "Time" (107,65) |
| 111,05–118,4 | | Raichu (joyous) | …o modo novo em que você abre pacotes / e monta o time da temporada. (111,15) | o pacote cai, rasga no "abre" (112,4), as cartas viram (114,3), o Mewtwo 93 no "temporada" (115,2) e vem pro meio |
| 118,5–123,75 | NOTA PÉ | Machoke (happy) | E o Voltorb pediu pra avisar: ele tá bem. (118,8) | o Voltorb de colete no telão, pula no "bem" |
| 123,75–128,9 | | Raichu (happy) | Muito obrigado pela companhia, e boa noite! (123,85) | faíscas no "boa noite" e uma reverência |
| 128,9–133 | | Todos (os 4) | Temos que chutar! (129) | o Meowth e o Psyduck no telão; todos pulam em 129,3 e no "TAR" (129,75) |
| 133–136,5 | — | — | — | tela final: logo, Temos que chutar!, soccermon.com e a turma |

## Música

`scripts/musica/pecas/news-plantao.mjs` (70 compassos, 120 BPM, Dó dórico) importa o `linha.mjs`: a cama de cada bloco
começa no corte dele (o groove do estúdio na abertura, no convidado e na nota pé; o funk leve nas matérias; sobe pra Ré
no Time Ultimate e vai pra Mi♭ depois do Mewtwo). O gancho tem a batida da vinheta e o "plim-plim" nas piscadas do
Voltorb; um toque (metais, sino e prato) em cada manchete; a varrida nas 2 transições e um whoosh curto nos outros
cortes. Os sons das animações (carimbos, troféus, barras, moedas, KABOOM, calendário, pacote) caem nos mesmos instantes
do `linha.mjs`. A banda para nos `BREQUES` (o atraso do satélite, a reação sem graça e o Voltorb no banco). No "Temos
que chutar!" os metais tocam o ritmo do grito; na tela final o SOC-CER-MON nos metais e no pulso, com as palmas, e o
fecho em Mi♭. Os blips ficam em `news-voz.wav` (de 12 a 18 dB abaixo da banda em RMS, os picos no nível da banda).

## Gerar

```bash
# o clipe do EP 2: 20,5 a 28 s do render v7 do ep14 (o KABOOM em 3,5 s do arquivo)
scripts/pesado.sh ffmpeg -ss 20.5 -t 7.5 -i <ep14>/trailer/curtas/vestiario-bolas/render/v7.mp4 -an -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p trailer/curtas/midia/news/bola-fora-longa.mp4
# sprites (com o 67), retratos, a dupla de terno, a linha do tempo + blips e só a música do News, em −14 LUFS
scripts/pesado.sh node trailer/curtas/preparar.mjs news
# (mudou só uma fala? node trailer/curtas/news-01/linha.mjs trailer/curtas/midia/som refaz o news-falas.js, os blips e
#  as durações fixas do index.html; depois a música: o preparar.mjs news)
node trailer/qa-quadros.mjs trailer/curtas/news-01                      # 0 problema(s)
cd trailer/curtas && ../../scripts/pesado.sh npx hyperframes render news-01 -q high -w 1 --no-browser-gpu -o news-01/render/v8.mp4
scripts/pesado.sh trailer/curtas/finalizar.sh trailer/curtas/news-01/render/v8.mp4 ~/Vídeos/soccermon-postar/pauta-16-22/news-01-v8
```

As cartas e o pacote (v6): `BASE_URL=http://localhost:<p> node trailer/curtas/news-01/cartas.mjs trailer/curtas/midia/news/cartas 25 143 95 26 130 150 pack`.
A v7 (75,6 s, o Pikachu apresentando) está no commit c15b52ed; a v6 no f01b7ac1; a v5c no d91dbca5.
