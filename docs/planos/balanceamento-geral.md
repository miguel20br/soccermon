---
description: Rascunho e decisões do balanceamento geral da 0.8.4: espécies, golpes, itens e posições.
---

# Balanceamento geral (próximo update, rascunho de 17/10/2026)

Pedido do Miguel: o próximo update é o balanceamento do jogo inteiro (151 Pokémon, golpes, itens, habilidades,
tipos, formações, táticas, sinergias, copa e draft). Regras de sempre: diversão > realismo, números de antes e
depois e o ok dele antes de aplicar.

## Método (pesquisa com Clash Royale, Smogon, Riot/TFT, Hearthstone BG, Slay the Spire, Balatro, EA FC)

**Meta: todo Pokémon tem um lugar.** Não é todo mundo com 50% de vitória: raro forte de nicho pode ficar; o que
sai é a presença universal (o caso do Freeze no Clash Royale: 50% de vitória, mas em todo deck, e o jogo fica
chato).

### Métricas

Ao vivo (`game_events`):
- taxa de oferta e **taxa de escolha quando oferecido** (o piso no 1 de 3 é 33%);
- **Δ de título**: chance de título com a espécie no time menos a média, comparando com quem viu a carta e passou
  no mesmo estágio (evita o viés de quem chega longe ver mais carta rara);
- **presença**: % dos times campeões, % de capitão, minutos em quadra;
- **diversidade**: número efetivo de capitães e de campeões (1/Σp²). Se cair entre patches, o jogo está
  homogeneizando.

Simulação (`calibrate` e scripts de auditoria):
- **teste de troca**: tirar o Pokémon e pôr um genérico da mesma nota mostra quanto ele vale de verdade;
- **nota × impacto**: se o impacto simulado foge muito da nota, a carta mente (quebra "carta = campo");
- mesmo teste pra golpes, itens, habilidades, sinergias e aura, incluindo as combinações.

### Faixas (adaptadas; nenhum jogo de draft publica as suas)

| Métrica | Saudável | Agir |
|---|---|---|
| Escolha quando oferecido | 15–60% | < 10% (nunca pego) ou > 70% (sempre pego) |
| Δ de título | ±5 pontos | fora disso, com 200+ copas |
| Capitão | até ~20% das copas | Dragonite em 50% é outlier |
| Presença nos campeões | até ~25% | acima, mesmo com Δ ok |

### Tamanho do patch

- 3 a 6 mudanças por patch, quase todas buffs no fundo da tabela (combina com "número sobe"); nerf só pros 1–2 do
  topo.
- Passos pequenos: 1–3 de nota ou 5–10% num efeito. Esperar um ciclo de dados antes de mexer de novo na mesma
  peça.
- Não mudar a função central de uma carta (gatilho de evolução e golpe assinatura ficam).
- Notas do patch: "antes ⇒ depois", uma linha de porquê, grupos Buff / Nerf / Ajuste com setas desenhadas (sem
  emoji) e uma marca nas cartas que mudaram.

### Armadilhas

Amostra pequena (lendários aparecem pouco: exigir N mínimo), viés de seleção, efeitos ligados (mexer num afeta
outro: sinergia, aura e item empilham), power creep ou achatamento, público diferente (iniciante × veterano, 8x),
e simulação não é diversão (conferir olhando partidas).

## Dados (17/10/2026: ~32 mil partidas simuladas + 74 copas no ar)

Scripts e tabelas brutas ficaram fora do repo (scratchpad da sessão); números principais:

1. **Táticas:** equilibrada 44%, ofensiva 56%, contra-ataque 53%, defensiva 48%. 85% das partidas no ar são na
   equilibrada (o padrão).
2. **Curva da copa invertida no fim:** vitória por fase na simulação 60 / 59 / **53** / **68**%; no ar 70 / 71 /
   58 / **90**%. A Liga Índigo joga na equilibrada e vira o rival mais fácil (68%) mesmo com a maior nota (83,4).
   Títulos: 26% no ar; 31% das copas acabam nas oitavas.
3. **Nota pesa pouco:** vantagem média +3 → 54%, +6 → 62%, +9 → 61%, +12 → 59%. Efeito de cada ponto no saldo:
   Pivô 0,038, Goleiro 0,016, Ala 0,014, **Fixo 0,000** (a nota do Fixo não muda o jogo).
4. **Formações:** 1-1-2 62%, 2-2 53%, 1-2-1 51%, 4-0 50%, ferrolho 42%, 3-1 42% (títulos: 3-1 só 5%).
5. **Evolução:** quem drafta pela nota quase não evolui (0,16 por copa; meta ~1,2): nenhum raro, épico ou
   lendário evolui.
6. **Cartas fora da curva** (rende acima/abaixo da nota): Tauros +0,89, Aerodactyl +0,71, Mewtwo +0,56, Scyther
   +0,51, Snorlax GK +0,48; Electrode −0,56, Kingler −0,56, Jynx −0,53, Gengar −0,41, Dragonair −0,35. Dragonite
   joga o que a nota promete (−0,06); capitão em 13% no ar (os 50% eram do 1º dia). Ditto (carta 44) joga como
   Ala ~85. Lendário 89,6 de média contra épico 81,0 e raro 81,2.
7. **Golpes mortos:** Dream Eater 0 usos em 6.639 jogos; Softboiled, Bone Club, Petal Dance, Horn Drill,
   Submission, Body Slam quase nunca. Hitmonlee: time vence 37%.
8. **Itens e habilidades quase não aparecem em campo:** habilidades ~0 no saldo; só Leftovers dá algo.
9. **Sinergias de história:** Gênese +0,86 e Pássaros +0,76; Brock, Rocket e Hitmon ~0. Tipo: Rock melhor,
   Dragon pior (−0,63).
10. **Draft:** 22% dos drafts têm uma rodada com 3 bronzes; sobram 1,66 rerolls por copa.

Limites: o jogador simulado escolhe sempre a maior nota, joga na equilibrada e não usa MT.

## O patch (aprovado como estrutura em 17/10)

A parte de balanceamento do próximo patch são 3 blocos, nessa ordem, cada um com tabela de antes e depois pro ok
do Miguel:

1. **Regras:** as 4 táticas entre 47% e 53%; curva da copa crescente (oitavas ~75–80%, final ~50–55%, Liga Índigo
   como chefe final); a nota do Fixo contando em campo; 3-1 e ferrolho viáveis.
2. **Economia:** evolução que aparece (carta mostra a nota depois de evoluir; draft oferece mais quem evolui); piso
   de nota (cada rodada com pelo menos uma prata).
3. **Cartas e golpes:** ~8 Pokémon fora da curva (quase tudo buff; Tauros e Aerodactyl descem um pouco), golpes
   que nunca saem passam a sair, itens e habilidades com efeito visível.

## Bloco 1 (regras): aprovado pelo Miguel em 17/10

Branch `teste-084` (vai pro ar junto com a 0.8.4). Fixo vira a cobertura (fica entre atacante e gol) e o
posicionamento pesa 5x mais em corte e bloqueio; bônus das táticas refeitos; 3-1 e ferrolho marcam mais à frente,
1-1-2 recua; copa com rival "estreante" nas oitavas e itens do rival 0/1/1/3.

| | Antes | Depois |
|---|---|---|
| Táticas (equil./ofens./defens./contra) | 45,6 / 51,6 / 50,4 / 52,4% | 48,9 / 48,7 / 50,6 / 51,8% |
| Saldo por ponto de nota do Fixo | 0,000 | 0,015 (Ala 0,013) |
| Copa por fase (oitavas → final) | 60 / 59 / 53 / 68% | 74 / 67 / 55 / 50% |
| Título | 13% | 14% |
| Formações (1-2-1, 2-2, 3-1, 1-1-2, ferrolho, 4-0) | 47 / 53 / 49 / 58 / 42 / 50% | 50 / 48 / 52 / 54 / 50 / 46% |
| Gols por jogo / favorito vence / goleadas | 7,16 / 65,3% / 2,8% | 6,80 / 64,2% / 1,8% |

Na borda, aceito: contra-ataque × equilibrada 57%, 4-0 em 46%, semifinal 55% (meta 58%).

## Bloco 2 (economia): aprovado pelo Miguel em 17/10

Draft do jogador (`playerDraftOptions` em `src/engine/draft.ts`; rival e recompensas sem mudança): piso de prata
(3 bronzes na vaga → a mais fraca vira uma prata que joga ali) e promessa em toda rodada (nenhuma opção vira ouro
ao evoluir → entra uma que vira). Limiar de evolução 15 → 14. A carta mostra a nota depois de evoluir naquela vaga
(seta desenhada, verde ou vermelha; `evolvedRating` em `src/engine/evolution.ts`).

Simulado "Nota" escolhe a maior nota; "Evo" escolhe pela nota depois de evoluir.

| | Antes | Depois |
|---|---|---|
| Evoluções por copa (Evo / Nota) | 0,82 / 0,20 | 1,21 / 0,25 |
| Copas com 1+ evolução (Evo) | 56% | 68% |
| Drafts com uma rodada só de bronze | 22% | 0% |
| Copa por fase, Nota (oitavas → final) | 74 / 67 / 55 / 50% | 74 / 67 / 57 / 52% |
| Título (Nota / Evo) | 14% / 13% | 15% / 13% |
| Gols por jogo / favorito vence | 6,80 / 64,2% | 6,83 / 64,2% |

Raro, épico e lendário não evoluem porque nenhum tem evolução no jogo. Quem só pega a maior nota continua quase
sem evoluir: o selo é o que mostra que vale apostar.

## Bloco 3 (cartas e golpes) e auditoria de posições: aprovados pelo Miguel em 17/10

- A lista de cartas fora da curva da 1ª auditoria era quase toda ruído (128 jogos por espécie: correlação 0,27 com a
  antiga). Cada carta mexida foi confirmada com 384 jogos (erro ±0,16).
- Goleiro passa a usar golpe (defesa com o golpe de ataque, suporte); Dream Eater, Soft-Boiled e Bone Club com regra
  nova. Usos por jogo dos golpes mortos: 0–0,05 → 0,19–0,60.
- `SPECIES_TUNING` (`src/engine/attributes.ts`): pontos em atributo que a nota da posição não usa (Pinsir, Flareon,
  Electrode, Jynx, Pikachu); nerf leve em Tauros e Aerodactyl (sem efeito medível: fica, olhar os dados no ar).
- Habilidades 1,5x (+5% → +8%), as sem efeito ganharam um; nome da habilidade sobe na quadra. Fica assim.
- Auditoria de posições: 28 suspeitos revisados em `?lab=posicoes&revisao=1` (25 ok, Mr. Mime/Beedrill/Onix mais
  fortes que a sugestão), Metapod goleiro +1, regra da serpente (porte só pelo peso) e **a evolução herda a vaga**
  (`PokemonInstance.inherited`).
- Calibrate com tudo junto: 6,64 gols/jogo, favorito 67,5% (meta 60–65; ±3 de erro), goleadas 2,8%.
- **Para um patch próprio:** a nota do Ala não conta chute e a do Pivô não conta velocidade, mas o motor usa os dois.
  É a causa da maioria dos fora da curva; mexer nas fórmulas muda a nota de todo mundo.

## Bônus de evolução: aprovado pelo Miguel em 18/10

Pedido dele: pegar carta pra evoluir tem que valer mais que pegar a pronta. Cada evolução da carta dá **+2 em todos
os atributos** (`EVOLUTION_BONUS` em `src/engine/instance.ts`, campo `PokemonInstance.evolved`, linha "Evoluiu: +N
em tudo" na regra única de `modifiers.ts`). Charmander que vira Charizard: 89 contra 85 do Charizard pronto.

| Draft (copa simulada, 300 copas cada) | Títulos antes | Títulos depois |
|---|---|---|
| Pela nota de agora | 18% | 17% (ruído ±2) |
| Mirando evolução | 14% | 17% |

Quem draftou mirando evolução: oitavas 66% → 62%, semi 55% → 66%, final 60% → 68%. O rival que evolui no meio da
partida também ganha o bônus. `ENGINE_VERSION` 3.

## Fórmula A: aprovada pelo Miguel em 19/10

A nota do Ala passa a contar chute e a do Pivô, velocidade (o motor já usava os dois). Ala: velocidade 25, drible 25,
passe 20, chute 15, fôlego 15. Pivô: chute 30, força 30, drible 15, posicionamento 15, velocidade 10. Dragonite segue
Pivô (90 ⇒ 89; `SPECIES_TUNING` goleiro −5, desarme −6, chute +4, força +2). Proposta, tabelas e ressalvas em
[patch-formula.md](patch-formula.md). `ENGINE_VERSION` 4.

| Exemplo | Antes | Depois |
|---|---|---|
| Jolteon | Ala 92 | Ala 88 |
| Alakazam | Ala 87 | Ala 83 |
| Electrode | Ala 84 | Ala 80 |
| Pikachu | Ala 66 (prata) | Ala 63 (bronze) |
| Tauros | Pivô 75 | Pivô 77 |
| Kingler | Pivô 78 | Fixo 78 |
| Rapidash | Ala 83 | Pivô 82 |
| Mr. Mime | Ala 80 | Goleiro 77 |
| Dragonite | Pivô 90 | Pivô 89 |

Calibragem (400 partidas): 6,84 gols por jogo (meta 5–7), favorito vence 62,6% (meta 60–65%), goleadas 1,8%.
