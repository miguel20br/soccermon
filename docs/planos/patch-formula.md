# Patch da fórmula: Ala contando chute, Pivô contando velocidade (proposta, 19/10/2026)

**Nada foi aplicado.** O código do motor está igual; os números abaixo saem de `scripts/balance/formula-patch.ts`,
que troca a fórmula só na memória (`table`, `calibrate <base|A|B>`, `econ <base|A|B>`). Aplicar exige o ok do
Miguel, subir `ENGINE_VERSION` (`src/engine/config.ts`) e conferir `eligiblePositions`, `POSITION_OVERRIDES` e
`SPECIES_TUNING` (`src/engine/attributes.ts`).

## O que os dados dizem

- Pendência antiga do balanceamento geral: a nota do Ala não conta chute e a do Pivô não conta velocidade, mas o motor
  usa os dois. É a causa provável de boa parte das cartas que rendem diferente da nota.
- A lista de "fora da curva" da 1ª auditoria era quase toda ruído (128 jogos por espécie, correlação 0,27 com a
  medição seguinte). Mesmo assim, a direção da proposta A bate com ela em 5 de 10: Tauros sobe 2, Scyther sobe 1,
  Electrode desce 4, Jynx desce 3 e Gengar desce 3. Mewtwo, Snorlax, Dragonair e Kingler ficam iguais. Aerodactyl
  desce 1, que é o lado errado.
- No calibrate, a nota prevê melhor o vencedor: o mais forte (Δ≥3) vence 59,0% hoje e 63,3% com a A, dentro da meta
  de 60–65%. O erro de 400 partidas é ±3 pontos.

## As duas fórmulas

| Posição | Hoje | **A (recomendo)** | B (mais leve) |
|---|---|---|---|
| Ala | velocidade 30, drible 30, passe 25, fôlego 15 | velocidade 25, drible 25, passe 20, **chute 15**, fôlego 15 | velocidade 27, drible 27, passe 23, **chute 10**, fôlego 13 |
| Pivô | chute 35, força 35, drible 15, posicionamento 15 | chute 30, força 30, drible 15, posicionamento 15, **velocidade 10** | chute 32, força 32, drible 13, posicionamento 13, **velocidade 10** |

## Antes ⇒ depois (nível 50)

Ala e Pivô: hoje ⇒ A / B. Posições: hoje ⇒ A.

| Pokémon | Chute | Velocidade | Ala | Pivô | Posições | Nota da carta |
|---|---|---|---|---|---|---|
| Pikachu | 51 | 87 | 66 ⇒ 63 / 65 | 49 ⇒ 53 / 52 | Ala | 66 ⇒ 63 / 65 (prata vira bronze na A) |
| Jolteon | 70 | 99 | 92 ⇒ 88 / 90 | 71 ⇒ 74 / 73 | Ala | 92 ⇒ 88 / 90 |
| Alakazam | 63 | 94 | 87 ⇒ 83 / 85 | 64 ⇒ 68 / 67 | Ala | 87 ⇒ 83 / 85 |
| Gengar | 72 | 92 | 86 ⇒ 83 / 85 | 70 ⇒ 73 / 72 | Ala | 86 ⇒ 83 / 85 |
| Electrode | 59 | 99 | 84 ⇒ 80 / 81 | 67 ⇒ 71 / 70 | Ala | 84 ⇒ 80 / 81 |
| Jynx | 67 | 84 | 84 ⇒ 81 / 82 | 63 ⇒ 66 / 65 | Ala | 84 ⇒ 81 / 82 |
| Aerodactyl | 74 | 97 | 82 ⇒ 81 / 81 | 76 ⇒ 78 / 78 | Ala/Pivô | 82 ⇒ 81 / 81 |
| Rapidash | 81 | 95 | 83 ⇒ 82 / 83 | 81 ⇒ 82 / 82 | Ala/Pivô ⇒ Pivô/Ala | 83 ⇒ 82 / 82 |
| Primeape | 77 | 85 | 75 ⇒ 75 / 75 | 72 ⇒ 74 / 74 | Ala/Pivô ⇒ Pivô/Ala | 75 ⇒ 74 / 74 (ouro vira prata) |
| Tauros | 67 | 94 | 74 ⇒ 73 / 73 | 75 ⇒ 77 / 77 | Pivô/Ala/Fixo ⇒ Pivô | 75 ⇒ 77 / 77 |
| Scyther | 76 | 91 | 77 ⇒ 77 / 77 | 79 ⇒ 80 / 80 | Pivô/Fixo/Ala ⇒ Pivô | 79 ⇒ 80 / 80 |
| Arcanine | 91 | 89 | 86 ⇒ 87 / 87 | 87 ⇒ 87 / 87 | Pivô/Ala | 87 ⇒ 87 / 87 |
| Mewtwo | 94 | 94 | 93 ⇒ 93 / 93 | 91 ⇒ 91 / 91 | Ala/Pivô/GOL | 93 ⇒ 93 / 93 |
| Nidoking | 83 | 74 | 76 ⇒ 77 / 76 | 79 ⇒ 78 / 78 | Pivô ⇒ Pivô/Ala/GOL | 79 ⇒ 78 / 78 |
| Kingler | 78 | 66 | 57 ⇒ 61 / 59 | 78 ⇒ 76 / 77 | Pivô/Fixo ⇒ Fixo/Pivô | 78 ⇒ 78 / 77 |
| Hitmonlee | 79 | 75 | 61 ⇒ 64 / 63 | 75 ⇒ 74 / 75 | Pivô | 75 ⇒ 74 / 75 (ouro vira prata na A) |
| Dragonair | 71 | 66 | 67 ⇒ 67 / 67 | 67 ⇒ 67 / 67 | Pivô/Ala/Fixo | 67 ⇒ 67 / 67 |
| Machamp | 84 | 47 | 60 ⇒ 64 / 62 | 80 ⇒ 76 / 77 | GOL | 91 ⇒ 91 / 91 |
| Snorlax | 81 | 25 | 51 ⇒ 56 / 54 | 77 ⇒ 71 / 72 | GOL | 91 ⇒ 91 / 91 |
| **Dragonite** | 94 | 69 | 78 ⇒ 81 / 80 | 90 ⇒ 87 / 88 | **Pivô/GOL/Fixo ⇒ GOL/Fixo/Pivô** | **90 ⇒ 93 / 93** |

**Quem mais mexe (A):**
- Ala sobe: Rhydon 44⇒50, Parasect 45⇒50, Graveler 37⇒42, Golem 50⇒55, Snorlax 51⇒56, Machoke 49⇒53, Machamp 60⇒64,
  Geodude 28⇒32, Grimer 39⇒43, Muk 61⇒65. Ninguém deles joga de Ala, então a nota da carta não muda.
- Ala desce: Voltorb 71⇒65, Magikarp 49⇒44, Mr. Mime 80⇒75, Kadabra 80⇒75, Meowth 64⇒59, Jolteon 92⇒88,
  Electrode 84⇒80, Tentacool 59⇒55, Alakazam 87⇒83, Abra 73⇒69.
- Pivô sobe: Diglett 41⇒47, Voltorb 45⇒51, Meowth 40⇒45, Poliwag 43⇒48, Magikarp 34⇒39, Pikachu 49⇒53,
  Persian 64⇒68, Abra 48⇒52, Kadabra 55⇒59, Alakazam 64⇒68.
- Pivô desce: Snorlax 77⇒71, Rhydon 73⇒68, Slowbro 72⇒67, Golem 77⇒72, Graveler 68⇒63, Rhyhorn 59⇒55,
  Exeggutor 82⇒78, Geodude 55⇒51, Machamp 80⇒76, Machoke 67⇒63.

**Resumo dos 151:**

| | A | B |
|---|---|---|
| Média da nota de Ala / Pivô | 61,6 ⇒ 61,6 / 61,2 ⇒ 61,3 | igual |
| Nota da carta, Δ médio (maior / menor) | −0,78 (+3 / −6) | −0,46 (+3 / −4) |
| Mudam de posição principal | 15 | 8 |
| Mudam a lista de posições | 47 | 34 |
| Mudam de metal (bronze/prata/ouro) | 7, todos descendo 1–3 (Ivysaur, Pikachu, Golbat, Primeape, Gastly, Hitmonlee, Staryu) | 5 |
| Posição principal (GOL / Fixo / Ala / Pivô), hoje 29 / 31 / 62 / 29 | 32 / 36 / 61 / 22 | 30 / 34 / 60 / 27 |

Na A, mudam de posição principal: Nidorino, Bellsprout, Weepinbell e Victreebel (de Pivô pra Ala); Dugtrio, Primeape
e Rapidash (de Ala pra Pivô); Cloyster, Krabby, Kingler, Exeggutor e Kabutops (de Pivô pra Fixo); Tentacool e
Mr. Mime (de Ala pra GOL); e **Dragonite (de Pivô pra GOL)**.

## Efeito geral

`npm run calibrate -- --n 400` (times draftados pela IA com a fórmula de cada coluna):

| | Hoje | A | B |
|---|---|---|---|
| Gols por jogo (meta 5–7) | 7,29 | 6,91 | 6,77 |
| Empates no tempo normal | 13,8% | 14,0% | 15,5% |
| Goleadas (6+ gols de diferença) | 1,0% | 3,3% | 1,5% |
| Mais forte (Δ≥3) vence (meta 60–65%) | 59,0% | **63,3%** | 66,4% |
| Táticas (contra / equil. / defens. / ofens.) | 50 / 48 / 50 / 52% | 53 / 47 / 47 / 53% | 54 / 46 / 51 / 49% |

Economia do draft (`scripts/balance/econ.ts`, 4000 drafts, hoje ⇒ A):
- nota média dos titulares sem reroll: 80,6 ⇒ 80,1;
- cartas comuns que viram prata: 6 ⇒ 3 de 53 (as comuns ficam um pouco mais bronze);
- rodada só com bronze: 0% ⇒ 0%, porque o piso de prata segura;
- vaga de Pivô na 4ª rodada: mais bronze nas opções (24% ⇒ 29%);
- **Dragonite: escolhido quando aparece em 81% ⇒ 98%** (vira GOL 93) e passa a ser o capitão mais escolhido (8% ⇒ 10%).

## Ressalvas

- **Dragonite vira goleiro 93.** O Pivô dele cai de 90 pra 87 e o Goleiro (91 com o −2 do viés) passa na frente. Ele
  já é o capitão mais visado. Pra manter como Pivô, junto com a A: `SPECIES_TUNING` de Dragonite com goleiro −3. A
  carta fica Pivô 87, um nerf leve no topo da tabela.
- 15 Pokémon mudam de posição principal, e 4 deles saem do Pivô pro Fixo (Kingler, Cloyster, Kabutops, Exeggutor). O
  Pivô fica com menos donos naturais (29 ⇒ 22). Na B são 8 e 27.
- Goleadas sobem pra 3,3% na A. Ainda é pouco (o bloco 1 aprovou 2,8%), mas com 400 partidas é preciso confirmar com
  mais jogos.
- Os ajustes do bloco 3 em `SPECIES_TUNING` contornavam justamente esse buraco: chute a mais pra Pikachu, Electrode
  e Jynx (Ala) e velocidade a mais pra Pinsir e Flareon (Pivô), "no atributo que a nota não conta". Com a A, esse
  atributo passa a contar na nota: o bônus sobe a carta de Pinsir e Flareon e segura um pouco a queda dos três da
  Ala. Precisa revisar um por um: talvez dê pra tirar alguns.
- O calibrate só mede a IA draftando pela nota e jogando na equilibrada. O teste de nota × impacto por espécie, de
  ~1h40, não foi rodado: é ele que diria se as cartas pararam de "mentir". Vale rodar depois do ok.
- Simulação não é diversão. Antes de aplicar, é bom jogar umas partidas na prévia com Jolteon, Alakazam e Tauros.

## Decisões pro Miguel (recomendação primeiro)

1. **Fórmula A** (Ala com chute 15, Pivô com velocidade 10). Recomendo: o favorito vence dentro da meta e as cartas se
   mexem no sentido que a auditoria apontava. A B é a opção mais cautelosa (8 trocam de posição), mas o favorito
   passa da meta (66%).
2. **Dragonite continua Pivô** (goleiro −3 em `SPECIES_TUNING`, carta 90 ⇒ 87)? Recomendo sim. Sem isso ele vira GOL
   93 e é escolhido em 98% das vezes que aparece.
3. **Os outros 14 que mudam de posição principal** (lista acima): aceitar como a fórmula manda? Recomendo aceitar e
   conferir no `?lab=posicoes&revisao=1` depois de aplicar.
4. **Quando:** junto com o próximo patch de balanceamento, com `ENGINE_VERSION` 4, uma rodada de teste de troca e as
   notas do patch (antes ⇒ depois das cartas que mudam de metal).
