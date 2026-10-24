---
description: Medida (23/10/2026, main 0.9.16) de quanto o golpe máximo N3 vale por capitão, sem a bandeira SIG; mostra que o desvio é do atributo do capitão, não do efeito do tipo, e lista opções sem aplicar nada.
---

# N3 por capitão (main 0.9.16)

Pergunta: o efeito de tipo do N3 (já no ar) desequilibra com capitães fortes? **Nada foi alterado no jogo**; decisão do Miguel.

## Método

`scripts/balance/coach.ts` (vindo da branch `assinaturas`, sem `SIG`), `CAPID=<id> POLS=n3`, n=400 partidas pareadas,
motor 12 (`maxType` ligado, como no ar). Δ = vitória segurando pro N3 menos nunca usar, mesmas seeds; ± é 1 desvio
da diferença. Rival parado (como hoje), robô com a nota do toque sorteada (40/40/20). Rodada pela fila pesada.
Saídas em `~/.cache/soccermon-tmp` (fora do repo).

## Tabela (15 mais escolhidos + 3 médios)

| Capitão | Tipo (efeito) | Nunca | N3 | Δ pp | ± |
|---|---|---:|---:|---:|---:|
| Mewtwo | Psíquico | 59,0% | 64,8% | **+5,8** | 1,7 |
| Mew | Psíquico | 57,0% | 61,5% | **+4,5** | 1,8 |
| Gyarados | Água | 59,8% | 63,2% | +3,5 | 1,4 |
| Zapdos | Elétrico | 56,0% | 59,0% | +3,0 | 1,9 |
| Dragonite | Dragão | 51,7% | 54,5% | +2,8 | 1,4 |
| Moltres | Fogo | 48,5% | 51,0% | +2,5 | 1,1 |
| Pikachu | Elétrico | 42,0% | 44,3% | +2,3 | 1,1 |
| Blastoise | Água | 31,3% | 33,0% | +1,8 | 0,9 |
| Charizard | Fogo | 58,0% | 59,8% | +1,8 | 1,6 |
| Ditto | Normal | 53,8% | 55,5% | +1,8 | 1,6 |
| Gengar | Fantasma | 49,3% | 50,7% | +1,5 | 1,6 |
| Articuno | Gelo | 55,5% | 56,8% | +1,3 | 1,4 |
| Dragonair | Dragão | 34,0% | 34,8% | +0,8 | 0,6 |
| Arcanine | Fogo | 53,8% | 53,8% | 0,0 | 1,0 |
| Snorlax | Normal | 24,8% | 24,8% | 0,0 | 0,9 |
| Médio: Rapidash | Fogo | 47,0% | 47,5% | +0,5 | 0,7 |
| Médio: Tauros | Normal | 49,0% | 49,3% | +0,3 | 0,8 |
| Médio: Machamp | Lutador | 27,8% | 26,3% | -1,5 | 0,7 |

Média dos 15: **+2,2 pp** (limite média + 1,5 = **+3,7**). Médios de referência: -0,2. Arcanine e Snorlax
ficam em zero porque quase não chegam ao N3 (conferir: `máx sai` no `.txt`).

Fora da curva: **Mewtwo (+5,8)** e **Mew (+4,5)**. Gyarados (+3,5) e Zapdos (+3,0) ficam colados no limite, dentro
do erro. Charizard (+1,8) **não** passou do limite (o +3 do achado vinha de outra rodada/ruído, ±1,6).
Nota: o +8,5 do Mewtwo na branch `assinaturas` é com `SIG` ligado (assinatura somada); só com o N3 do ar deu +5,8.

## Causa: o atributo do capitão, não o tipo

Mesma rodada com o efeito do tipo desligado (`NOTYPE=1`, `maxType: false`):

| Capitão | Δ com tipo | Δ sem tipo | Efeito do tipo |
|---|---:|---:|---:|
| Mewtwo | +5,8 | +5,5 | +0,3 (dentro do erro) |
| Mew | +4,5 | +5,0 | -0,5 |
| Gyarados | +3,5 | +5,0 | -1,5 |

O efeito de tipo (curva do Psíquico, onda da Água) não explica o desvio: sem ele o ganho é o mesmo. Quem
passa do limite é o chute N3 de capitão com chute alto (Mewtwo, Mew, Gyarados: atributo de chute no topo dos 151).
Descarta a suspeita de que a curva do Psíquico esteja quebrada; ela mal mexe no resultado.

Variantes do tipo (n=400, pareadas): curva do Psíquico 0,14 (atual, ~8°) ⇒ 0,10 (~5,7°) ⇒ 0,07 (~4°):
Mewtwo +5,8 ⇒ +6,8 ⇒ +6,3; Mew 0,10: +3,8. Tudo dentro do erro (±1,7): mexer na curva **não** resolve.
Água `push` 2,5 ⇒ 1,5 m: Gyarados +3,0.

## Opções (nenhuma aplicada)

Os botões globais do N3 também não resolveram: força do N3 (`maxLevelShot[3].power`) 2,2 ⇒ 1,9 deu Mewtwo +6,3,
Mew +5,8, Gyarados +3,5, Dragonite +3,5; alcance do goleiro rival 0,7 ⇒ 0,8: Mewtwo +6,3, Mew +4,8, Gyarados +4,3;
mira (`maxAim`) 0,6 ⇒ 0,9: Mewtwo +7,0, Mew +5,0, Gyarados +3,0. O N3 já converte (~0,55 gol/jogo do Mewtwo)
quase igual em qualquer um desses valores. Sobram:

**A. Ajustar o capitão (`SPECIES_TUNING`, `src/engine/attributes.ts`).** Tirar pontos de chute do Mewtwo e do Mew
(e do Gyarados se o Miguel quiser) como "atributo escondido" que a posição não conta, ou mudar a posição de capitão. Muda a
nota/jogo deles em todos os modos, não só no N3, então tem que ser medido com `exp.ts`. Alvo: Δ ≤ +3,7. Sem número
medido ainda; é a opção de menor mexida no resto do jogo (2 a 3 espécies).

**B. Teto de gols do N3 por partida ou recarga maior para capitão forte.** Ex.: a barra do N3 volta a encher em 15
pontos em vez de 12 (`maxLevelPts`) só depois de um N3 que virou gol. Reduz `máx sai` (0,66/jogo do Mewtwo), vale pra
todos e puxa a média dos 15 (+2,2) pra baixo junto. Sem número medido ainda; é regra nova de jogo.

**C. Deixar como está.** +5,8 pp num capitão que o jogador escolhe com a vaga mais cara é o preço de um golpe que já é
raro (0,66 por jogo). Média geral +2,2 e médios em zero: o N3 não desequilibra a copa.

Recomendação do medidor: C ou A só pro Mewtwo e Mew. Qualquer uma pede o ok do Miguel e, no caso de A ou B,
`ENGINE_VERSION` 13 e republicar a `liga`.
