---
description: Soccermon News #1 v5 (68,6 s, 9:16), telejornal com falas na caixa de diálogo, escalada em cartelas, câmera de telejornal e despedida dos três; linha do tempo real, regra de leitura, música e como gerar.
---

# Soccermon News #1 v5 (68,6 s, 14/11/2026)

Roteiro aprovado em `docs/marketing/news-01.md` (pauta 21, sex 20/11 19h). A v1 (41 s) ficou "frenética"; a v2 (35 s,
sem falas) "vaga"; a v3 (86,5 s, telejornal com falas) agradou no formato. Na v4, pelo feedback do Miguel:

- a escalada virou **sumário**: o Alakazam só diz "Hoje: as novidades da versão 0.9.51, e mais." e entra uma tela
  própria, sem caixa de fala nem manchete: o banner **HOJE NO SOCCERMON NEWS** em cima, uma cartela grande por destaque
  (número num selo, imagem pequena, texto grande) e os chips **1 2 3 +** embaixo acendendo, 2 s cada, com uma batida
  da vinheta em cada troca;
- o Meowth tem a fala nova "Três vitórias, ₽9. Pay Day!", com as moedas saindo do amuleto da testa e chovendo em volta
  dele; saíram o "essas moedas são dos jogadores" e o "Que moedas?" (e o assobio);
- saiu a repetição "treze bolas / doze"; entram a pergunta "o que vocês fizeram com o Voltorb?" e o "Agora ele é
  reserva." com o corte pro banco do Pallet FC (o vestiário do EP 2: armários, banco de madeira, toalha e garrafa): o
  Voltorb sentado, de colete verde-limão em pixel (na grade da folha), piscando duas vezes;
- ritmo: a caixa digita em 0,3 s, a fala fica inteira no mínimo 2,7 s, o respiro na troca de manchete é 0,3 s;
- consertos: a reportagem da Rota
  ficou mais perto (zoom 1,3) com um Pidgey e um Rattata ao fundo; no gancho, os dois trechos do gol foram recortados
  pra ninguém ficar cortado na borda (o gol: zoom 1,3 a partir de x 758, de 1,05 a 2,05 s do clipe; o pulo: 1,067 a
  partir do canto); a fumacinha do Psyduck agora sai do alto da cabeça (filha do corpo dele).

Na v5 o Miguel aprovou o resto da v4 e pediu três coisas:

- **despedida nova:** sai o "Boa noite, e temos que chutar!". O Alakazam diz "Muito obrigado pela companhia, e boa
  noite!" (com o "ting") e depois vem a caixa **TODOS** com "Temos que chutar!": os três na bancada pulam juntos duas
  vezes (no grito e no "TAR") e fecham numa pose; na música o teremim, o mi-áu e o psy gritam juntos. Os dois planos
  da despedida têm a manchete SOCCERMON NEWS #1 (entra com a varrida, como as outras; por isso a fala do Alakazam vai
  de 58,5 a 62). A tela final (65 a 68,6) tem 3,6 s, com o soccermon.com 3,1 s na tela, e a música ganhou um compasso
  de fecho em Mi♭ (v5c);
- **microfone num pedestal:** saiu a pata desenhada. O microfone fica num pedestal na frente do Meowth, do lado, com a
  cabeça na altura da boca e sem cobrir a cara; o pedestal é filho do pé (fica no chão quando ele pula) e o Meowth tem
  as poses normais do sprite (na cartela 2, no telão e na Rota);
- **mais animação** (a v4 ficou "meio desanimada"), sem mudar falas nem ordem:
  - **câmera de telejornal:** cada fala tem o plano de quem fala e um empurrão de 3,5 a 5% em 3 s (`plano()` no estúdio,
    `empurra()` nos painéis do jogo, a Rota empurra 1,30→1,35 e abre pra 1,22→1,27 no Pay Day). Planos do estúdio:
    ABERTO (a bancada), MEDIO (o Alakazam e o telão inteiro: AO VIVO e o calendário), DOIS (o Alakazam, o telão e o Psyduck),
    ALA (o Alakazam de perto: "Hoje" e "Muito obrigado") e PSY (o Psyduck de perto). O estúdio ficou mais largo que a
    tela (x −700 a 1780) pra o plano fechado não mostrar a borda do cenário; no fechado o telão fica sem imagem;
  - **personagens vivos:** quem fala dá um pulinho no começo da fala; o Alakazam faz o Shoot do PMD (as colheres
    sobem) no "ting" do "Boa noite", do aviso e da despedida; o Meowth faz o Hop no Pay Day; no "Agora ele é reserva."
    o banco corta em 46,6 pro Psyduck de perto balançando (o Charge do PMD, a mão na cabeça, e a fumacinha); o
    Voltorb respira no banco (antes ficava parado num quadro);
  - **transições:** uma varrida (faixa inclinada com o símbolo, da direita pra esquerda) cobre a tela no instante de
    cada troca de matéria (10,5 · 18,5 · 28 · 37,5 · 48 · 51,5 · 58,5, a despedida) com um "fuuuh" na música; a manchete nova
    entra deslizando da direita atrás dela;
  - **música:** a banda anda por baixo das falas (bumbo e caixa no tempo, baixo andando, chimbal em colcheia, piano no
    contratempo) e um blip por letra enquanto a caixa digita (7 blips em 0,3 s, o tom de cada um: Alakazam médio,
    Meowth agudo, Psyduck grave; na fala TODOS os três juntos). A banda só para nas pausas cômicas que já existiam.

**Regra de leitura:**
- a fala vai numa caixa de diálogo dos jogos de Pokémon, embaixo (y 1300 a 1530): moldura branca com borda escura, o
  nome de quem fala numa aba, o texto letra por letra em 0,3 s e a setinha vermelha piscando quando completa;
- cada fala fica inteira no mínimo 2,7 s (2 linhas no máximo; Galmuri11 Bold em 43 px);
- a manchete fica parada em cima (y 214) a matéria inteira, com o selo AO VIVO pequeno numa aba; ela só troca quando
  muda a matéria, deslizando da direita (atrás da varrida);
- nunca dois textos novos juntos: quando a manchete troca, a caixa fecha e a fala nova começa 0,3 s depois. Por isso o
  bloco com manchete nova tem no mínimo 3,3 s e o sem tem 3 s.

## Linha do tempo (música: 120 BPM, compasso = 2 s)

"Texto" = quando a fala começa a aparecer; ela fica inteira até o fim do bloco.

| Seg. | Manchete | Quem | Fala (texto a partir de) | Imagem |
|---|---|---|---|---|
| 0–2 | — | — | — | o gol em câmera lenta (recortado) e o artilheiro pulando |
| 2–4 | — | — | — | vinheta de plantão (placa SOCCERMON NEWS, a bola girando, o selo #1) |
| 4–7,3 | SOCCERMON NEWS #1 | Alakazam | Boa noite! Eu sou o Alakazam, seu apresentador desta noite. (4,3) | bancada (ABERTO), a cadeira do convidado vazia; o Shoot e o "ting" da colher |
| 7,3–10,5 | | Alakazam | Hoje: as novidades da versão 0.9.51, e mais. (7,3) | corte pro Alakazam de perto (ALA); varrida em 10,5 |
| 10,5–12,5 | — (banner HOJE NO SOCCERMON NEWS) | — | cartela 1 · RECOMPENSA NOVA NA COPA DO DIA | a tela do 1 de 3 |
| 12,5–14,5 | | — | cartela 2 · AO VIVO DA ROTA ÍNDIGO | o Meowth de microfone (pose em 13,1) |
| 14,5–16,5 | | — | cartela 3 · A DATA DO TIME ULTIMATE | a fatia do Time Ultimate |
| 16,5–18,5 | | — | cartela + · E MAIS: O TÉCNICO DO PALLET FC NO ESTÚDIO | a porta; a silhueta do Psyduck inclina a cabeça no "psy?" (17,3) |
| 18,5–21,8 | RECOMPENSA NOVA | Alakazam | Na Copa do Dia e na Relâmpago, a recompensa da vitória mudou. (18,8) | a tela do 1 de 3 |
| 21,8–24,8 | | Alakazam | Em 4 de cada 10 vitórias, uma das opções é um Patrocínio… (21,8) | a moldura dourada no Patrocínio (22,3) |
| 24,8–28 | | Alakazam | …um bônus forte que vale pro time inteiro. (24,8) | a carta do Patrocínio ampliada no meio |
| 28–31,3 | AO VIVO · ROTA ÍNDIGO | Alakazam | Agora, ao vivo da Rota Índigo, nosso repórter Meowth. (28,3) | bancada (MEDIO); no telão, o Meowth com o microfone no pedestal |
| 31,3–34,3 | | Meowth | Aqui na Rota, cada jogo vencido agora paga ₽3 pra gastar no Mercado. (31,3) | o Meowth na quadra, de perto, o pedestal na frente; pulinho no começo; Pidgey e Rattata ao fundo |
| 34,3–37,5 | | Meowth | Três vitórias, ₽9. Pay Day! (34,3) | a câmera abre um pouco; o Hop do PMD (34,65), o amuleto brilha e 14 moedas saem em arco e caem em volta (35,2–36,5); pose no ka-ching (36,55) |
| 37,5–41,5 | VESTIÁRIO DO PALLET FC | Alakazam | No Vestiário do Pallet FC, uma bola explodiu no treino. (37,8) | o trecho do EP 2 numa moldura de VT: o chute (38,1), o KABOOM (39,5) |
| 41,5–44,8 | PSYDUCK · TÉCNICO | Alakazam | Psyduck, o que vocês fizeram com o Voltorb? (41,8) | o Alakazam e o Psyduck (DOIS), tostado na cadeira, a fumacinha no alto da cabeça; ele olha a prancheta |
| 44,8–48 | | Psyduck | Agora ele é reserva. (44,8) | corte pro banco do Pallet FC: o Voltorb de colete respira e pisca (45,8 e 46,15); em 46,6 o Psyduck de perto (PSY) balançando |
| 48–51,5 | TODA SEMANA | Alakazam | Um aviso: a partir de agora, sai atualização nova toda semana. (48,3) | bancada (MEDIO), o Shoot e o "ting"; no telão, o calendário das 4 sextas (49, 49,5, 50 e 50,5) |
| 51,5–55 | TIME ULTIMATE · 27/11 | Alakazam | E na sexta que vem, dia 27, abre o Time Ultimate… (51,8) | o menu de modos; a moldura dourada na fatia (52,3) |
| 55–58,5 | | Alakazam | …o modo novo em que você abre pacotes e monta o time da temporada. (55) | a carta ouro sai do pacote girando e vira em 56 (flash) |
| 58,5–62 | SOCCERMON NEWS #1 | Alakazam | Muito obrigado pela companhia, e boa noite! (58,8) | o Alakazam de perto (ALA); o Shoot e o "ting" em 59,6 |
| 62–65 | | Todos | Temos que chutar! (62) | a bancada com os três (ABERTO): pulam juntos no grito (62,3) e no "TAR" (62,8) e fazem pose (63,3) |
| 65–68,6 | — | — | — | tela final: logo com a piscada SOC-CER-MON, Temos que chutar! (65,35), soccermon.com (65,5), os três pulando no MON; o "ting" em 66,5 |

## Música

`scripts/musica/pecas/news-plantao.mjs`, 35 compassos na v5c (120 BPM, Dó dórico). Até 10,5 s a cama anda no compasso;
da escalada em diante ela anda meio compasso deslocada (compassos x,25), pra batida cair em cada troca de cartela. No
estúdio, o groove anda por baixo das falas (bumbo e caixa no tempo, chimbal em colcheia, baixo andando, piano no
contratempo); nas matérias, o funk leve. Cada fala começa com a voz de quem fala por cima da digitação (o teremim do
Alakazam, o mi-áu do Meowth e o `psy` do Psyduck) e um blip por letra enquanto a caixa digita (`blip` em
`curtas.mjs`: quadrada de 40 ms; Alakazam médio, Meowth agudo, Psyduck grave). Cada troca de matéria tem a varrida
(`varrida`, ruído que sobe e desce com o pico no corte).

Reações: o "ting" da colher quando o Alakazam se apresenta e no fim; na escalada, uma batida da vinheta por cartela
(bumbo, tímpano e a cabeça do motivo nos metais, subindo uma terça a cada uma), um mi-áu curto na do Meowth e, na
última ("E mais"), a banda segura e o "psy?" sai atrás da porta; um toque curto (sino e metais) em cada manchete nova;
o motivo nos metais no AO VIVO; o sino quando o Patrocínio ganha a moldura e um arpejo quando a carta amplia; no Pay Day
um brilho de sino no pulo, as 14 moedas descendo a escala e o ka-ching na pose (sem assobio); no vestiário a tuba e o
tímpano esperam, o chute e o KABOOM do EP 2; no corte pro banco a banda para, a tuba dá duas notas baixinhas e o
Voltorb pisca no "plim-plim" (sino agudo, duas notas); uma nota de sino por sexta do calendário; sobe pra Ré no Time
Ultimate, riser até a carta virar em Mi♭ maior; o "ting" no "boa noite" (59,6); em 62,3 os três gritam "Te-mos-que-chu-TAR"
juntos (teremim em cima, mi-áu uma oitava abaixo, psy no grave) com prato e metais no "TAR"; na tela final (65) os três
cantam o SOC-CER-MON, o "ting" em 66,5 e o compasso de fecho em Mi♭ fecha com tudo em 67,5 (35 compassos). A banda só sai nas pausas cômicas, os `BREQUES` (16,5–18,5 o "psy?" atrás
da porta, 37,5–41,5 o KABOOM e 44,8–46,6 o Voltorb piscando), mas sempre fica algo soando. −14 LUFS.

Vozes contra a banda (as faixas medidas separadas, RMS dos 0,6 s de cada fala): as vozes ficam de 3 a 8 dB acima da
banda em todas as falas (veja o relatório da v5).

## Gerar

```bash
# a música (só a do News): news.wav + news.js, depois −14 LUFS em news-14.wav (o mesmo loudnorm de 2 passadas do preparar.mjs)
scripts/pesado.sh node trailer/curtas/musica.mjs trailer/curtas/midia/som news
# (ou scripts/pesado.sh node trailer/curtas/preparar.mjs, que refaz sprites e todas as trilhas)
# as telas, a partir das capturas da v1/v2 em midia/news:
#   recompensa.png  = último quadro de patrocinio-c.mp4
#   menu-fatias.png = ultimate/0029.png recortado em 1080x490 a partir de y 1200
#   bola-fora.mp4   = 22 a 26 s do render v7 do EP 2 (worktree ep14, trailer/curtas/vestiario-bolas/render/v7.mp4), sem som, crf 14
node trailer/qa-quadros.mjs trailer/curtas/news-01                      # 0 problema(s)
cd trailer/curtas && ../../scripts/pesado.sh npx hyperframes render news-01 -q high -w 1 --no-browser-gpu -o news-01/render/v5c.mp4
scripts/pesado.sh trailer/curtas/finalizar.sh trailer/curtas/news-01/render/v5c.mp4 ~/Vídeos/soccermon-postar/pauta-16-22/news-01-v5
```

A v4 (65,5 s) está no commit acf287e6; a v3 (86,5 s) no a43c731a; a v2 (35 s) e a v1, nos anteriores.
