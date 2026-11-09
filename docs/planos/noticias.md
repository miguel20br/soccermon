---
description: Feed de Notícias nas Novidades (carrossel de cartões com arte e botão), referências e escolhas.
---

# Notícias (pedido do Miguel em 09/11/2026)

"Um lugar pra ver as features mais recentes, tipo o feed de notícias do Fortnite quando você aperta R2."

## Referências

- **Fortnite (aba de Notícias do lobby):** cartões grandes com arte própria, título curto e uma frase; troca sozinha
  e com o gatilho/setas; marca o que já foi visto. Contexto do lobby e do redesenho:
  [Fortnite Wiki](https://fortnite.fandom.com/wiki/File:Winterfest_2021_-_Lobby_Background_-_Fortnite.png),
  [SlashGear sobre o lobby novo](https://www.slashgear.com/fortnites-big-ui-redesign-makes-it-easier-to-find-non-battle-royale-games-02689429).
- **Clash Royale / Brawl Stars (News Royale, caixa de notícias):** lista de cartões com selo de não lido no botão de
  notícias; cada cartão leva pro evento ou modo. [Clash Royale](https://supercell.com/en/games/clashroyale),
  [notas de março/2026](https://supercell.com/en/games/clashroyale/blog/release-notes/march-update-2026/).
- **EA FC (Home do Ultimate Team):** carrossel de destaques no topo com pontinhos de página e botão que entra direto
  no modo; o resto da Home embaixo. [Menu do FC 26](https://realsport101.com/article/fc-26s-new-ui-a-deep-dive-into-the-redesigned-ultimate-team-menu).
- **Football Manager 26:** blocos que resumem e abrem o detalhe ao tocar (mesma ideia do cartão + "Ver a versão").
  [FM26](https://www.footballmanager.com/node/960).
- Em comum: arte grande e dona do cartão, texto de uma linha, um botão só, navegação lateral (dedo, setas, controle),
  selo de não lido que some quando o cartão aparece.

## O que entrou

- Botão Novidades da barra de cima abre o feed: carrossel das Notícias em cima, a versão de agora com os destaques e
  a lista de todas as versões embaixo (nada do changelog saiu).
- Cartões em `src/ui/news.ts` (lista declarativa); o carrossel e as artes em `src/ui/components/NewsFeed.tsx`, que só
  baixa ao abrir.
- Pontinho no botão enquanto houver cartão no ar que o save não viu (`Profile.newsSeen`, junta com a nuvem) ou a
  versão nova não foi aberta. Cartão conta como visto quando aparece no carrossel.
- Autoplay de 6 s que para de vez no primeiro toque; sem autoplay com Reduzir movimento.

## Escolhas que dá pra mudar

- Artes: cenas que o jogo já tem (Estádio e pacote do menu de modos) e duas montadas com sprites (Charizard com
  faixas de cinema; banco com a vaga tracejada). Dá pra trocar por print do jogo.
- "Jogar" da copa leva pro Estádio (não escolhe Copa longa sozinho).
- Selo "Nova" no cartão não visto; pontinho some só depois de passar por todos os cartões.
- O cartaz antigo (símbolo com raios) saiu: o carrossel ocupa o topo.
