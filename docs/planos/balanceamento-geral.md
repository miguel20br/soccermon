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

## Dados

A auditoria por simulação e os dados ao vivo entram aqui quando chegarem.
