---
description: Revisão dos menus em três portas e da arte da Sala de troféus.
---

# Menus coesos e a arte da sala (revisão, 20/10/2026)

Pedido do Miguel (20/10, depois de ver a Sala de troféus na `v089`): "não sei se gostei das pixel arts, acho que tá
com um estilo diferente do que eu queria. E tá faltando coesão/integração entre os menus; alguns estão redundantes e
meio confusos. Revise isso tudo." **Nada de código antes das decisões do fim.**

Como foi feita: prints de todas as telas e abas no celular (390 px) com um save cheio (`?demo=sala`), lendo o que
cada uma mostra e de onde vem o dado.

## 1. O que está repetido ou confuso hoje

| # | Problema | Onde aparece |
|---|---|---|
| 1 | **Recordes em 4 lugares** | Home (chips: títulos, copas, perfeitas, destaques, evoluções, ícones), topo do Perfil (Copas, Títulos, Gols), aba Números (Recordes = os mesmos 6 da Home + Carreira), Sala de troféus (taças) |
| 2 | **Duas "vitrines" diferentes** com o mesmo nome | Medalhas → "Vitrine 3/3" (3 destaques: medalha, coleção ou selo, aparecem no cartão) e Pokédex → Álbum → "Vitrine de cartas 0/3"; a sala ainda tem a "vitrine de vidro" (as cartas) |
| 3 | **Treinadores duas vezes** | Meu clube → "Seu treinador" (grade dos 46 com "como liberar") e Missões (as mesmas missões, agora como lista, dando os mesmos treinadores e títulos) |
| 4 | **"Novidades" quer dizer duas coisas** | Home → Novidades = notas da versão; Perfil → barra "NOVO · 106 novidades · Marcar como visto · Marcar tudo (213)" em cada aba = coisas ganhas e não vistas |
| 5 | **Selos de carreira no lugar errado** | São por espécie (Charizard Folha, Holo…), mas ocupam uma grade enorme na aba Medalhas; na Pokédex/ficha eles quase não aparecem |
| 6 | **Contador de figurinhas duas vezes** | Pokédex → "Figurinhas 104/622 · Ver álbum" e Álbum → "Álbum 104/622" |
| 7 | **Coleções separadas** | Pokédex e Álbum no Perfil, Golpedex num bloco da Home |
| 8 | **Três portas pra ajuda** | Boas-vindas "Como jogar" na Home, botão "?" e o bloco Ajuda |
| 9 | **Perfil com 6 abas em 2 fileiras** e dois botões no topo ("Ver meu perfil público", "Sala de troféus") que levam a coisas que se sobrepõem às abas (o cartão repete o topo; a sala repete Medalhas, Números e Hall) |
| 10 | A sala (nova) virou **mais um lugar** em vez de juntar os outros: broches = Medalhas, TV/taças = Hall, nada sai de lugar nenhum |

O padrão: cada coisa nova ganhou o seu canto, e ninguém juntou os cantos. A pergunta que cada tela devia
responder não está clara: **quem eu sou**, **o que eu coleciono**, **o que eu ganhei**.

## 2. Opções de estrutura

| Opção | Ideia | Esforço | Risco |
|---|---|---|---|
| A. Faxina | Mantém Perfil com abas, só tira as repetições: recordes saem da Home, uma "vitrine" só, Missões dentro de Treinador, selos na ficha, contador só no Álbum, "Notas da versão" | pequeno | baixo; continua sem "lugar" pras coisas |
| **B. Três portas (recomendada)** | Home com os modos de jogo + **Perfil** (quem eu sou), **Coleção** (o que eu coleciono) e **Sala de troféus** (o que eu ganhei). Cada coisa mora num lugar só | médio | médio (mexe em navegação; prints e textos de ajuda mudam) |
| C. Sala como centro | A sala vira o "quarto" de onde tudo abre: estante de livros → Pokédex/Álbum, TV → números, espelho → perfil, mesa → missões | grande | alto: bonito, mas achar as coisas fica mais lento no celular |

### Como fica a B

- **Home:** Copa, Duelo, Copa do Dia, Liga (como hoje) e uma fileira com as **3 portas** (Perfil, Coleção, Sala de
  troféus). Embaixo, pequeno: Ajuda, Notas da versão, Configurações (Créditos e "Dar feedback" dentro de
  Configurações). Saem os chips de recordes (vão pra sala) e o Golpedex (vai pra Coleção).
- **Perfil (quem eu sou):** o topo **é o seu cartão público** (some o botão "Ver meu perfil público"). Abas:
  - **Treinador:** nome, avatar, treinador e título. Os bloqueados mostram a missão que libera: **a aba Missões
    some** (é a mesma lista vista de outro jeito).
  - **Clube:** cor, escudo, uniforme e faixa.
  - **Amigos.**
- **Coleção (o que eu coleciono):** Pokédex (com os **selos de carreira dentro da ficha da espécie**), Álbum (a única
  **Vitrine de cartas** fica aqui) e Golpedex.
- **Sala de troféus (o que eu ganhei):** taças da Copa (abre o Hall da Fama), Copa do Dia, Duelo, **broches = as
  medalhas** (tocar abre a lista das 20 com o progresso: **a aba Medalhas some**), o painel de **números e
  recordes** (**a aba Números some**), o diploma (platina) e os **Destaques** (o nome novo da vitrine de 3 que vai no
  cartão: broche, coleção ou selo).
- **NOVO:** o pontinho continua; cada coisa nova some do NOVO quando aparece na tela. Saem as barras "Marcar como
  visto / Marcar tudo" de cada aba.

Resultado: Perfil com 3 abas (uma fileira no celular), nada aparece em dois lugares, e a sala deixa de ser um extra:
é onde moram medalhas, números, Hall e destaques.

## 3. A arte da sala

O que estava combinado: "pixel art do Red/Blue (quarto de Pallet), combina com a abertura do trailer". O que eu
fiz foi uma **parede vista de frente, com madeira, cortiça e veludo em CSS**: parece um móvel de site, não um
quarto de Pokémon. Nenhum jogo da série tem esse traço.

Direções possíveis (todas desenhadas por nós, sem tile copiado de jogo):

| Direção | Como é | Combina com | Cuidado |
|---|---|---|---|
| **1. FireRed/LeafGreen (recomendada)** | O quarto do Red visto de cima, em 3/4, tiles de 16 px: piso de tábua, parede com janela, TV com o console, PC, planta; a estante de troféus e a vitrine são móveis do quarto. Contorno escuro e 4 a 5 tons por material | os sprites de treinador (são do FRLG), o Carvalho da abertura do trailer | troféus ficam pequenos no quarto: tocar dá zoom (a câmera desliza até o móvel) |
| 2. Game Boy (Red/Blue) | Mesma planta do quarto, só 4 tons (verde ou cinza), traço grosso | a caixa de diálogo do trailer, nostalgia máxima | destoa do resto do jogo, que é colorido; metal (bronze/prata/ouro) some em 4 tons |
| 3. Mystery Dungeon | Sala no traço do PMD, com o seu capitão andando pela sala | os Pokémon da quadra e os retratos (são PMD) | mais trabalho de arte; menos "quarto de Pallet" |

Junto da direção: o **nível da sala** vira o próprio cenário do jogo (quarto do Red → sede do clube → vestiário
do estádio), e a cor do clube entra no tapete e na bandeira, não na parede inteira.

## Decidido com o Miguel (20/10/2026)

Todas as recomendadas: **B (três portas)**, Missões dentro de Treinador, Medalhas/Números/Hall dentro da sala,
Golpedex na Coleção, selos na ficha da espécie, "Destaques" e "Vitrine de cartas", NOVO que some sozinho e "Notas da
versão". Mais: **diagramação convencional** no site todo (ex.: a engrenagem das Configurações num lugar estranho). Arte
da sala: **ver o quarto de teste antes** (direção 1, FireRed/LeafGreen, em `?lab=sala`); a sala funciona com qualquer
arte (o quarto é a cena de cima, as seções ficam embaixo).

## Feito na `v089` (20/10/2026)

| Peça | Onde |
|---|---|
| As três portas na Home (com contador e o pontinho de novidade), rodapé convencional (Notas da versão, Ajuda, Créditos, Dar feedback, Privacidade, GitHub, PT/EN) e o canto de cima igual em toda tela de menu (Ajuda só na Home, engrenagem das Configurações, Perfil) | `src/ui/screens/Home.tsx`, `src/ui/components/TopActions.tsx` |
| Perfil = Treinador (com as missões: cada bloqueado mostra a sua), Clube, Amigos; o topo é o cartão público (com as taças) | `src/ui/screens/Profile.tsx`, `ClubTab part` |
| Coleção = Pokédex (selos de carreira na ficha, com "Destacar"), Álbum, Golpedex | `src/ui/screens/Collection.tsx` |
| Sala de troféus = o quarto (FireRed, canvas 240x160, cada móvel leva à seção dele) + Troféus (Copa com o Hall da Fama, Copa do Dia, Duelo, Liga, Platina), Medalhas (com os Destaques), Números | `src/ui/screens/TrophyRoom.tsx`, `src/ui/trophy/RoomScene.tsx` |
| Abas por porta e links antigos (`?perfil=medalhas`, `?perfil=album`…) levando pro lugar novo; `?aba=` abre direto | `src/ui/doors.ts` |
| NOVO sem as barras "Marcar como visto"; cada novidade conta na porta e na aba onde ela mora | `src/store/news.ts` (`NEWS_DOORS`) |
| Configurações: Idioma como as outras seções, volume na largura toda; Copa do Dia com a data em minúscula e o login alinhado | `Settings.tsx`, `settings`/`liga.css` |

## 4. Decisões pro Miguel

1. **Estrutura:** B, as três portas **(recomendado)** / A, só a faxina / C, a sala como centro.
2. **Missões dentro de Treinador** (o bloqueado mostra o que libera) e a aba Missões some **(recomendado)** / manter a aba.
3. **Medalhas, Números e Hall dentro da sala** (as abas somem) **(recomendado)** / manter as abas e a sala só mostra.
4. **Golpedex na Coleção** (sai da Home) **(recomendado)** / fica na Home.
5. **Selos de carreira na ficha da espécie** (Coleção → Pokédex) **(recomendado)** / ficam em Medalhas.
6. **Nomes:** "Destaques" (os 3 do cartão) e "Vitrine de cartas" (as 3 cartas) **(recomendado)** / outros.
7. **NOVO** some sozinho quando a coisa aparece na tela, sem as barras "Marcar como visto" **(recomendado)** / manter
   as barras. E "Novidades" da Home vira **"Notas da versão"**.
8. **Arte da sala:** 1, FireRed/LeafGreen visto de cima **(recomendado)** / 2, Game Boy 4 tons / 3, Mystery Dungeon.
   Antes de espalhar, um quarto de teste em `?lab=sala` pra você aprovar.

## Pesquisa da arte do quarto (20/10/2026, depois do "não gosto do estilo")

O Miguel: mistura do A (cenário) com o B (museu escuro, troféu grande), visual moderno, vivo, tudo numa tela; o maior
problema é o traço, e o jeito de mostrar as informações.

- **Galeria de troféus do Smash Bros. (Melee/Brawl):** o troféu sozinho, grande, girando, com o texto do lado; dá pra
  girar e dar zoom. É o modelo pra mostrar a informação: o troféu escolhido no centro, um cartão curto ao lado.
  ([SmashWiki: Trophy](https://www.ssbwiki.com/Trophy), [Trophy Hoard](https://www.ssbwiki.com/Trophy_Hoard))
- **Salas isométricas 3D na web (three.js):** câmera ortográfica em ângulo, luz quente pontual, troca de luz ao
  tocar; leve se a luz for "assada". ([exemplo isométrico](https://freefrontend.com/code/isometric-3d-baked-room-2026-02-16/))
- **Móveis low-poly livres:** [KayKit Furniture Bits](https://github.com/KayKit-Game-Assets/KayKit-Furniture-Bits-1.0)
  (CC0, glTF, 50+ móveis no traço arredondado "de brinquedo") e o
  [Furniture Kit da Kenney](https://opengameart.org/content/furniture-kit) (CC0, 120 objetos). Resolvem o traço sem
  desenhar à mão.
- Não achei uma "sala de troféus" pronta em jogo de futebol (o FC 25 só põe troféus no estádio do UT).

**Direção F (protótipo no `?lab=sala`):** diorama 3D de noite: paredes azul-noite (como o resto do jogo), vitrines
com holofote, taças de metal que refletem, móveis KayKit, o seu Pokémon andando até o troféu tocado; tocar num troféu
aproxima a câmera, ele gira e o cartão aparece do lado (estilo Smash). three.js só nesse pedaço (~620 KB, ~160 KB
gzip), carregado só na sala.
