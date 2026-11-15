---
description: Soccermon News #1 v7 (75,6 s, 9:16), telejornal com falas na caixa de diálogo; na v7 o Pikachu apresenta, entram GCs, selo do canal, cabeça da matéria no telão, sonora do Magikarp e o link ao vivo em tela dividida com atraso de satélite; linha do tempo real, regra de leitura, música e como gerar.
---

# Soccermon News #1 v7 (75,6 s, 15/11/2026)

Na v7 o Miguel pediu (sobre a v6):

- **a recompensa sem distração** (19,5–21,8): as duas opções que não são o Patrocínio (a carta do Growlithe com a faixa
  e o Charcoal) já chegam escuras e borradas (`blur 10px`, brilho 0,32): nenhum texto delas se lê. Em 20,6 um holofote
  (feixe de luz e o resto escurecido) acende na Charanga de Pewter, que cresce 13% com uma moldura dourada. A cartela 1
  da escalada e o telão da cabeça da matéria usam o mesmo recorte (a tela borrada, só a Charanga acesa);
- **o Pikachu apresenta** (é do elenco do Pallet FC; o Alakazam não é): todas as cenas da bancada, as falas ("Boa noite!
  Eu sou o Pikachu…"), a caixa (PIKACHU) e a tela final. Voz nova `pika` em `scripts/musica/curtas.mjs` (pulso estreito,
  entra uma quinta acima e cai na nota em 25 ms, tremolo rápido: um "pi" por nota, curtinho); o "ting" da colher virou o
  choquinho (o Pose do PMD e faíscas amarelas nas bochechas, com o mesmo sino). A carta das barras +4 agora é a do
  **Onix** (a da galeria, já desenhada pelo `cartas.mjs`: VEL 62, CHU 32, PAS 32, DRI 47, DES 86, FOR 94, todas com +4 sem
  bater no teto de 99). Depois do clipe do Vestiário (o Pikachu chutando o Voltorb), o Pikachu olha pro lado, sem graça,
  com uma gota de suor (48,5–49, o "plim" e a tuba descendo) antes de perguntar;
- **cara de reportagem de TV:**
  - **GC** (tarja de nome: o nome numa faixa amarela com a ponta vermelha, o cargo embaixo, entra de lado e sai) na
    primeira aparição de cada um: PIKACHU · APRESENTADOR (4,8–7), MAGIKARP · JOGADOR DO PALLET FC (28,55–30,65), MEOWTH ·
    REPÓRTER · ROTA ÍNDIGO e PIKACHU · ESTÚDIO (as tarjas da tela dividida, 32,25–38,05) e PSYDUCK · TÉCNICO DO PALLET FC
    (49,6–51,6). A manchete do bloco do Psyduck deixou de ser "PSYDUCK · TÉCNICO" (agora é o GC) e segue VESTIÁRIO DO
    PALLET FC;
  - **selo do canal** no canto de cima (x 40, y 96 a 166: o símbolo, **19:00** com os dois-pontos piscando e **AO VIVO**
    com o ponto piscando) durante a bancada e o link (no estúdio e na Rota; nos VTs ele sai). O AO VIVO saiu da aba da
    manchete (ficava duplicado);
  - **cabeça da matéria com telão** (18,5–19,5): o Pikachu chama a matéria 1 no plano MEDIO com a recompensa no telão
    e corta pro VT em tela cheia em 19,5;
  - **link ao vivo com atraso de satélite** (31–38,3): 31 a bancada com o Meowth esperando no telão; em 32 a tela
    divide (o estúdio à esquerda, a Rota à direita, cada metade com a sua tarja, entrando dos lados); o Pikachu diz
    "…Boa noite, Meowth." e o Meowth fica parado 1 s (34,3–35,3: o quadro congela, a imagem dele treme duas vezes, o
    Pikachu inclina a cabeça; a banda para e ficam as cordas e dois bips de satélite); em 35,3 "Boa noite, Pikachu!" (o
    Meowth pula e faz pose) e em 38,3 o corte pra ele em tela cheia, com as falas de antes;
  - **a canopla** no microfone do pedestal: o cubinho azul com o **SN** amarelo, logo abaixo da cabeça do microfone;
  - **sonora na matéria 1** (28–31): depois do "…vale pro time inteiro.", corte seco pra quadra do Pallet FC: o
    Magikarp de perto (com a medalha de capitão e o microfone do News), o Snorlax dormindo no gol lá atrás, e a fala "A
    gente tava perdendo. A charanga tocou e o time inteiro ficou mais forte." (74 letras: só essa fala vai em 39 px pra
    caber em 2 linhas). A voz dele é o PLOF (`splash`); no "A charanga tocou" ele quica e a medalha brilha;
- **consertos da v6:** ducking (nos 0,75 s em que cada voz entra, tudo que não é voz abaixa 6 dB): a fala do pacote foi
  de 1,8 pra 6,9 dB acima da banda e todas as falas ficam de 6,9 a 13,4 dB acima; o "Muito obrigado pela companhia"
  ganhou empurrão de 13% em 3,5 s, pulinho, o choquinho no "boa noite" e uma reverência (67,5); a pergunta ao Psyduck
  ganhou a câmera andando até ele (DOIS → DOIS_PSY em 3,5 s), o Pikachu se inclinando pro Psyduck e o Psyduck se
  encolhendo na prancheta; no pacote, depois de virar, o Mewtwo vem pro meio da tela 2,3x maior (63,75) e as outras
  quatro apagam: os atributos dele se leem no celular; o 27/11 ficou só na folhinha (a manchete virou TIME ULTIMATE e a
  fatia do jogo foi recortada acima do selo EM BREVE 27/11); o 9 do painel de ₽ não encosta mais na borda (150 px e o
  bloco 30 px pra esquerda); o Pidgey e o Rattata foram pra baixo do painel (y 905 e 930); as moedas do Pay Day caem do
  alto da tela (passam por trás do painel) e quicam em volta do Meowth, em vez de sair da cara dele.

## Antes: a v6 (68,6 s)

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

Na v6 o Miguel achou o caminho bom ("tá melhorando"), mas com **texto demais**: os números das notícias viram gráfico
ou animação, cada um com um som pequeno no tempo da música. Falas, caixa, manchetes e vozes ficam como na v5c.

- **0.9.51 no telão** ("Hoje: …", 7,3): o plano abre pro MEDIO e o telão mostra o selo VERSÃO NOVA; o 0.9.51 carimba em
  7,5 (estouro, bumbo, tom e dois sinos baixinhos) e pulsa em cada tempo até a escalada;
- **as 3 opções da recompensa** (18,5): a tela do 1 de 3 entra vazia (só o título) e as três opções chegam uma a uma
  como cartas distribuídas (19 · 19,35 · 19,7), cada uma com um "bwoop" subindo (pedaços de `recompensa.png`);
- **4 de cada 10** (21,8): 10 troféus desenhados (2 fileiras); 4 acendem dourados um por batida (22,3 · 22,8 · 23,3 ·
  23,8) com o selo do Patrocínio (o bumbo da Charanga, como no jogo) e um ding cada, e o contador sobe até **4/10**; a
  carta do Patrocínio entra pequena em 24,1;
- **o bônus pro time inteiro** (24,8): a carta do Pikachu (a do jogo, sem mexer) e as 6 barras dos atributos da carta
  (VEL CHU PAS DRI DES FOR, com as cores da barra do CardModal); o placar **0 × 1** com **PERDENDO** entra em 25,3 (a tuba
  cai) e cada barra ganha **+4** (25,6 a 26,85, uma por colcheia) com o bumbo da Charanga batendo e dois bips subindo.
  Conferido no código: `CHARANGA_ADD = 4` em `src/engine/sponsors.ts`, `attrs: 'all'`, só com `losing` (perdendo agora);
- **o Meowth no telão** (28): a mesma quadra da Rota, ele já de pedestal esperando a chamada (ajeita-se em 29,1); em 31
  a câmera entra no telão e corta pra Rota em 31,3 com o Meowth no mesmo lugar;
- **o ₽ da Rota** (31,3): um painel embaixo da manchete com 3 troféus e o contador; cada vitória entra numa batida e o ₽
  sobe 0 → 3 → 6 → 9 (32,5 · 33,5 · 34,5), uma moeda "ka-ching" cada. O Pay Day anda 0,35 s (o pulo em 35, as moedas
  caem de 35,58 a 36,88, o ka-ching em 36,9) e as moedas sobem menos (não passam por trás do painel);
- **27/11** (51,5): a fatia do Time Ultimate em cima e uma folhinha embaixo; os dias passam de 20 a 27/11 (um tique cada,
  51,85 a 52,5) e o 27/11 carimba em 52,5 (estouro, a fatia acende) e pulsa no tempo;
- **o pacote** (55): sai o print do menu de modos. Um pacote ouro (o `PackArt` do jogo) cai, treme (55,2, chocalho),
  a tampa rasga (55,45, papel rasgando, som novo `rasga` em `curtas.mjs`) e cinco cartas viradas caem numa escalação de
  futsal (PIV Gyarados, ALA Raichu, FIX Onix, GOL Snorlax e ALA Mewtwo); viram uma a uma em dó-mi-sol-dó de Si♭ (56 a
  56,36) e o **Mewtwo 93** é o último, em 56,5 (flash, estouro, cresce; o prato e a fanfarra em Mi♭ andaram de 56 pra 56,5);
- cartas e pacote: `cartas.mjs` desenha `PokeCard2` (Metal, as da galeria `?cards=1`) e `PackArt` (ouro) direto dos
  componentes do jogo, com fundo transparente (o jogo não tem verso de carta: o verso é o da v5).

**Regra de leitura:**
- a fala vai numa caixa de diálogo dos jogos de Pokémon, embaixo (y 1300 a 1530): moldura branca com borda escura, o
  nome de quem fala numa aba, o texto letra por letra em 0,3 s e a setinha vermelha piscando quando completa;
- cada fala fica inteira no mínimo 2,7 s (2 linhas no máximo; Galmuri11 Bold em 43 px);
- a manchete fica parada em cima (y 214) a matéria inteira, com o selo AO VIVO pequeno numa aba; ela só troca quando
  muda a matéria, deslizando da direita (atrás da varrida);
- nunca dois textos novos juntos: quando a manchete troca, a caixa fecha e a fala nova começa 0,3 s depois. Por isso o
  bloco com manchete nova tem no mínimo 3,3 s e o sem tem 3 s.

## Linha do tempo (v7; música: 120 BPM, compasso = 2 s)

"Texto" = quando a fala começa a aparecer; ela fica inteira até o fim do bloco. Selo = o selo do canal no canto de cima.

| Seg. | Manchete | Quem | Fala (texto a partir de) | Imagem |
|---|---|---|---|---|
| 0–2 | — | — | — | o gol em câmera lenta (recortado) e o artilheiro pulando |
| 2–4 | — | — | — | vinheta de plantão (placa SOCCERMON NEWS, a bola girando, o selo #1) |
| 4–7,3 | SOCCERMON NEWS #1 | Pikachu | Boa noite! Eu sou o Pikachu, seu apresentador desta noite. (4,3) | bancada (ABERTO), selo; o choquinho; GC PIKACHU · APRESENTADOR (4,8–7) |
| 7,3–10,5 | | Pikachu | Hoje: as novidades da versão 0.9.51, e mais. (7,3) | bancada (MEDIO); no telão, VERSÃO NOVA e o 0.9.51 carimbado em 7,5; varrida em 10,5 |
| 10,5–18,5 | — (HOJE NO SOCCERMON NEWS) | — | as 4 cartelas de 2 s (1 · recompensa, só a Charanga acesa; 2 · Meowth; 3 · Time Ultimate; + · a porta) | |
| 18,5–21,8 | RECOMPENSA NOVA | Pikachu | Na Copa do Dia e na Relâmpago, a recompensa da vitória mudou. (18,8) | 18,5 a cabeça: bancada (MEDIO), a recompensa no telão; 19,5 o VT: as 3 opções entram (19,65 · 19,9 · 20,15), as duas outras escuras e borradas; 20,6 o holofote na Charanga |
| 21,8–24,8 | | Pikachu | Em 4 de cada 10 vitórias, uma das opções é um Patrocínio… (21,8) | 10 troféus, 4 acendem (22,3 · 22,8 · 23,3 · 23,8), 4/10; a carta do Patrocínio (24,1) |
| 24,8–28 | | Pikachu | …um bônus forte que vale pro time inteiro. (24,8) | a carta do Onix, 0 × 1 PERDENDO (25,3), as 6 barras +4 (25,6 a 26,85) |
| 28–31 | | Magikarp | A gente tava perdendo. A charanga tocou e o time inteiro ficou mais forte. (28) | a sonora: o Magikarp na quadra, de medalha e microfone; o Snorlax dorme no gol; GC (28,55–30,65); ele quica em 29,5 |
| 31–35,3 | AO VIVO · ROTA ÍNDIGO | Pikachu | Agora, ao vivo da Rota Índigo, nosso repórter Meowth. Boa noite, Meowth. (31,3) | 31 bancada (MEDIO), o Meowth no telão; 32 a tela dividida com as tarjas; 34,3–35,3 o atraso do satélite (o Meowth parado) |
| 35,3–38,3 | | Meowth | Boa noite, Pikachu! (35,3) | a tela dividida; o Meowth pula e faz pose |
| 38,3–41,3 | | Meowth | Aqui na Rota, cada jogo vencido agora paga ₽3 pra gastar no Mercado. (38,3) | o Meowth em tela cheia, selo; o painel do ₽: vitórias em 39,5 (₽3), 40,5 (₽6) |
| 41,3–44,5 | | Meowth | Três vitórias, ₽9. Pay Day! (41,3) | a vitória 3 (41,5, ₽9); o pulo (42), 14 moedas caem do alto e quicam em volta (42,6–43,77); pose no ka-ching (43,9) |
| 44,5–48,5 | VESTIÁRIO DO PALLET FC | Pikachu | No Vestiário do Pallet FC, uma bola explodiu no treino. (44,8) | o trecho do EP 2 numa moldura de VT: o chute (45,1), o KABOOM (46,5) |
| 48,5–52 | | Pikachu | Psyduck, o que vocês fizeram com o Voltorb? (49) | bancada (DOIS), selo; 48,5–49 o Pikachu olha pro lado com a gota de suor; a câmera anda até o Psyduck; GC PSYDUCK (49,6–51,6) |
| 52–55 | | Psyduck | Agora ele é reserva. (52) | o banco: o Voltorb de colete pisca (53 e 53,35); 53,6 o Psyduck de perto balançando |
| 55–58,5 | TODA SEMANA | Pikachu | Um aviso: a partir de agora, sai atualização nova toda semana. (55,3) | bancada (MEDIO), o choquinho; o calendário das 4 sextas (56 a 57,5) |
| 58,5–62 | TIME ULTIMATE | Pikachu | E na sexta que vem, dia 27, abre o Time Ultimate… (58,8) | a fatia (sem o selo da data) e a folhinha: 20 a 27/11, o 27/11 carimba em 59,5 |
| 62–65,5 | | Pikachu | …o modo novo em que você abre pacotes e monta o time da temporada. (62) | o pacote cai, rasga (62,45), as 5 cartas viram (63 a 63,36), o Mewtwo vira em 63,5 e vem pro meio grande (63,75) |
| 65,5–69 | SOCCERMON NEWS #1 | Pikachu | Muito obrigado pela companhia, e boa noite! (65,8) | o Pikachu de perto (ALA_FIM, empurrão de 13%), o choquinho (66,6) e a reverência (67,5) |
| 69–72 | | Todos | Temos que chutar! (69) | os três na bancada pulam no grito (69,3) e no "TAR" (69,8) e fazem pose (70,3) |
| 72–75,6 | — | — | — | tela final: logo com a piscada, Temos que chutar!, soccermon.com, os três pulando no MON |

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

**v6:** saíram o sino triplo do Patrocínio e o arpejo da carta ampliada; entraram os sons das animações novas (o carimbo
do 0.9.51 em 7,5, um "bwoop" por opção da recompensa, um ding por troféu, a tuba no PERDENDO, o bumbo da Charanga e dois
bips subindo por barra +4, um ka-ching por vitória da Rota, o tique dos dias da folhinha e o carimbo do 27/11, o tom do
pacote caindo, o chocalho, o papel rasgando, um "bwoop" por carta e as viradas em dó-mi-sol-dó); o Pay Day andou 0,35 s e
o prato e a fanfarra da carta ouro andaram pra 56,5 (riser de 53,5 a 56,5; a virada da bateria meio compasso depois).
Os sons que caem dentro de uma fala ficam baixinhos. Medido do mesmo jeito (só as vozes contra todo o resto, RMS dos
0,6 s de cada fala), as vozes ficam de 1,8 a 6,7 dB acima da banda; a v5c medida assim ia de 1,1 a 7,1 (a fala do
pacote, em 55, era a mais apertada e subiu de 1,1 pra 1,8; a do "Hoje" caiu de 5,2 pra 2,9 com o carimbo).

Vozes contra a banda (as faixas medidas separadas, RMS dos 0,6 s de cada fala): as vozes ficam de 3 a 8 dB acima da
banda em todas as falas (veja o relatório da v5).

## Gerar

```bash
# v7: as vozes contra a banda (só as vozes x todo o resto, RMS dos 0,6 s de cada fala): de 6,9 a 13,4 dB
# a música (só a do News): news.wav + news.js, depois −14 LUFS em news-14.wav (o mesmo loudnorm de 2 passadas do preparar.mjs)
scripts/pesado.sh node trailer/curtas/musica.mjs trailer/curtas/midia/som news
# (ou scripts/pesado.sh node trailer/curtas/preparar.mjs, que refaz sprites e todas as trilhas)
# as telas, a partir das capturas da v1/v2 em midia/news:
#   recompensa.png  = último quadro de patrocinio-c.mp4
#   menu-fatias.png = ultimate/0029.png recortado em 1080x490 a partir de y 1200 (não usado desde a v6)
# v6: as cartas e o pacote ouro, desenhados dos componentes do jogo (com o servidor de dev no ar):
BASE_URL=http://localhost:<p> node trailer/curtas/news-01/cartas.mjs trailer/curtas/midia/news/cartas 25 143 95 26 130 150 pack
#   bola-fora.mp4   = 22 a 26 s do render v7 do EP 2 (worktree ep14, trailer/curtas/vestiario-bolas/render/v7.mp4), sem som, crf 14
node trailer/qa-quadros.mjs trailer/curtas/news-01                      # 0 problema(s)
cd trailer/curtas && ../../scripts/pesado.sh npx hyperframes render news-01 -q high -w 1 --no-browser-gpu -o news-01/render/v7.mp4
scripts/pesado.sh trailer/curtas/finalizar.sh trailer/curtas/news-01/render/v7.mp4 ~/Vídeos/soccermon-postar/pauta-16-22/news-01-v7
```

A v6 (68,6 s) está no commit f01b7ac1; a v5c (68,6 s) no d91dbca5; a v4 (65,5 s) no acf287e6; a v3 (86,5 s) no a43c731a; a v2 (35 s) e a v1, nos anteriores.
