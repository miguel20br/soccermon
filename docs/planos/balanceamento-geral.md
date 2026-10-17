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
