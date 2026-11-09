---
description: Novidades em tela cheia (Notícias em carrossel com arte e botão, e as Notas da versão), referências e escolhas.
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

- **Tela cheia (Miguel, 09/11: a versão na janelinha ficou tímida).** O botão Novidades da barra de cima abre a tela
  inteira, com duas abas no topo: **Notícias** e **Notas da versão**. Fecha no X, no Esc e no voltar do Android (uma
  entrada de histórico enquanto está aberta). Entra com fade e sai com o fantasma do `exit-motion.ts`.
- **Notícias:** um cartão por tela. Em pé, a arte em cima e o texto embaixo; deitado e no PC, o texto à esquerda e a
  arte enchendo o resto (o sprite cresce com a tela: 2 no celular pequeno, até 5 no PC). Arrastar, setas grandes
  (em pé ficam embaixo, nas bordas, pra não tapar os Pokémon), ← → no teclado, pontinhos no celular e abas com o
  título do cartão a partir de 700 px (a da vez enche durante o autoplay).
- **Notas da versão:** a versão de agora com os destaques e a lista de todas; tocar numa abre ela inteira (nada do
  changelog saiu).
- **Botão com destino e rótulo próprio** (`cta` em `src/ui/news.ts`): Copa do Dia → "Jogar a Copa do Dia" (tela da
  Copa do Dia); golpe máximo do rival → "Ver na copa" (Estádio); vaga vazia no banco → "Jogar a Copa longa" (a aba
  Rota, onde mora a Copa longa); Time Ultimate → contagem até 27/11, depois "Jogar". A troca de aba vai por
  `goTab` (`ambientes/nav.ts`): com a Home aberta é o corte de TV da aba; com o menu de modos na frente, ele sai.
- **Próximos cartões** em `NEXT_NEWS` (no lugar do comentário): "Meus pacotes e Picks" (Time Ultimate), "Rota nova"
  (mapa largo, Safari, Cassino) e "Golpedex: especiais e bicudas", com arte e destino. Pra ligar, passe o cartão pra
  `NEWS` com a data. Nas prévias, `?noticias=prox` mostra eles no feed.
- Igual a antes: selo "Nova" no cartão não visto, visto no save (`Profile.newsSeen`, junta com a nuvem), pontinho
  no botão, autoplay de 6 s que para no primeiro toque (sem autoplay com Reduzir movimento), o feed num pedaço
  separado que só baixa ao abrir.

## Escolhas que dá pra mudar

- Artes: cenas que o jogo já tem (Estádio e pacote do menu de modos) e as montadas com sprites e cartas (Charizard
  com faixas de cinema; o banco na beira da quadra do Estádio; pacotes e as três cartas do Picks; o mapa com a grama
  da Safari e as fichas; Snorlax na bicuda e Gengar no especial). Dá pra trocar por print do jogo.
- "Jogar a Copa longa" leva pra aba Rota (o botão grande da Copa longa está lá), não começa a copa sozinho: com uma
  copa em andamento, começar outra pede confirmação, e isso fica na tela dela.
- No PC o texto fica numa coluna à esquerda (até 560 px), com a arte saindo por baixo dela num degradê.
