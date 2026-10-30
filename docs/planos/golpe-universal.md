---
description: Golpe máximo universal (todo capitão chuta, o goleiro dá a bicuda), parry do goleiro contra o golpe máximo do rival, efeito na bola automático e o N3 com cena de especial; decisões de 30/10/2026.
---

# Golpe máximo universal + parry (30/10/2026)

Ideia de um amigo do Miguel, que ele aprovou ("concordo com tudo") em 30/10/2026. Motivo: a defesa máxima do goleiro é confusa,
só vale no N3 e quase ninguém usa. Agora todo golpe máximo é um chute, e o goleiro ganha um botão próprio.
Protótipo na branch `golpe-universal`. A 0.9.28 sai antes, sem isto.

## Regras

**Golpe máximo (todo capitão, goleiro inclusive):**

| Nível | Efeito |
|---|---|
| N1 | Chute forte + **status do tipo** em quem bloqueia ou defende. |
| N2 | O N1 + **derruba os jogadores de linha na linha do chute** (o goleiro não cai). |
| N3 | **Sempre no alvo** (o goleiro ainda pode dar parry) + o N2 + o efeito do tipo ou a assinatura de hoje, com a **cena de especial** (estilo Street Fighter) antes do chute. |

Status por tipo (ponto de partida): Fogo queima, Elétrico paralisa, Venenoso envenena, Gelo congela, Psíquico confunde,
Normal atordoa. Os outros tipos se fecham com o Miguel.

**Goleiro capitão: a bicuda.** No lugar da defesa máxima, a hora certa dele é a bola do rival chegando no gol. O toque
devolve a bola com um golpe máximo rumo ao gol rival e derruba quem estiver no caminho. Só no N3 ela pode virar gol direto;
no N1 e no N2 é um lançamento forte pro ataque.

**Parry (botão novo, qualquer goleiro do time):**
- Substitui a defesa máxima.
- **Só contra o golpe máximo do rival** (Miguel, 30/10/2026): acende quando um golpe máximo do rival vem no gol (qualquer
  nível, e a bicuda N3 também) e usa o mesmo anel na batida.
- O perfeito rebate pra um companheiro (contra-ataque); o bom rebate pra frente, sem dono; o fora vira a defesa normal
  daquele golpe máximo.
- **Sem recarga:** o golpe máximo do rival já é raro (~1 por jogo) e um parry vale só pra aquele chute.
- O rival também tem parry e bicuda, usados pela IA (a nota sorteada como a do golpe máximo).

**Efeito na bola (pedido do Miguel, automático desde 30/10/2026):** todo golpe máximo, em qualquer nível, curva sozinho
pro canto longe do goleiro, sem arrastar. Usa a mesma conta da curva do Psíquico, com metade do teto. O N3 Psíquico fica
com a curva dele, mais forte, sem somar.

## Polimento (pedido do Miguel: "tudo bem polido, a música na medida, efeitos especiais legais")

- A cena do N3: congela a tela, close no capitão, fundo na cor do tipo, o nome do golpe gigante, depois o chute.
- Sons e estouros próprios pro parry e pra bicuda, na família do pacote D.
- A música abaixa só na hora certa e volta com a virada.

## Motor

- Muda o resultado das partidas: motor 17 e republicar a `liga`.
- Os números de antes e depois vão pro Miguel antes de valer. Medir com `npm run calibrate -- --n 400 --agencia` e
  `scripts/balance/coach.ts`.

## Números do motor 17 (protótipo, n=400, 30/10/2026; nada aprovado)

`calibrate --agencia` (os dois times com o técnico IA) e `scripts/balance/coach.ts` (técnico robô).

| Medida | Motor 16 | Motor 17 | Motor 17 sem parry |
|---|---:|---:|---:|
| Gols/jogo | 8,10 | 7,77 | 8,30 |
| Golpe máximo por jogo (N1/N2/N3) | 0,86 (0,04/0,48/0,34) | 0,96 (0,05/0,56/0,34) | 0,95 |
| Golpe de linha que vira gol (N1/N2/N3) | 55% (24/36/93) | **15%** (16/11/24) | 72% (43/63/92) |
| Bicudas por jogo (N1/N2/N3) | — | 0,15 (0/0,07/0,08) | 0,15 |
| Bicuda N3 que vira gol | — | 6% | **100%** |
| Parry por jogo (fora/bom/perfeito) | — | 0,76 (0,08/0,19/0,49) | — |
| Técnico robô de linha, Δ vitória (contra rival sem parry) | +2,3 a +5,3 pp | +6,3 a +11,5 pp | — |
| Técnico robô goleiro, Δ vitória | +3,3 a +4,3 pp | +9,0 a +12,8 pp | — |
| Técnico robô contra o técnico IA (bom / n3) | +2,5 / +4,8 pp | +5,0 / +4,3 pp | — |

Pra decidir: o parry do técnico IA pega quase todo golpe máximo (90% das notas rebatem) e o golpe de linha cai de 55% pra
15% de gol; sem parry, a bicuda N3 é gol certo.
