---
description: APIs e assets de Pokémon que existem e onde usar no jogo.
---

# APIs e assets de Pokémon: o que existe e onde usar (21/10/2026)

Pedido do Miguel: "pesquisar mais APIs e assets de Pokémon que existem [...] e ao mesmo tempo pensar em onde os
utilizar." Isto é só pesquisa: **nenhum código foi mexido**. Tudo que diz "testado" foi conferido hoje com `curl` nos
servidores e repositórios.

## 1. Resumo em 10 linhas

1. O jogo já usa o filé: PMD SpriteCollab, PokeAPI (sprites BW, gritos, itens, tipos), Showdown (treinadores, fx),
   `@pkmn/dex` e pokerogue-locales. Quase tudo que falta é **a outra metade desses mesmos repositórios**.
2. A maior descoberta: **texto oficial da Pokédex em PT-BR** para os 151 de Kanto, via cartas do TCG Pocket no TCGdex
   (testado: 151 de 151; Johto ainda 32 de 100). A PokeAPI não tem português.
3. **Gen 2 já está coberta** nas fontes que usamos: PMD (100 de 100 com sprite e retrato), BW animado, gritos,
   `@pkmn/dex` gen2 e líderes de Johto no Showdown. A Copa Johto é trabalho de jogo, não de caça de asset.
4. **Encontros por rota** (Red/Blue/Yellow) e **habitats** (FRLG) estão na PokeAPI: é a base de dados do Modo
   história e dos eventos "?" da Rota Índigo.
5. **Ícones de menu** (Showdown, 1 folha com todos, ou pokesprite) servem pra mapa, chave, rankings e Mercado.
6. PMD tem **35 animações e 18 emoções** por Pokémon; usamos 10 e 9. Sobram Sleep, Sit, Eat, Faint, Pain, Dizzy...
7. Música: nada dos jogos. Dá pra usar **trilhas originais de fãs** (PokéRogue, CC BY-NC-SA) ou CC0 (Ninja Adventure).
8. Cartas do TCG, arte oficial e modelos 3D: **só referência**. Tilesets de Kanto ripados: **fora do repo**.
9. Regra técnica: tudo baixado **no build** por script (como os `scripts/fetch-*.ts`), nunca chamada de API em tempo
   de jogo.
10. As 5 primeiras: texto da Pokédex, ícones de menu, encontros e habitats, Gen 2 por script, retratos e animações PMD.

---

## 2. Catálogo

Legenda de risco: **baixo** (licença aberta ou já usado), **médio** (sem licença formal, uso de fã tolerado),
**alto** (ripado ou arte oficial em destaque). "© TPC" = The Pokémon Company/Nintendo/Game Freak/Creatures: vale pra
toda imagem, som e texto de Pokémon, mesmo quando o repositório é CC0.

### 2.1 Dados

| Recurso | O que tem | Licença / termos | Cobertura | Como guardar | Risco | Esforço |
|---|---|---|---|---|---|---|
| [PokeAPI REST](https://pokeapi.co/docs/v2) | Tudo: espécies, flavor text, encontros, locais, cadeias de evolução, itens, MTs por versão, naturezas, cor, forma, habitat | Código BSD-3; dados © TPC; política de uso justo: **cache local obrigatório**, quem abusa leva ban de IP; sem limite de taxa | Gen 1 a 9; flavor text em en, es, es-419, fr, de, it, ja, ko, zh (**sem pt**) | Script de build grava JSON em `src/data/` | baixo | P |
| [PokeAPI GraphQL](https://pokeapi.co/docs/graphql) | Mesmos dados, uma consulta só | Beta em `graphql.pokeapi.co/v1beta2`, **100 chamadas/h por IP**, cai todo dia 1h UTC | Igual | Só em script, nunca no jogo | baixo | P |
| [PokeAPI/api-data](https://github.com/PokeAPI/api-data) | O JSON estático inteiro da API, com schema | BSD-3 | Igual | Clonar raso no `.cache/` do script | baixo | P |
| [@pkmn/dex e @pkmn/data](https://github.com/pkmn/ps) (já usamos) | Dados do Showdown por geração: espécies, golpes, learnsets, tipos | MIT | Gen 1 a 9; `Dex.forGen(2)` já responde Chikorita e Crunch (testado) | Já no `package.json` | baixo | 0 |
| [Showdown random battles](https://github.com/smogon/pokemon-showdown/tree/master/data/random-battles) | `gen1/data.json` e `gen2/`: 4 golpes "bons" e nível por Pokémon | MIT | Gen 1 a 9 | Script copia o JSON | baixo | P |
| [Smogon stats](https://www.smogon.com/stats/) | Uso mensal por formato; `chaos/gen1ou-0.json` tem **Teammates**, golpes, checks | Sem licença; números públicos | gen1ou/uu/nu, gen2ou... até 09/2026 | Script, uma vez | baixo | P |
| [veekun/pokedex](https://github.com/veekun/pokedex) | CSVs que deram origem à PokeAPI | MIT; projeto parado | Até Gen 7 | Não precisa (a PokeAPI cobre) | baixo | - |
| [pret/pokered](https://github.com/pret/pokered) e [pokecrystal](https://github.com/pret/pokecrystal) | Desmontagem dos jogos: tabelas de encontro, mapas, falas dos NPCs | **Sem licença** (código derivado da ROM) | RBY e Crystal | **Só referência** de fatos (quem aparece onde, % de encontro) | alto se copiar | - |
| [Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/BP:Copyrights) | Texto de tudo, mapas, listas | Texto CC BY-NC-SA 2.5 (compartilha igual); imagens do Archives são © TPC em "fair use" | Tudo | **Só referência** | médio | - |
| [Serebii](https://www.serebii.net) | Igual, com notícias | Todos os direitos reservados | Tudo | **Só referência** | - | - |
| [pokerogue-locales](https://github.com/pagefaultgames/pokerogue-locales) (já usamos) | Nomes e descrições de golpes, habilidades, itens em PT-BR | AGPL-3.0 | Gen 1 a 9 | Já no `build-data.ts` | baixo | 0 |

**Dados úteis que a PokeAPI tem e o jogo ainda não usa** (testado com o Pikachu):

- **Encontros por versão:** `pokemon/{id}/encounters` dá o lugar e a versão (`viridian-forest-area` em Red/Blue,
  `pallet-town-area` no Yellow, `kanto-route-2...` em Gold/Silver/Crystal). O inverso, `location-area/{nome}`, dá a
  lista de cada rota com método (grama, surf, vara) e chance.
- **Habitat** (Gen 3, FRLG): grassland, forest, waters-edge, sea, cave, mountain, rough-terrain, urban, rare. Só
  existe pra Gen 1 a 3, que é exatamente o que precisamos.
- **Cor** (red, blue, yellow, green, black, brown, purple, gray, white, pink) e **forma** (quadruped, wings,
  humanoid...).
- **Flavor text por versão** em inglês (Red, Blue, Yellow, Gold, Silver, Crystal...).
- **Máquinas** (número da MT em cada jogo), **naturezas** (25, com atributo que sobe e que desce), **características**
  ("Likes to thrash about") e **gênero** ("Mouse Pokémon").
- **Cadeias de evolução** com gatilho (nível, pedra, troca): o `@pkmn/dex` já dá o essencial.

### 2.2 Texto da Pokédex em português

| Fonte | O que tem | Licença | Cobertura PT-BR (testado hoje) |
|---|---|---|---|
| [TCGdex](https://tcgdex.dev) ([repo](https://github.com/tcgdex/cards-database)) | API grátis, sem chave, REST e GraphQL. Campo `description` = texto da Pokédex da carta | Banco MIT; texto e imagens © TPC | `pt-br` (TCG Pocket): **151 de 151** de Kanto e **32 de 100** de Johto com texto. `pt` (TCG físico): imagens sim, `description` vazio |
| PokeAPI | Flavor text dos jogos | idem | **Nenhum** em português |

Exemplo real (`/v2/pt-br/cards/A1-001`): Bulbasaur, "Este Pokémon já nasce com uma semente nas costas. Aos poucos,
a semente cresce." É tradução oficial (o Pocket sai em português no Brasil). Johto vai crescendo a cada coleção nova
do Pocket; o que faltar na Gen 2 a gente escreve ou mostra em inglês.

### 2.3 Sprites e arte

| Recurso | O que tem | Licença / termos | Cobertura | Risco | Esforço |
|---|---|---|---|---|---|
| [PokeAPI/sprites](https://github.com/PokeAPI/sprites) (já usamos BW animado, itens, tipos) | Por jogo: Red/Blue, Yellow (com fundo transparente), Gold, Silver, **Crystal animado**, FRLG, Emerald, HGSS...; `other/showdown` (gif 3D animado), `other/home`, `official-artwork`, `dream-world` (SVG); ícones Gen 7; **`badges/` (77 insígnias)**; itens; tipos Gen 3 a 9 | Repo **CC0**; imagens © TPC; IDs > 650 no estilo BW são do Smogon (não oficiais) | Tudo até Gen 9, shiny na maioria | baixo (pixel) / médio (arte oficial) | P |
| [Showdown sprites](https://play.pokemonshowdown.com/sprites/) ([repo smogon/sprites](https://github.com/smogon/sprites)) (já usamos treinadores e fx) | `gen1rb`, `gen1rg`, `gen2`, `gen2g`, `gen3frlg`, `gen5ani`, `ani` (3D), `dex`, `home`, `*-shiny`; **`pokemonicons-sheet.png`** (ícones de menu, 392 KB) e `itemicons-sheet.png`; `trainers/` com **versões `-gen1` e `-gen3`** e todos os líderes de Johto; `categories/` (Físico/Especial); `afd/` (sprites de piada do 1º de abril) | Sem licença formal. Smogon Sprite Project: livre pra uso **sem fins lucrativos com crédito**. Não fazer hotlink (o servidor deu 503 durante a pesquisa) | Gen 1 a 9 | médio | P |
| [@pkmn/img](https://github.com/pkmn/ps/tree/main/img) | Resolve URL, tamanho e **posição na folha de ícones** do Showdown | MIT | Igual ao Showdown | baixo | P |
| [pokesprite](https://github.com/msikma/pokesprite) ([npm `pokesprite-images`](https://www.npmjs.com/package/pokesprite-images)) | Ícones de caixa estilo Gen 8 (68×56, **com shiny**), itens Gen 3 a 8 (32×32, com e sem contorno), bolas, **fitas** (`misc/ribbon`) | Código MIT; imagens © TPC | Até Sword/Shield | médio | P |
| [PMD SpriteCollab](https://github.com/PMDCollab/SpriteCollab) (já usamos) | Por Pokémon: **35 animações** (usamos Idle, Walk, Attack, Shoot, Hop, Hurt, Charge, Swing, Pose, Trip) e **18 emoções** de retrato (usamos 9). Sobram: Sleep, EventSleep, Wake, Eat, Sit, Laying, Nod, LookUp, DeepBreath, Float, Rotate, Double, QuickStrike, Shock, Pull, Pain, Faint, Tumble, TumbleBack, LostBalance, Cringe, HitGround, LeapForth, Head, Sink, Strike. Retratos: Normal, Happy, Joyous, Inspired, Determined, Shouting, Angry, Surprised, Sigh, Crying, **Sad, Teary-Eyed, Worried, Pain, Dizzy, Stunned, Special1/2** | **CC BY-NC 4.0**, crédito por autor (`credits.txt`, `tracker.json`) | Pelo `tracker.json`, **todos** os 251 de Gen 1 e 2 têm sprite e retrato; Gen 3 também | baixo | P a M |
| [Pokémon TCG API](https://pokemontcg.io) | Imagens e dados das cartas físicas | Grátis com chave (20 mil/dia); migrando pra [Scrydex](https://scrydex.com/faq) (pago?) | Inglês | alto (arte oficial) | - |
| [TCGdex](https://tcgdex.dev) | Imagens das cartas em PT-BR (Pocket) e PT (físico), ilustrador | Banco MIT; imagens © TPC | 9 idiomas | alto (arte oficial) | - |
| [PokéRogue assets](https://github.com/pagefaultgames/pokerogue-assets) | Fundos de bioma (`images/arenas`), fitas por tipo, itens, treinadores de fãs | Arquivo a arquivo pelo `REUSE.toml`: obras de fãs em **CC BY-NC-SA 4.0**; o que vem dos jogos é "fair use"; **sem entrada = sem licença**; logo proibido. Só 2 biomas (Rocky Coast e Well, de Vari) têm licença | Pouco aproveitável | médio | M |
| Tilesets de Kanto (FRLG, HGSS) | [The Spriters Resource](https://www.spriters-resource.com) e kits do Pokémon Essentials | Ripados, **sem licença** | Kanto inteiro | **alto** | - |
| Tilesets abertos estilo Pokémon | [Tuxemon](https://github.com/Tuxemon/Tuxemon/blob/development/ATTRIBUTIONS.md) (16×16, mistura de CC0, CC BY e CC BY-SA), [Ninja Adventure](https://pixel-boy.itch.io/ninja-adventure-asset-pack) (**CC0**, 16×16, com música e efeitos), ArMM1998 no OpenGameArt (CC0), LimeZu Serene Village / Modern Exteriors (mesmo autor da Sala; versão grátis não comercial) | Abertas | Cidades, rotas, cavernas genéricas | baixo | M |
| Ícones de tipo em SVG | [partywhale/pokemon-type-icons](https://github.com/partywhale/pokemon-type-icons) (MIT); duiker101 (sem licença) | MIT | 18 tipos | baixo | P |
| Modelos 3D | The Models Resource (ripados), renders HOME (`other/home`), Sketchfab (licença por modelo) | Ripados ou variados | Tudo | alto | G |

### 2.4 Som

| Recurso | O que tem | Licença / termos | Risco | Uso |
|---|---|---|---|---|
| [PokeAPI/cries](https://github.com/PokeAPI/cries) (já usamos) | Gritos `legacy` (8 bits) e `latest`, `.ogg` | Repo CC0; áudio © TPC | baixo | **Gen 2 já existe** (testado 152 e 251) |
| Showdown `audio/cries` | Os mesmos gritos em mp3 | Igual | baixo | Não precisa |
| Músicas dos jogos (rips, remixes, OC ReMix, YouTube) | Tudo | A composição é © Nintendo, mesmo remixada | **alto** | **Nunca** |
| [PokéRogue, trilhas de bioma](https://github.com/pagefaultgames/pokerogue-assets/blob/main/audio/REUSE.toml) | ~35 faixas de fãs (Firel, Lmz, Andr06, Bird_Obsession, MattCello...): plains, forest, cave, sea, power_plant, title... | **CC BY-NC-SA 4.0** com crédito; cortar o loop = obra derivada no mesmo license. As do `bgm/bw/` e `battle_*` são dos jogos: fora | médio (conferir faixa a faixa que é composição original) | Menu, Rota Índigo, Sala |
| [Ninja Adventure](https://pixel-boy.itch.io/ninja-adventure-asset-pack) | 37 músicas, 100+ efeitos | CC0 | baixo | Trilha de fundo, efeitos de UI |
| [ZzFXM](https://github.com/keithclark/ZzFXM) | Música procedural minúscula, irmão do ZzFX que já usamos | MIT | baixo | Tema próprio em poucos KB |
| Kenney audio, freesound CC0 | Cliques, impactos | CC0 | baixo | Já é o que fazemos |

### 2.5 Fontes e UI

| Recurso | Situação |
|---|---|
| Galmuri (já usamos) | OFL, em subset. Continua sendo a certa |
| Clones da fonte do Game Boy (npm `pokemon-font`, "Pokemon pixels", Axolotl) | Licença incerta ou "não comercial"; ganho pequeno sobre a Galmuri. **Não usar** |
| UI kits "estilo Pokémon" no itch.io | Licenças variadas; temos brand guide próprio (`docs/marca/`). **Não precisa** |
| Kenney UI Pack | CC0, mas não combina com o kit da Transmissão. Só referência |

### 2.6 Datasets curiosos

| Dataset | Fonte | Serve pra |
|---|---|---|
| "Quem joga junto" | Smogon `Teammates` (no gen1ou: Tauros anda com Snorlax, Chansey, Exeggutor, Starmie, Alakazam) | IA rival montando time, curiosidade na ficha. Meta competitivo ≠ futsal: valor baixo |
| Movesets curados | Showdown random battles gen1/gen2 | Padrão do futuro "escolher os golpes" |
| Naturezas e características | PokeAPI | Personalidade cosmética no Modo história (sem mexer em atributo) |
| IVs e EVs | PokeAPI | **Não**: número escondido, contra "atributos visíveis em campo" |
| Nomes em 11 idiomas | PokeAPI `names` | Já temos PT e EN (o nome oficial no Brasil é o inglês) |
| Cor, forma, habitat | PokeAPI | Coleções do Álbum, pacote de habitat, quadra temática |
| Apelidos | Não achei dataset com licença | Escrever à mão se a personalização pedir |

---

## 3. Onde usar no Soccermon

Ordenado por valor sobre esforço. Esforço: P (horas), M (1 a 3 dias), G (semana+). **Miguel** = precisa da decisão dele
(regra de jogo, carta, visual ou equilíbrio, conforme o `CLAUDE.md`).

| # | Ideia | Recurso | Tela / plano | Esforço | Valor | Decisão |
|---|---|---|---|---|---|---|
| 1 | **Texto da Pokédex** na ficha da espécie e no verso da figurinha do Álbum (PT-BR oficial, EN do Red/Blue ou do Pocket) | TCGdex `pt-br` + PokeAPI | `SpeciesSheet.tsx`, `Album.tsx` | P | alto | Miguel: texto moderno (Pocket) ou Gen 1 em inglês? |
| 2 | **Gritos onde ainda não tocam**: carta revelada no pacote, escolha no draft, titulares no VERSUS | Arquivos que já temos | `CardPack.tsx`, `Draft.tsx`, VERSUS | P | médio | Não (respeita o volume de gritos) |
| 3 | **Ícones de menu** no mapa da Rota Índigo (time do rival na casa), na chave, nos rankings (Copa do Dia, Amigos), no Mercado e no lobby do Duelo | Showdown `pokemonicons-sheet` + `@pkmn/img`, ou pokesprite (tem shiny) | `CupMap.tsx`, `bracket.css`, `Daily.tsx`, `Shop.tsx` | P a M | alto | Miguel (visual, checklist da `soccermon-marca`) |
| 4 | **Encontros por rota** viram dados do Modo história: cada capítulo tem o "time selvagem" da rota e um draft do lugar (Floresta de Viridian = Insetos, Rota 1 = Pidgey e Rattata, Usina = Elétricos) | PokeAPI `location-area` (Red/Blue/Yellow) | Plano do Modo história (1.0, Jornada) | M | alto | Miguel (regra nova) |
| 5 | **Evento "?" Mato alto** na Rota Índigo: aparece um Pokémon da rota daquela altura do mapa e você decide se ele entra | Encontros + habitats | `cup-map.ts`, eventos da Copa longa | M | alto | Miguel (regra nova) |
| 6 | **Gen 2 por script**: trocar `ids151` por uma lista por geração nos `scripts/fetch-*.ts` e no `build-pmd-atlas.ts`; teste de cobertura (todo id tem sprite, retrato, grito, carta) | PMD, PokeAPI sprites e cries, `@pkmn/dex` gen2 | `scripts/lib/download.ts`, `engine.test.ts` | M | alto (pra 0.12) | Não (o equilíbrio da Gen 2 é outra conversa) |
| 7 | **Líderes de Johto e versões retrô**: Falkner a Clair, Will, Karen, Silver, Kris, Ethan; `brock-gen1`, `blue-gen3`... | Showdown `trainers/` (testado) | Copa Johto, VERSUS, Modo história | P | alto (pra 0.12) | Não |
| 8 | **Retratos que faltam**: Pain ou Dizzy na lesão da Rota, Sad ou Teary-Eyed na derrota, Worried no Mercado sem dinheiro, Stunned no gol sofrido | PMD (já baixamos 9 emoções) | `MatchHighlight.tsx`, `CupMap.tsx`, `Result.tsx`, Emotes do Duelo | P | médio | Não |
| 9 | **Animações extras na Sala de troféus e na Home**: o time passeia, senta (Sit), dorme (Sleep), come (Eat), acena (Nod) | PMD | `TrophyRoomScene.ts`, `HomeCourt.tsx` | M | médio | Miguel (visual) |
| 10 | **Comemoração por Pokémon**: Rotate, LeapForth, Float, DeepBreath no gol (hoje é Pose e Hop) | PMD | `MatchScene.ts` | M | médio | Miguel (visual) |
| 11 | **Habitat** vira pacote de tipo no Mercado ("Pacote Caverna"), quadra temática extra e coleção do Álbum | PokeAPI `pokemon-habitat` | `shop.ts`, `court-themes.ts`, coleções | P | médio | Miguel (pacote mexe no draft) |
| 12 | **Trilha original** no menu, na Rota Índigo e na Sala (hoje não tem música) | PokéRogue (CC BY-NC-SA), Ninja Adventure (CC0) ou ZzFXM | `audio.ts`, Configurações (volume de música) | M | médio | Miguel (gosto e licença compartilha-igual) |
| 13 | **Edição Retrô** de carta: sprite do Red/Blue (ou Crystal animado na Gen 2) com paleta do Game Boy | PokeAPI sprites `generation-i/yellow/transparent`, `generation-ii/crystal/animated` | Galeria `?cards=1`, Álbum, evento | M | médio | Miguel (carta nova) |
| 14 | **Movesets curados** como padrão do "escolher os golpes" e pra MT que o rival leva | Showdown random battles gen1/gen2 | `tm.ts`, futura tela de golpes | P | médio | Miguel (equilíbrio) |
| 15 | **Mapa de Kanto** desenhado por nós (SVG, como as insígnias) pro Modo história e pra Rota Índigo, com a geografia do pret/Bulbapedia | Referência só | Modo história | G | médio | Miguel |
| 16 | **Cor e forma** viram coleções do Álbum ("Todos os vermelhos") e sugestão de cor do clube pelo capitão | PokeAPI | `Album.tsx`, `ClubTab.tsx` | P | baixo | Miguel (coleção nova) |
| 17 | **Fitas** de verdade pras medalhas e pra fita de campeão | pokesprite `misc/ribbon` | `Medals.tsx` | P | baixo | Miguel (marca: hoje é tudo desenhado) |
| 18 | **Insígnias** dos jogos no `BadgeCase` | PokeAPI `badges/1..8` | `BadgeCase.tsx` | P | baixo | Miguel. Recomendo manter as desenhadas (marca própria) |
| 19 | **Sprites de 1º de abril** como evento de um dia | Showdown `afd/` | Evento semanal | P | baixo | Miguel (crédito incerto) |
| 20 | **Natureza** como etiqueta cosmética ("Brincalhão") na carta do Modo história | PokeAPI `nature` | Modo história | P | baixo | Miguel (atributo nunca) |
| - | **Cartas do TCG** como inspiração da galeria: raridade em losangos e estrelas do Pocket, crédito de ilustrador | TCGdex (só olhar) | `?cards=1` | - | referência | - |

---

## 4. Riscos e regras

**Regras de sempre (valem pra tudo acima):**

1. **O jogo nunca cobra.** Nada de doação, anúncio ou loja. É o que segura a licença NC (PMD, PokéRogue, Smogon) e o
   pedido de retirada.
2. **Mídia de terceiros sem licença clara fica fora do repo.** Igual à mídia do trailer: script baixa pra `.cache/`
   ou pasta ignorada pelo git. Isso vale pra tileset ripado, música dos jogos, arte do TCG e modelo 3D. Pra estes, a
   regra é ainda mais simples: **não usar no jogo**.
3. **Baixar no build, servir do nosso domínio.** Um `scripts/fetch-*.ts` por fonte, como hoje. Nada de chamar
   PokeAPI, TCGdex ou Showdown com o jogo rodando: a PokeAPI exige cache, o GraphQL tem 100 chamadas/h, o Showdown
   caiu durante a pesquisa e o jogo precisa rodar sem rede.
4. **Crédito sempre:** linha nova no `CREDITS.md` e na tela de Créditos a cada fonte. PMD já tem o crédito por autor
   (`CREDITS-PMD.md`, `CREDITS-PORTRAITS.md`): animação ou retrato novo entra no mesmo script.
5. **Compartilha-igual (CC BY-NC-SA)** é ok pra asset: o arquivo fica com a licença dele, em pasta própria com o
   `LICENSE` junto (como o Modern Interiors em `public/assets/room/mi`). Não contamina o código AGPL.
6. **Pixel em vez de arte oficial.** Sugimori, renders do HOME e cartas do TCG são o que a Nintendo mais protege e
   o que mais aparece num print. Sprite de jogo e PMD já são o estilo do Soccermon.
7. **Tamanho:** `public/assets/field` já tem 31 MB. Animação extra só onde aparece (Sala, Home) e carregada sob
   demanda; nada disso no primeiro carregamento (regra do "Primeiro carregamento leve").
8. **Texto oficial é © TPC** mesmo vindo de banco MIT. Usar o texto da Pokédex como usamos os nomes: com crédito e
   sem vender nada.

**Riscos específicos:**

| Risco | Onde | O que fazer |
|---|---|---|
| Showdown sem licença formal | Treinadores, ícones, fx | Já usamos com crédito. Copiar local, nunca hotlink |
| Smogon Sprite Project "só sem fins lucrativos" | Sprites estilo BW de IDs > 650 | Só importa nas Gens 6+, depois da 1.0 |
| PokéRogue: arquivo sem entrada no `REUSE.toml` = sem licença | Fundos de bioma | Só usar o que tem autor e licença listados |
| TCGdex com Johto incompleto | Texto da Pokédex Gen 2 | Fallback: inglês ou texto nosso |
| Pokémon TCG API indo pro Scrydex pago | Dados de cartas | Não depender. TCGdex é aberto e se hospeda sozinho (Docker) |
| Música remixada parece "livre" | YouTube, OC ReMix | Composição é da Nintendo: fora sempre |

---

## 5. As 5 primeiras recomendações

1. **Texto da Pokédex PT-BR + EN** (ideia 1). Script `scripts/fetch-dex-text.ts` lê o TCGdex (`pt-br`, depois `en`)
   e a PokeAPI (Red/Blue em inglês), grava `src/data/dex-text.json`; a ficha e o Álbum mostram. Algumas horas, zero
   asset novo, cara de Pokédex de verdade. Decisão: qual texto em inglês.
2. **Ícones de menu** (ideia 3). Uma folha só (392 KB, 1 pedido), posição pelo `@pkmn/img`. Deixa a Rota Índigo e os
   rankings legíveis no celular sem carregar 5 gifs por linha. Decisão: Showdown (traço Gen 8) ou pokesprite (com
   shiny), conferida com a `soccermon-marca`.
3. **Encontros e habitats num JSON de build** (ideias 4, 5 e 11). Um script, um arquivo `src/data/kanto-encounters.json`
   com rota → Pokémon → método → chance (Red/Blue/Yellow) e espécie → habitat. É o alicerce do Modo história e dá
   eventos novos pra Rota Índigo. Decisão: as regras que usam isso.
4. **Gen 2 pronta por script** (ideias 6 e 7). Trocar `ids151` por lista por geração em todos os `fetch-*`, baixar os
   líderes de Johto e um teste que falha se algum id ficar sem sprite, retrato, grito ou carta. Tira o risco de asset
   da 0.12 hoje; o equilíbrio fica pra quando for a hora.
5. **Retratos e animações PMD que faltam** (ideias 8 e 9). Primeiro os retratos (P, já é o mesmo script): Pain e
   Dizzy na lesão da Rota, Sad na derrota. Depois Sleep, Sit e Eat na Sala, sob demanda.

Bônus de graça: **gritos no pacote, no draft e no VERSUS** (ideia 2), com os arquivos que já temos.

## 6. Decisões pro Miguel

1. Texto da Pokédex: PT-BR do Pocket em português; em inglês, o do Pocket (moderno) ou o do Red/Blue (retrô)?
   Recomendo o do Red/Blue (combina com Kanto e com os gritos legacy).
2. Ícones de menu: Showdown (todos numa folha) ou pokesprite (tem shiny, um arquivo por Pokémon)? Recomendo Showdown
   pra lista e chave; shiny continua no avatar.
3. Encontros por rota entram no Modo história como "draft do lugar"? E o evento "Mato alto" na Rota Índigo?
4. Música de fundo: quer? Se sim, PokéRogue (cara de Pokémon, CC BY-NC-SA), Ninja Adventure (CC0, mais genérica) ou
   tema próprio com ZzFXM?
5. Edição Retrô (sprite Game Boy) vale como edição especial? Se sim, primeiro na galeria `?cards=1`.
6. Insígnias e fitas: manter as desenhadas por nós (recomendo) ou usar as dos jogos?

---

## Fontes

- PokeAPI: [docs v2](https://pokeapi.co/docs/v2), [GraphQL](https://pokeapi.co/docs/graphql),
  [api-data](https://github.com/PokeAPI/api-data), [sprites](https://github.com/PokeAPI/sprites)
  ([LICENCE](https://github.com/PokeAPI/sprites/blob/master/LICENCE.txt)), [cries](https://github.com/PokeAPI/cries)
- Showdown: [pokemon-showdown](https://github.com/smogon/pokemon-showdown), [sprites](https://github.com/smogon/sprites),
  [stats](https://www.smogon.com/stats/), [Smogon Sprite Project](https://www.smogon.com/forums/threads/smogon-sprite-project.3647722/),
  [pkmn/ps (dex, data, img)](https://github.com/pkmn/ps)
- [PMDCollab/SpriteCollab](https://github.com/PMDCollab/SpriteCollab) e [tracker](http://sprites.pmdcollab.org/)
- [msikma/pokesprite](https://github.com/msikma/pokesprite)
- [TCGdex](https://tcgdex.dev), [cards-database](https://github.com/tcgdex/cards-database),
  [Pokémon TCG API](https://pokemontcg.io), [Scrydex FAQ](https://scrydex.com/faq)
- [veekun/pokedex](https://github.com/veekun/pokedex), [pret](https://github.com/pret)
- [Bulbapedia: Copyrights](https://bulbapedia.bulbagarden.net/wiki/BP:Copyrights), [Serebii](https://www.serebii.net)
- PokéRogue: [jogo](https://github.com/pagefaultgames/pokerogue), [assets](https://github.com/pagefaultgames/pokerogue-assets),
  [locales](https://github.com/pagefaultgames/pokerogue-locales)
- [Tuxemon ATTRIBUTIONS](https://github.com/Tuxemon/Tuxemon/blob/development/ATTRIBUTIONS.md),
  [Ninja Adventure](https://pixel-boy.itch.io/ninja-adventure-asset-pack), [ZzFXM](https://github.com/keithclark/ZzFXM),
  [partywhale/pokemon-type-icons](https://github.com/partywhale/pokemon-type-icons)
- [Pokémon Auto Chess](https://github.com/keldaanCommunity/pokemonAutoChess) (referência de pipeline PMD)
