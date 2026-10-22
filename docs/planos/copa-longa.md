---
description: Proposta da Copa longa (Rota Índigo) e as decisões de design.
---

# Copa longa (0.9.1): proposta (21/10/2026)

Etapa 2 da Copa roguelike ([copa-roguelike-plano.md](copa-roguelike-plano.md)). Pesquisa em duas partes:

- [copa-longa-referencias.md](copa-longa-referencias.md): Slay the Spire, Pokelike, PokéRogue, Rogue Striker,
  Balatro, Monster Train; 16 eventos com escolhas; curva de pacotes e rivais por andar; tela do mapa no celular;
  opções A/B/C e as 10 decisões.
- [copa-longa-tecnico.md](copa-longa-tecnico.md): modelo no save, gerador do mapa pela seed, lesão sem nada
  automático, os 41 lugares do código que supõem copa de 4 partidas (e os 3 ajudantes que resolvem), ordem de
  construção (~10 dias, escondida atrás de `LONG_CUP_LIVE` até o fim).

## Juntando as duas

- **Formato recomendado: B, mapa curto estilo Slay the Spire.** Grade de 3–4 colunas × 11 linhas + Final; linhas
  fixas (1 = Jogo fácil, meio = Baú, última = Treino antes da Final); o resto sorteado com regras; o gerador refaz até
  **toda rota ter 8 partidas** (a conta do técnico: rota com número fixo de jogos deixa o tempo previsível, ~35 min).
- **Cartão amarelo:** com 8 partidas e "perdeu, acabou", o título cai pra ~10% (hoje ~17% em 4). Uma derrota
  permitida fora da Final volta pra ~30%. Todo roguelite de mapa tem esse colchão (vida no Slay the Spire, velas no
  Inscryption, fase de grupos no Rogue Striker).
- **Mercado vira casa do mapa** (2–3 por rota), em vez de depois de toda vitória (7 Mercados ficaria lento).
- **Pacotes e draft:** draft da longa uma linha mais fraco (capitão raro igual), pacotes e reforços sobem a cada andar
  (ideia do amigo), rivais de −2 no começo a +3 no fim, Liga Índigo +4 na Final.
- **Copa rápida, Copa do Dia e desafio por link ficam idênticos** (teste de regressão nas seeds).

## Decidido com o Miguel (21/10/2026)

Todas as recomendadas: **B** (mapa curto), **cartão amarelo** (uma derrota fora da Final), **8 partidas** (~35 min),
**Mercado como casa do mapa**, **recompensa grátis continua**, **draft da longa mais fraco** com pacotes e rivais
subindo por andar, **rivais da Rota** com treinadores de Kanto, **8 primeiros eventos** (1 a 8 da tabela), **regra do
líder fica pra depois**, **Copa do Dia continua rápida**.

Pedido junto: **Duelo em MD3** (melhor de 3 com o mesmo time), à parte da Copa longa (`docs/planos/duelo-md3.md`).
