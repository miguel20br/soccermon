# Personalização e coleção: pesquisa e proposta (18/10/2026)

Pedido do Miguel: "MUITA personalização, coletáveis, colecionáveis, etc. Todas essas coisas prendem os players e
fazem com que eles fiquem." Isto é pesquisa e proposta, **nenhum código foi mexido**. Continua o brainstorm de
`docs/planos/personalizacao-e-pokedex.md`
(15/10), que já virou Perfil, Pokédex, Movedex, treinadores e títulos na 0.8.0–0.8.6.

Regras que valem pra tudo aqui: **só cosmético** (nada mexe em atributo, motor ou `ENGINE_VERSION`), **tudo se
ganha jogando** (sem moeda, loja, doação, anúncio ou pacote pago), **sem emoji na interface**, carta muda primeiro
na galeria `?cards=1`, nada automático no time do jogador, PT e EN (`src/i18n/`), celular primeiro.

---

## 1. Em uma frase

Montar um laço só, **Jogar → Álbum → Meu Clube → Vitrine**: cada copa preenche um álbum visível (figurinhas por
espécie e edição, insígnias, medalhas com degraus); o álbum libera peças do clube (escudo, uniforme, quadra,
grito); e o clube aparece **onde os outros veem** (VERSUS do Duelo, card de compartilhar, Hall da Fama, cartão de
treinador). Metade disso já tem os dados guardados no save: falta mostrar.

---

## 2. O que o placar diz (`npm run stats`, 11 a 18/10)

| Número | Leitura pra coleção |
|---|---|
| 82 sessões, **59% voltando**; no dia 18/10, 94% das sessões eram de quem já tinha save | A base é pequena, mas fiel. Coleção e metas longas são exatamente pra esse público |
| Perfil aberto em 19 das 82 sessões (23%), 33 visitas | Já existe curiosidade pelo perfil; ele merece mais coisa pra ver |
| Cor do clube trocada só **5 vezes** | A personalização de hoje é rasa (10 cores e só) ou pouco achada |
| **79% jogam em 8x** (+16% em "highlights") | A recompensa tem que vir do resultado e da escolha, não de assistir partida. Nada de "veja X minutos" |
| 134 copas iniciadas, 115 terminadas, 28 títulos, 0 copas perfeitas | Metas difíceis (perfeita, douradas) ainda estão intocadas: bom sinal pra degraus de platina |
| Dragonite 14% dos capitães; top 10 de escolhas são quase todos finais de evolução e lendários | Coleção que premia **variedade** (jogou X espécies, coleções temáticas) também empurra o draft pra fora do óbvio |
| Edições escolhidas: Evento 86%, Ícone 14% | O Ícone (1 em 80) é raro de verdade; ótimo como peça "rara" do álbum |
| Duelo: 14 visitas, 8 sessões | Ainda pequeno; exibir coisa no Duelo vale mais quando ele crescer |
| `share` existe no `track`, mas não aparece no placar | Vale pôr "compartilhou" no placar antes de medir o efeito da vitrine |

Sem id de pessoa, não dá D1/D7 por jogador. Para medir se a coleção prende, o mínimo é um evento novo
`collect` (ou reaproveitar `setting`) e olhar "% voltando" antes e depois.

---

## 3. Como os jogos de referência fazem

| Jogo | O que eles fazem | O que serve pro Soccermon | O que evitar |
|---|---|---|---|
| **Pokémon TCG Pocket** | 2 pacotes grátis por dia; Wonder Pick (pegar 1 carta do pacote de outro jogador, sorteada); **3 emblemas no perfil**, que aparecem ao lado do nome nas batalhas; emblemas de evento em 4 degraus (participação, bronze, prata, ouro); missões de Dex e **coleções temáticas**; **display board** pra exibir cartas num fundo | Vitrine de 3 emblemas no perfil e no VERSUS; coleções temáticas com barra; "quadro de exibição" = cartão de treinador | Ampulhetas e passe pago; pacote diário que acumula só até 2 (pressão de abrir todo dia) |
| **Pokémon GO** | Medalhas em 4 degraus (bronze/prata/ouro/platina; ex.: 10/50/200/2500 capturas por tipo); Collection Challenges; fundos especiais (Lucky dourado, fundo de local/evento como "cartão-postal") | Degraus de medalha sobre contadores que já existem; "fundo de campeão" na carta que ganhou um título | Itens de estilo vendidos por moeda |
| **EA FC Ultimate Team** | Estádio com escudo, bola, uniformes, comemoração, tifo, tema e cantos da torcida; tudo liberado por **objetivos** e nível de temporada | Escudo, uniforme, faixa de torcida e quadra como peças do "Meu Clube", liberadas por objetivo | Pacotes pagos e mercado |
| **Marvel Snap** | Variantes de arte e **"split"**: acabamentos (foil, ink, prisma) e flares só visuais; o nível de coleção sobe junto; borda personalizada depois de 3 splits Infinity | "Acabamento" por espécie liberado pela carreira daquela espécie (gols, títulos com ela) | Créditos/boosters comprados; confundir visual com poder |
| **Hearthstone** | Versos de carta por conquista e ranqueada; cartas **Diamond** dadas por completar todos os lendários de uma expansão | Recompensa grande por completar um conjunto ("todos os Ícones jogados") | Loja de versos |
| **Clash Royale** | Emotes, molduras e decorações de banner | Mais emotes no Duelo, liberados por missão | Banner Boxes (sorteio) e gemas |
| **Rocket League** | **Títulos** embaixo do nome no placar e no replay de gol; borda de avatar e banner por divisão da temporada; explosão de gol | Título já existe; falta **borda do avatar** e **"explosão" de gol** (efeito/grito no seu gol) | Rocket Pass pago |
| **Duolingo / Wordle** | Sequência diária com "congelamento" (Duolingo diz que um pouco de folga motiva mais que regra rígida); Wordle cresceu pela **grade de compartilhar sem spoiler** | Sequência gentil (dias na semana, não "perdeu tudo"); a Copa do Dia da 0.8.7 com resultado compartilhável | Culpa e notificação insistente |
| **Balatro / Slay the Spire / PokéRogue** | Baralhos e níveis de dificuldade liberados por vitória; StS libera cartas/relíquias pela **pontuação acumulada**; PokéRogue põe uma **fita** no Pokémon que já ganhou o modo clássico | "Fita de campeão" na espécie que já foi campeã com você; desbloqueio de variedade (não de poder) | Desbloquear poder: no Soccermon o desbloqueio é só visual |
| **Álbum da Copa (Panini digital)** | Álbum com % de conclusão, abas "Falta" e "Repetidas" | Pokédex com filtro "falta" e o número grande (87/151) | Pacote patrocinado |

### A psicologia que dá pra usar sem culpa

- **Autonomia, competência e vínculo** (Ryan, Rigby e Przybylski, 2006): as três necessidades preveem diversão e
  vontade de voltar. Coleção que vem de **escolha** (montar o time de um jeito) e de **habilidade** (vencer o
  ginásio) é a boa; coleção que vem de sorte pura ou de tempo logado é a fraca.
- **Gradiente de meta** (Kivetz et al., 2006) e **progresso dado** (Nunes e Drèze, 2006: cartão de lava-rápido
  com 2 carimbos de 10 teve 34% de conclusão contra 19% do de 8 vazio): mostrar a barra e começar com algo já
  preenchido. Aqui isso é **retroativo**: quem abrir a versão nova já entra com insígnias, fitas e medalhas do
  que jogou.
- **Dark patterns funcionam no curto prazo e queimam confiança** (estudos sobre padrões obscuros em jogos): FOMO
  vem quase sempre junto de cobrança. Sem cobrança, o risco que sobra é o "jogar por obrigação".

**Regras éticas propostas (pra pôr na Ajuda):** nada some pra sempre (Evento gira e volta; Copa do Dia perdida
não tira nada), sequência não zera por um dia perdido, nenhum sorteio de cosmético, toda meta mostra o caminho
("vença Cerulean numa copa"), nada de notificação, e tudo o que dá pra ganhar está listado (com "???" só nas
lendárias, que já é o charme dos dourados).

---

## 4. O sistema proposto

```
             JOGAR (Copa, Duelo, Copa do Dia)
                        |
          +-------------+--------------+
          v                            v
      ÁLBUM (o que coleciona)     FEITOS (o que conquista)
      - figurinha por espécie     - insígnias de Kanto
        e por edição              - medalhas com degraus
      - fitas de campeão          - coleções temáticas
      - acabamentos por espécie   - troféus (sala)
          |                            |
          +-------------+--------------+
                        v
           MEU CLUBE (o que personaliza)
           escudo, uniforme, quadra, grito, faixa,
           borda do avatar, emotes, mascote
                        |
                        v
           VITRINE (onde os outros veem)
           VERSUS e Duelo, card de compartilhar,
           cartão de treinador, Hall da Fama
```

Como liga com o que já existe:

| Já existe | Vira |
|---|---|
| `Dex` (`src/store/profile.ts`: visto, partidas, gols, títulos, `bestOvr`) | Álbum: página por espécie com figurinhas por edição, fita de campeão, acabamento |
| `MISSIONS` (`src/store/missions.ts`: 44 missões em 6 grupos, treinadores e títulos) | Continuam iguais; ganham **degraus** (medalhas) e o **estojo de insígnias** (as 8 missões de ginásio já guardam quem venceu cada líder) |
| Treinadores dourados (`scripts/build-gold-trainers.ts`, recolorido por código) | Mesmo truque pra borda do avatar, medalhas e insígnias douradas |
| `CLUB_COLORS` (10 cores), `rivalColor` (uniforme reserva) | Cor secundária + padrão de uniforme; o `rivalColor` já resolve o choque |
| `Trophy.tsx` (taça em SVG), `HallEntry` (50 títulos) | Sala de troféus: uma taça por tipo de feito, com o número |
| `share-card.ts` (card 9:16/1:1 do título) | Cartão de treinador compartilhável (mesmo pipeline) |
| Emotes do Duelo (`EmoteKind`, 6 SVGs em `src/ui/duel/Emotes.tsx`) | Pacotes de emote liberados por missão |
| `src/game/court.ts` (quadra desenhada por código, 4 cores) | Quadras temáticas por troca de paleta |
| `public/assets/cries` (CC0 do PokeAPI) | Grito de gol do capitão ou do mascote |

---

## 5. Os 15 itens

Custo em tempo de um agente com o Miguel revisando; "arte" diz se dá pra gerar por código.

### 1. Álbum de edições (figurinhas na Pokédex)
- **O que é:** cada página da Pokédex ganha 5 espaços: Normal, Shiny, Evento, Ícone, Destaque. Escalou uma carta
  daquela edição, a figurinha cola. Número grande no topo: "Figurinhas 212/755". Filtro "falta" como o álbum da
  Copa.
- **Como ganha:** escalar a carta numa partida (mesmo critério do "jogou").
- **Onde aparece:** aba Pokédex do Perfil, `SpeciesSheet`, cartão de treinador (contagem).
- **Por que prende:** 755 espaços com barra, sorte (Ícone 1/80, Shiny) e escolha (Destaque se conquista). É o
  "pegar todos" com cara de futebol.
- **Custo:** 1 a 1,5 dia. Campo novo `editions` (bitmask) no `DexEntry`; o `mergeDex` precisa juntar com OU, não
  com máximo. Retroativo parcial pelo Hall (`squad[].shiny`) e pelas copas guardadas (`special`).
- **Arte:** nenhuma nova (miniatura da carta que já existe).
- **Risco:** baixo. Save muda de forma (campo opcional; testar com `scripts/fixtures/backup-v6-*.json`).

### 2. Estojo de insígnias de Kanto
- **O que é:** as 8 insígnias (Rocha, Cascata, Trovão, Arco-Íris, Alma, Pântano, Vulcão, Terra) num estojo no
  Perfil. Apagada = ainda não venceu aquele ginásio. Vencer o mesmo ginásio 5/25 vezes deixa a insígnia prata/ouro
  (como o "polir" do HeartGold).
- **Como ganha:** vencer o clube do líder numa copa (a missão de cada líder já guarda isso, então é retroativo).
- **Onde aparece:** Perfil, cartão de treinador, card do título (fileira de insígnias), Duelo (mini fileira).
- **Por que prende:** cada copa sorteia 3 dos 9 clubes, então completar as 8 leva várias copas, e a última
  insígnia que falta vira objetivo explícito.
- **Custo:** 1 dia (estojo + polimento; contagem por clube a partir de `results`).
- **Arte:** 8 SVGs simples desenhados à mão (formas geométricas); polimento por gradiente igual aos dourados.
- **Risco:** baixo. O roadmap guardava insígnias pra 0.8.9/Modo história: o estojo pode nascer agora e o Modo
  história usar o mesmo componente.

### 3. Fita de campeão por espécie
- **O que é:** a fita (ribbon, como no PokéRogue e nos jogos principais) na espécie que já foi campeã com você,
  com o número de títulos (fita prata com 5, dourada com 10).
- **Como ganha:** `DexEntry.titles` já conta. Retroativo total.
- **Onde aparece:** Pokédex, `SpeciesSheet`, e um selinho discreto na carta **do draft** ("já foi campeão com
  você").
- **Por que prende:** vínculo com a espécie ("meu Gengar"), e puxa variedade ("ainda não fui campeão com
  Pidgeot").
- **Custo:** meio dia.
- **Arte:** SVG de fita, por código.
- **Risco:** o selinho na carta do draft mexe no visual da carta: esse pedaço passa pela galeria `?cards=1`.

### 4. Medalhas com degraus (bronze, prata, ouro, platina)
- **O que é:** as metas contáveis viram medalha de 4 degraus, padrão GO. Exemplos com números que o save já tem:
  "Pokédex" (vistos 40/80/120/151), "Elenco" (jogou 25/60/100/151), "Artilheiro" (gols 100/500/2000/5000),
  "Campeão" (títulos 1/5/25/100), "Movedex" (golpes 25/50/100/todos), "Evoluções" (5/25/100/300), uma por
  tipo ("Fogo": jogou 3/6/9/todos os de Fogo), "Duelista" (vitórias no Duelo).
- **Como ganha:** jogando; degraus cores bronze/prata/ouro iguais às cartas (consistência visual), platina com
  brilho holográfico.
- **Onde aparece:** aba nova "Medalhas" no Perfil; 3 escolhidas na vitrine (item 12).
- **Por que prende:** sempre há um próximo degrau perto (gradiente de meta), e o retroativo entrega bronze de cara.
- **Custo:** 1,5 a 2 dias (reaproveita `count`/`goal` das missões; as missões binárias ficam como estão).
- **Arte:** SVG por código (moldura de medalha + ícone de tipo que já existe em `public/assets/types`).
- **Risco:** inflar demais. Proposta: ~20 medalhas, não 80.

### 5. Coleções temáticas
- **O que é:** listas curtas com barra, como no TCG Pocket e no GO: "Iniciais de Kanto" (9), "Pássaros lendários"
  (3), "Fósseis" (Omanyte, Kabuto, Aerodactyl e evoluções), "Eeveelutions" (4), "Time do Brock", "Time da Misty"
  (os times dos líderes que já estão no `cup.ts`), "Os 5 lendários", "Hitmons", "Nidos".
- **Como ganha:** ter jogado todos da lista (Dex "jogou").
- **Onde aparece:** Perfil (aba Coleções ou dentro de Medalhas); cada uma libera uma peça do clube (símbolo do
  escudo, emote, quadra).
- **Por que prende:** meta pequena e nomeada é mais forte que "complete 151". E empurra o draft pra fora do
  Dragonite.
- **Custo:** 1 dia. Cabe no formato de `MISSIONS` (`goal` + `count`).
- **Arte:** nenhuma (sprites da Dex).
- **Risco:** baixo. Escolher quais coleções é gosto do Miguel.

### 6. Borda do avatar
- **O que é:** moldura do avatar (bronze, prata, ouro, holo, e as de insígnia, tipo, Duelo). Rocket League faz por
  divisão; aqui seria por feito.
- **Como ganha:** títulos, medalhas de platina, Kanto completo, Copa perfeita (holo).
- **Onde aparece:** Perfil, barra da conta, VERSUS, sala do Duelo (o rival vê), card do título.
- **Por que prende:** é a coisa que o outro vê primeiro no Duelo.
- **Custo:** 1 dia (CSS + campo `avatarFrame` no `Profile`; o Duelo já troca título e treinador com o rival, a
  borda vai junto).
- **Arte:** CSS/SVG (gradientes iguais aos do título "shine"/"holo").
- **Risco:** baixo; precisa caber nos 320 px.

### 7. Escudo montável
- **O que é:** formato (6) + símbolo (12–20) + 2 cores do clube, montado em SVG na hora.
- **Como ganha:** formatos e 4 símbolos livres; o resto sai de coleções, insígnias e medalhas (símbolo de cada
  insígnia, pokébola, raio, chama, gota, folha, coroa da Liga).
- **Onde aparece:** placar, VERSUS, resultado, card do título, Hall da Fama, Duelo.
- **Por que prende:** é a identidade do clube, o "isso é meu" mais forte do FUT.
- **Custo:** 2 a 3 dias (editor + aplicar em 6 telas + placar do Phaser).
- **Arte:** SVG por código; os símbolos são desenhos simples. Sem asset de fora.
- **Risco:** médio no visual (placar no celular é pequeno). Decisão do Miguel.

### 8. Uniforme: cor secundária e padrão
- **O que é:** segunda cor + padrão (liso, listras, faixa diagonal, meio a meio, xadrez). Pokémon não veste
  camisa, então o uniforme aparece no anel embaixo do Pokémon (cor 1 + contorno cor 2), no placar, no VERSUS e no
  card.
- **Como ganha:** cor secundária livre; padrões por medalhas.
- **Onde aparece:** quadra (anel/setinha), placar, VERSUS, card.
- **Por que prende:** mais combinações, mais "meu clube".
- **Custo:** 1,5 dia. `rivalColor` precisa considerar as duas cores.
- **Arte:** código.
- **Risco:** leitura em campo (dois times com contorno parecido). Testar headless em 8x.

### 9. Grito de gol e faixa da torcida
- **O que é:** o cry do capitão (ou do mascote) toca junto com a torcida no seu gol; a faixa é uma frase de uma
  **lista fechada** ("Vai, Pallet!", "Aqui é Kanto", "Raça e PP", ~30 frases PT/EN) que aparece no VERSUS e na
  arquibancada.
- **Como ganha:** grito livre; frases liberadas por missões e coleções.
- **Onde aparece:** som do gol (`playSample` em `src/game/audio.ts`), VERSUS, Duelo.
- **Por que prende:** som é identidade, e é barato.
- **Custo:** meio dia o grito; 1 dia a faixa.
- **Arte:** cries CC0 que já estão no repo.
- **Risco:** **texto livre no Duelo é risco de ofensa**; por isso lista fechada. Volume do cry passa pelo
  volume de efeitos.

### 10. Quadras temáticas
- **O que é:** troca de paleta e detalhe da `court.ts`: madeira (padrão), Pewter (pedra), Cerulean (azulejo de
  piscina), Vermilion (amarelo elétrico), Celadon (grama), Fuchsia (tatame roxo), Saffron (mosaico), Cinnabar
  (lava), Viridian (terra), Liga Índigo (azul e dourado).
- **Como ganha:** insígnia de ouro (item 2) libera a quadra daquele ginásio; Liga com 10 títulos.
- **Onde aparece:** suas partidas em casa e a quadra da Home (`HomeCourt.tsx`).
- **Por que prende:** muda o que se vê o tempo todo, e conversa com o Modo história.
- **Custo:** 2 a 3 dias (paletas + contraste da bola e das linhas em todas).
- **Arte:** código (já é procedural).
- **Risco:** contraste com o rastro do tipo na bola e com as cores dos clubes. O roadmap põe quadras na 0.8.9:
  decisão do Miguel se adianta.

### 11. Sala de troféus
- **O que é:** uma estante com taças por tipo de feito (Copa de Kanto, Copa perfeita, Copa do Dia, Duelo, Copa
  entre amigos), cada uma com o número; toque abre o Hall daquele tipo. Taça girando em CSS 3D (sem lib).
- **Como ganha:** vencendo cada modo.
- **Onde aparece:** Perfil; uma taça no cartão de treinador.
- **Por que prende:** dá peso visual ao Hall da Fama e abre espaço pros modos novos.
- **Custo:** 1 a 1,5 dia (variações do `Trophy.tsx`).
- **Arte:** SVG por código.
- **Risco:** só faz sentido cheia quando Copa do Dia e Duelo ranqueado existirem. Antes disso fica com 2 taças.

### 12. Cartão de treinador (vitrine compartilhável)
- **O que é:** o "display board" do TCG Pocket: uma imagem 1:1/9:16 com treinador, título, borda, 3 medalhas ou
  insígnias escolhidas, a melhor carta, "Figurinhas 212/755" e "Insígnias 6/8". Os mesmos 3 destaques aparecem no
  VERSUS do Duelo.
- **Como ganha:** livre; o conteúdo vem do resto.
- **Onde aparece:** Perfil > Compartilhar; VERSUS do Duelo.
- **Por que prende:** é o "pra se exibir" puro, e traz gente pelo link (o placar mostra 2 sessões vindas de
  `share`).
- **Custo:** 1 dia (pipeline do `share-card.ts` já faz o card do título).
- **Arte:** código.
- **Risco:** baixo. Precisa dos itens 1, 2 ou 4 pra ter o que mostrar.

### 13. Acabamentos de carta por espécie (o "split" do Marvel Snap, sem loja)
- **O que é:** a carta daquela espécie ganha um acabamento só visual: Folha (10 partidas), Holo (25 gols), Prisma
  (5 títulos), Ouro escuro (Kanto completo com ela). Você escolhe qual usar por espécie.
- **Como ganha:** carreira da espécie (`DexEntry`), que já é contada.
- **Onde aparece:** todas as suas cartas daquela espécie (draft, escalação, recompensa, painel).
- **Por que prende:** junta "meu Pokémon favorito" com meta de longo prazo.
- **Custo:** 2 a 4 dias (CSS da carta + escolha por espécie + galeria).
- **Arte:** CSS (as técnicas holo do `pokemon-cards-css` já estão reimplementadas).
- **Risco:** **alto pra regra de carta**: acabamento não pode parecer edição (edição dá +2) nem brigar com
  bronze/prata/ouro. Só com o ok do Miguel na `?cards=1`.

### 14. Emotes e mascote
- **Emotes:** 6 novos no Duelo (Psyduck confuso, Pikachu comemorando, Slowpoke "?"), liberados por coleções.
  Custo 1 dia por pacote de 6 SVGs desenhados à mão (sem emoji). Risco: tamanho da barra no celular.
- **Mascote:** um Pokémon que você jogou 10+ partidas corre na `HomeCourt` e entra no escudo e na comemoração do
  título. Custo 1 dia. Decisão do Miguel (era a pergunta 4 do brainstorm de 15/10).

### 15. Sequência gentil + Copa do Dia
- **O que é:** carimbos num calendário do mês (1 por dia com copa terminada ou Copa do Dia jogada); a sequência
  conta **dias na semana** (como os "amuletos de fim de semana" do Duolingo), não zera por um dia perdido. Fechar
  o mês com 15 carimbos dá um selo do mês (fica no álbum, volta a ser possível todo mês).
- **Como ganha:** jogando a Copa do Dia (0.8.7).
- **Onde aparece:** Home, Perfil, resultado da Copa do Dia compartilhável estilo Wordle (placar e caminho sem
  spoiler).
- **Por que prende:** o motivo diário que o plano de lançamento já pede (pilar 3).
- **Custo:** 1 dia o calendário; a Copa do Dia em si é a 0.8.7 inteira (seed do dia, ranking no Supabase,
  revalidação).
- **Arte:** código.
- **Risco:** é o item que mais pode virar FOMO. Regra: nada que só sai num dia específico.

---

## 6. Separação

### Dá pra entrar na 0.8.6 rápido, sem decisão grande
Tudo retroativo, só leitura do que o save já guarda (ou um campo opcional), sem mexer em carta, quadra ou motor.

| Item | Custo | Por quê cabe |
|---|---|---|
| 2. Estojo de insígnias (sem polimento prata/ouro, que pode vir depois) | 0,5–1 dia | As 8 missões de ginásio já guardam quem venceu cada líder |
| 3. Fita de campeão na Pokédex (sem o selinho na carta do draft) | 0,5 dia | `DexEntry.titles` já existe |
| 5. Coleções temáticas | 1 dia | Formato das `MISSIONS` (`goal`/`count`); recompensa por enquanto = título |
| 9a. Grito de gol do capitão (com opção em Configurações) | 0,5 dia | Cries já no repo, sem visual |
| 1. Álbum de edições (só registrar a partir de agora + o retroativo do Hall) | 1–1,5 dia | Campo opcional; começar a contar cedo vale mais que a tela bonita |

### Precisa do Miguel (decisão de design ou visual)
- **4. Medalhas com degraus:** quais ~20 medalhas e os números de cada degrau (tabela pra ele aprovar).
- **6. Borda do avatar** e **12. Cartão de treinador / vitrine de 3 no VERSUS:** muda VERSUS e Duelo.
- **7. Escudo** e **8. Uniforme:** visual do placar e da quadra.
- **9b. Faixa da torcida:** a lista de frases.
- **13. Acabamentos de carta:** regra de carta, galeria `?cards=1` antes.
- **3b. Selinho de campeão na carta do draft:** visual de carta.
- **14. Mascote na Home** e emotes novos.

### Pra depois
- **10. Quadras temáticas:** junto com a 0.8.9 (treinadores e quadras) ou o Modo história.
- **11. Sala de troféus:** quando houver Copa do Dia e Duelo ranqueado pra encher a estante.
- **15. Sequência gentil:** junto com a Copa do Dia (0.8.7).
- Ultimate Team (montar clube com as cartas guardadas, SBC sem dinheiro): depois da 1.0, como já está no roadmap.

---

## 7. Os 3 primeiros que eu faria

1. **Estojo de insígnias** (item 2). É o mais "Pokémon", é retroativo (quem já jogou abre e vê 5/8 brilhando:
   progresso dado), custa um dia e cria a meta "a que falta". O componente serve pro Modo história depois.
2. **Álbum de edições + fita de campeão** (itens 1 e 3 juntos, na Pokédex que já existe). Transforma a Dex de
   "visto/jogou" em 755 figurinhas com número grande, e cada copa passa a colar alguma coisa. Começar a contar
   edições já na 0.8.6 evita perder o histórico.
3. **Coleções temáticas** (item 5). Metas pequenas e nomeadas, com barra, e empurram o draft pra fora dos
   mesmos 10 Pokémon (ajuda o problema do Dragonite sem mexer em balanceamento).

Na sequência, com o ok do Miguel: **borda do avatar + cartão de treinador** (a vitrine), e então **escudo**. Sem
vitrine, a coleção prende quem já está; com vitrine, ela também traz gente.

---

## 8. Notas técnicas

- **Save:** campos novos opcionais no `Profile`/`DexEntry` (borda, escudo, uniforme, acabamentos, `editions`).
  Se mudar o formato, migração em `src/store/` + teste com `scripts/fixtures/backup-v6-*.json`. Toda estrutura
  nova precisa de função `merge*` pra nuvem (`mergeDex` hoje faz máximo campo a campo; bitmask pede OU).
- **Motor:** nada aqui toca `src/engine/` nem pede `ENGINE_VERSION` (só leitura de `PlayerLine`/resultados). O
  grito de gol é só áudio.
- **Duelo:** o que o rival vê (borda, escudo, 3 destaques) viaja no `hello` do `src/net/`; validar tamanho e ids
  conhecidos (nada de texto livre).
- **i18n:** cada medalha, coleção, insígnia e frase em PT e EN, com os nomes oficiais (Boulder Badge, Cascade
  Badge...).
- **Medir:** evento `collect` (`kind: insignia|figurinha|medalha|colecao`) na lista fixa do banco (migração
  igual à do `share`) e pôr "compartilhou" e "coletou" no `npm run stats`.
- **Licença/Nintendo:** tudo desenhado por código; os únicos assets de fora já estão no repo com crédito (cries
  CC0, sprites PMD CC BY-NC). Insígnias redesenhadas em SVG simples, como o resto do fan game. Nenhuma peça é
  vendida ou sorteada por dinheiro.

---

## 9. Perguntas pro Miguel (recomendação primeiro)

1. Começar pelos 3 rápidos (insígnias, álbum + fita, coleções) já na 0.8.6? **Recomendo sim.**
2. Insígnias agora, antes do Modo história? **Recomendo sim**, com o mesmo componente reaproveitado na 0.9.
3. Medalhas: ~20 com 4 degraus, cores das cartas (bronze/prata/ouro) + platina holográfica? **Recomendo.**
4. Vitrine: 3 destaques (medalha, insígnia ou coleção) no Perfil e no VERSUS do Duelo, como os 3 emblemas do TCG
   Pocket? **Recomendo 3.**
5. Faixa da torcida: só lista fechada de frases (sem texto livre)? **Recomendo lista fechada.**
6. Acabamentos de carta: vale abrir a discussão agora ou só depois do escudo? **Recomendo depois do escudo.**
7. Sequência diária: "dias na semana" sem zerar, junto com a Copa do Dia? **Recomendo.**

---

## Fontes

- Pokémon TCG Pocket: [emblemas (Serebii)](https://serebii.net/tcgpocket/emblems.shtml), [o que são emblemas (Deltia's)](https://deltiasgaming.com/what-are-emblems-in-pokemon-tcg-pocket), [Wonder Pick (ptcgpocket.gg)](https://ptcgpocket.gg/wonder-pick/), [economia do jogo (Pokémon Zone)](https://www.pokemon-zone.com/articles/tcg-pocket-in-game-economy/), [evento de emblemas Team Rocket's Ambition](https://www.pokemon-zone.com/events/team-rockets-ambition-emblem-event), [missões e display boards (press event)](https://pokemon-zone.com/articles/pokemon-tcg-pocket-press-event)
- Pokémon GO: [lista de medalhas (Bulbapedia)](https://bulbapedia.bulbagarden.net/wiki/List_of_medals_(GO)), [Medals (Pokémon GO Wiki)](https://pokemongo.fandom.com/wiki/Medals), [fundos (Bulbapedia)](https://bulbapedia.bulbagarden.net/wiki/Background_(GO)), [fundos especiais (oficial)](https://pokemongo.com/news/special-backgrounds), [Collection Challenges (oficial)](https://pokemongo.com/post/collections-launch?hl=en)
- EA FC: [tipos de item e estádio (EA Help)](https://help.ea.com/help/ea-sports-fc/items), [Objectives (EA Help)](https://help.ea.com/fr-fr/help/fifa/fut-player-objectives/), [FUT Stadium no FIFA 21 (EGM)](https://egmnow.com/fifa-21-ultimate-team-adds-stadium-customization-removes-fitness-cards/), [escudo no FC 26](https://www.magicgameworld.com/ea-fc-26-how-to-change-club-badge-in-ultimate-team/)
- Marvel Snap: [Custom Card (Marvel Snap Zone)](https://marvelsnapzone.com/custom-card/), [bordas personalizadas (snap.fan)](https://snap.fan/news/custom-borders-in-marvel-snap/), [Infinity splits (snap.fan)](https://snap.fan/news/infinity-splits-and-frame-breaks/), [patch de 30/04/2024 (Shacknews)](https://www.shacknews.com/article/139718/marvel-snap-april-30-2024-patch-notes)
- Hearthstone: [versos de carta (wiki)](https://hearthstone.wiki.gg/wiki/Card_back), [qualidade: Diamond e Signature (wiki)](https://hearthstone.wiki.gg/wiki/Quality)
- Clash Royale: [Summer Update 2022 e Banner Boxes (RoyaleAPI)](https://royaleapi.com/blog/summer-2022-update)
- Rocket League: [títulos (Epic Help)](https://www.epicgames.com/help/c-182/c-32343914/a18023509?lang=en-US), [recompensas da Season 15 (oficial)](https://www.rocketleague.com/en/news/rocket-league-s15s-season-rush-arrives-season-rewards-unveiled)
- Duolingo / Wordle: [como a sequência cria hábito (blog Duolingo)](https://blog.duolingo.com/how-duolingo-streak-builds-habit), [Wordle (Know Your Meme)](https://knowyourmeme.com/memes/subcultures/wordle), [Wordle e o compartilhar (Boston.com/NYT)](https://www.boston.com/news/national-news/2022/01/04/he-made-wordle-for-his-partner-now-its-an-online-hit/)
- Balatro / Slay the Spire / PokéRogue: [desbloquear tudo em Balatro (games.gg)](https://games.gg/balatro/guides/how-to-unlock-everything-balatro/), [desbloqueios de Slay the Spire](https://slaythespire.info/en/how-to-unlock-characters-cards-and-relics-spoiler-warning/), [vouchers e ovos do PokéRogue](https://www.pokemoncoders.com/how-to-use-egg-vouchers-in-pokerogue/)
- Álbum digital: [Panini, trocas e abas "Need/Dupes"](https://blog.paniniamerica.net/fifa-world-cup-sticker-swaps-a-collaborative-approach-to-completing-your-collection/), [115 milhões de trocas em 2018 (FIFA)](https://www.inside.fifa.com/news/digital-panini-fever-reaches-four-million)
- Psicologia: [Ryan, Rigby e Przybylski, 2006 (PDF)](https://www.rochester.edu/warner/lida/wp-content/uploads/2022/11/02bfe513dd59366750000000.pdf), [PENS (Center for SDT)](https://selfdeterminationtheory.org/player-experience-of-needs-satisfaction-pens/), [Goal-gradient resurrected (Columbia)](https://business.columbia.edu/faculty/research/goal-gradient-hypothesis-resurrected-purchase-acceleration-illusionary-goal), [busca de metas e progresso dado (Wikipedia)](https://en.wikipedia.org/wiki/Goal_pursuit), [Dark Patterns in the Design of Games (Chalmers)](https://research.chalmers.se/publication/177148), [padrões obscuros entre jovens espanhóis (UOC)](https://recerca.uoc.edu/documentos/6a68ace5619872f2357c1f2c)
