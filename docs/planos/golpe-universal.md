---
description: Golpe máximo universal (todo capitão chuta, o goleiro dá a bicuda), parry do goleiro no lugar da defesa máxima, efeito na bola e o N3 com cena de especial; decisões de 30/10/2026.
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
- Acende quando um chute vem no gol e usa o mesmo anel na batida.
- O perfeito rebate pra um companheiro (contra-ataque); o bom rebate pra frente, sem dono; o fora vira a defesa normal.
- Recarga de uns 20 s de partida.
- O rival também tem parry e bicuda, usados pela IA.

**Efeito na bola (pedido do Miguel):** no toque do golpe máximo, arrastar pro lado curva o chute de leve. Usa a mesma conta da
curva do Psíquico, com um teto menor. Sem arrastar, o chute sai reto.

## Polimento (pedido do Miguel: "tudo bem polido, a música na medida, efeitos especiais legais")

- A cena do N3: congela a tela, close no capitão, fundo na cor do tipo, o nome do golpe gigante, depois o chute.
- Sons e estouros próprios pro parry e pra bicuda, na família do pacote D.
- A música abaixa só na hora certa e volta com a virada.

## Motor

- Muda o resultado das partidas: motor 17 e republicar a `liga`.
- Os números de antes e depois vão pro Miguel antes de valer. Medir com `npm run calibrate -- --n 400 --agencia` e
  `scripts/balance/coach.ts`.
