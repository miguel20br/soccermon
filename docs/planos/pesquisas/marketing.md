---
description: Diagnóstico de marketing e plano de 4 semanas para a 0.8.6 e a 0.8.7.
---

# Marketing do Soccermon: diagnóstico, pesquisa e plano de 4 semanas (0.8.6 e 0.8.7)

Feito em 18/10/2026 a partir de `npm run stats -- --dias 7`, `gh` (releases, Discussions, tráfego do repo), git log e
dos docs de divulgação. Nada foi postado, nenhuma conta foi aberta, o repo não foi editado.

---

## 1. Diagnóstico

### O que já foi feito

| Peça | Estado | Onde |
|---|---|---|
| Trailer "Temos que chutar!" 16:9 e 9:16 (PT/EN) | pronto e postado | `trailer/montagem/`, `trailer/vertical/`, Drive "Soccermon trailer" |
| Capas, prévia do link, avatar, banner do X | prontos | `docs/marketing/*.png` |
| X: post de lançamento (15/10) | postado | texto em `docs/marketing/posts.md` |
| GitHub: releases v0.7.3 a v0.8.5 com trailer, Social preview, Discussion #1 fixada | feito | Discussion #1 tem **1 comentário e 1 voto** |
| TikTok @soccermongame | criado em 16/10, 1º post = trailer PT 9:16 | o clipe 04-terremoto ficou no PC |
| Clipe combo 0.8.4 + 0.8.5 | rascunho só da parte 0.8.4 (PT, EN e PT-tiktok) | `~/Videos/Soccermon trailer/Atualizacao-0.8.4-0.8.5/0.8.4/` |
| TabNews | planejado pra 17/10; **não aparece `tabnews` no placar** (não postado ou 0 cliques) | texto pronto em `textos-divulgacao.md` §3 |
| LinkedIn, Reddit, Show HN, Discords | **não feitos** (LinkedIn sem acesso à conta; Reddit sem conta aquecida) | textos prontos §1, §2, §4, §7 |
| itch.io | descartado em 16/10 | — |

### O que os números dizem (11 a 18/10, 82 sessões)

| Sinal | Número | Leitura |
|---|---|---|
| Sessões novas | 34 (41%) | **Gente nova quase parou de chegar:** 22 novas no dia 16/10, 5 no dia 17, 1 no dia 18. O pico do dia 16 bate com o post do TikTok + release da 0.8.2 |
| Voltando | 59% (94% no dia 18) | O jogo segura quem chega. A base hoje é pequena e fiel (amigos, testers, o próprio Miguel) |
| Canais com UTM | x = 1, github = 1, share = 2, tiktok = 0, tabnews = 0, reddit = 0 | **Nenhum canal trouxe gente de forma mensurável ainda** |
| "direto" | 50 sessões (25 novas) | Inclui o tráfego do TikTok: o link da bio só fica clicável com 1000 seguidores, então quem digita `soccermon.com` cai em "direto" |
| vercel.app | 20 sessões, 80% começam copa | É o domínio antigo (gente que já jogava + testes), **não é canal**. O "Foco da semana: investir em vercel.app" do script é falso positivo |
| GitHub | 0 estrelas, 14 views (5 únicos) | O repo ainda não é vitrine |
| Funil das **novas** | 34 → 23 passam das boas-vindas (68%) → 18 começam copa → 12 jogam partida → 11 terminam → 5 campeões | Dois vazamentos: **32% saem antes de passar das boas-vindas** (suspeito: navegador interno de TikTok/X demorando a carregar ~600 KB de JS) e copa → 1ª partida (-33%) |
| Aparelho | 51% celular, 44% desktop | Os clipes têm que vender pra quem está no celular |
| Velocidade | 79% jogam em 8x | O público quer ritmo: clipe rápido, sem enrolação |
| Copas | 28 títulos, **0 copas perfeitas** | Gancho pronto: "ninguém fez ainda" (vira a missão do Ash dourado) |
| Mais escolhidos | Dragonite, Charizard, Blastoise, Arcanine, Gyarados, Mewtwo | Os nomes que param o dedo no feed |
| Gols | 6,8 por jogo, 11% nos pênaltis | Muito lance pra recortar |

**Conclusão:** o produto segura (retenção alta, zero erro, 37% das sessões terminam copa), mas a divulgação ainda
não começou de verdade. Só saíram 2 posts (X e TikTok), e o canal com mais aposta (TikTok) é justamente o que não
dá pra medir. Com 34 pessoas novas por semana não dá pra aprender nada sobre o funil. Por isso a prioridade das
próximas 4 semanas é **volume e regularidade de postagem**, com duas correções pequenas de medição:

1. **Link curto pro TikTok:** um redirect no `vercel.json` (`/tt` → `/?utm_source=tiktok`, sem ser permanente)
   e a legenda passa a dizer `soccermon.com/tt`. São 3 linhas, mas mexem no repo e vão pra `main`: precisa do ok do Miguel.
   Mesmo esquema pra Reels/Shorts se ele quiser separar (`/ig`, `/yt`).
2. **`scripts/stats.ts`:** não sugerir `vercel.app`, `vercel` nem `android` como "foco da semana" (não são canais).
3. (Investigar, não é marketing) os 32% de novos que saem nas boas-vindas: medir o tempo de carga no navegador
   interno do TikTok/Instagram no celular. Clique pago com suor de post e perdido no carregamento é o pior desperdício.

---

## 2. Pesquisa: como jogo de navegador e fan game cresce sem dinheiro

### O que funciona no TikTok, Reels e Shorts

- **O 1º segundo decide.** Comece pelo quadro mais forte (o resultado primeiro, a explicação depois). O conceito
  tem que ser entendível em uns 5 s. ([presskit.gg](https://presskit.gg/field-guides/tiktok-indie-game-marketing),
  [bugnet.io](https://bugnet.io/blog/tiktok-marketing-for-indie-games),
  [StraySpark](https://www.strayspark.studio/blog/devlog-marketing-build-wishlists))
- **Gameplay cru sozinho rende menos hoje.** Funciona melhor com gancho escrito, corte rápido ou **voz do dev
  narrando** por cima do jogo; o acabamento importa menos que a autenticidade.
  ([Insider Gaming, fórum](https://insider-gaming.com/forum/threads/how-are-you-using-tiktok-to-share-gaming-content-tips-ideas-or-lessons-learned.3116/latest),
  [bugnet.io](https://bugnet.io/blog/tiktok-marketing-for-indie-games))
- **Formatos que se repetem nos casos que deram certo:** antes/depois com corte seco, bug engraçado, pergunta-gancho,
  "devlog em 30 s" (problema → luta → resultado), série "Dia X de Y" (só se der pra manter 2+ por semana), loop
  satisfatório. ([presskit.gg](https://presskit.gg/field-guides/tiktok-indie-game-marketing))
- **Frequência:** 2 a 3 por semana, consistência acima de volume; republicar o mesmo clipe em Reels e Shorts 1–2
  dias depois, **sem a marca d'água do TikTok**. Esperar que a maioria fique abaixo de 1.000 views: **um clipe
  que estoura por mês já é vitória.** ([presskit.gg](https://presskit.gg/field-guides/tiktok-indie-game-marketing))
- **Shorts vive de busca:** título descritivo ("Pokémon jogando futsal: ganhei a copa com um Rattata") rende por meses.
- **O maior alcance costuma vir de outros creators** repostando o seu material (caso YAPYAP: o anúncio de 1,5 M de
  views veio de contas de terceiros). Ter material limpo e fácil de recortar ajuda.
  ([presskit.gg](https://presskit.gg/field-guides/tiktok-indie-game-marketing))
- O algoritmo testa cada vídeo pelo que ele é, então conta nova não começa em desvantagem.

### O caso mais parecido: PokeRogue (2024)

Roguelike de Pokémon de navegador, open source, **feito em Phaser**, save na conta e roda no celular. Cresceu por
**streamers e YouTubers** (Ludwig, SmallAnt, um vídeo do zwiggo com 1,7 M de views), ganhou categoria própria na
Twitch e um subreddit de 64 mil pessoas em poucos meses. TikTok aparece pouco nas fontes confiáveis.
([Phaser](https://www.phaser.io/news/2024/06/pokerogue),
[Dot Esports](https://dotesports.com/pokemon/news/pokerogue-creator-walks-away-from-viral-pokemon-project-after-adding-an-ending),
[Millenium](https://www.millenium.org/news/413327.html))

Lição: o Soccermon tem o mesmo DNA (draft roguelike, navegador, grátis). **O que escala é alguém com público jogar
no ar.** Vale mais montar um kit pra creator e mandar pra 10 canais pequenos de Pokémon BR do que postar 30 clipes.

### Jogos de navegador que viralizaram sozinhos

- **Wordle:** 90 jogadores em 1/11/2021, explodiu porque o resultado vira **um texto curto sem spoiler** que todo
  mundo cola no feed, e porque é **o mesmo desafio pra todo mundo no dia**.
  ([Silicon Republic](https://siliconrepublic.com/?p=957516), [Nintendo Life sobre o "Wordle de Pokémon"](https://www.nintendolife.com/news/2022/01/random-heard-of-wordle-now-theres-a-pokemon-version))
- **Infinite Craft:** um post no X com 15 M de views na 1ª semana e depois os jogadores postando as próprias
  descobertas esquisitas. ([Know Your Meme](https://knowyourmeme.com/memes/sites/infinite-craft))

Lição direta pra **0.8.7 (Copa do Dia: mesma seed pra todo mundo)**: o resultado da Copa do Dia precisa de um
texto de compartilhar curto, sem spoiler e com cara própria (emoji pode no texto de compartilhar). É a peça de
marketing mais forte do roadmap; vale desenhar esse texto junto com a feature.

### Trends de Pokémon que dá pra surfar

- **Desafio com Pokémon fraco** é gênero consagrado: zerar com um Magikarp só, "Magikarp Sweep".
  ([TechRaptor](https://techraptor.net/content/man-beat-pokemon-sunmoon-magikarp),
  [Know Your Meme, Magikarp](https://meme.com/memes/magikarp/md)). O Joey dourado (campeão com Rattata) e o "Zé
  Ninguém" (5 titulares bronze) já são esse desafio dentro do jogo.
- **"Realistic Pokémon team"** (TikTok, 2025): trend em **carrossel de fotos**, com briga nos comentários sobre
  lendário no time. ([Know Your Meme](https://knowyourmeme.com/memes/realistic-pokemon-team-trend)). Formato barato
  pra ranking de cartas ("o melhor goleiro de Kanto") e gera comentário.

### Reddit

- Não consegui ler as regras atuais de r/WebGames nem de r/PokemonROMhacks (o Reddit bloqueia leitura
  automática). Vale a lista de conferência de `textos-divulgacao.md` §1.4.
- **r/indiegames** (regra de 2024): promoção é permitida, mas **proíbe promoção disfarçada de pedido de feedback**
  no título ("would you play this?") e encurtador de link.
  ([regras via redlib](https://redlib.belloworld.it/r/indiegames)). O título do §1.3 está ok; o pedido de feedback
  fica só no comentário.
- Alternativas que aceitam autopromoção com flair: **r/IndieGaming** e **r/playmygame**.
  ([presskit.gg, Reddit](https://presskit.gg/field-guides/reddit-marketing-indie-games))
- Regra geral: no máximo ~1 em cada 10 posts seus pode ser divulgação; conta nova só com divulgação cai no filtro.
  ([Steam Page Analyzer](https://www.steampageanalyzer.com/blog/reddit-indie-game-marketing),
  [TouchArcade](https://toucharcade.com/community/threads/reddit-advice-for-an-indie-dev.273028/))

### Show HN

Regras oficiais: tem que dar pra testar na hora, **sem cadastro** (o Soccermon cumpre), e o criador precisa estar
lá respondendo. Título claro ("Show HN: Soccermon – …"), tom técnico, sem hype. Dia útil de manhã nos EUA é
costume, sem dado forte por trás. ([HN Show guidelines](https://news.ycombinator.com/showhn.html),
[Lucas F. Costa](https://www.lucasfcosta.com/blog/hn-launch),
[Indie Hackers](https://www.indiehackers.com/@vbordo/from-failed-launch-to-going-viral-on-hacker-news-bdd734e742))

### TabNews

Pode falar do próprio projeto **se trouxer valor técnico** (decisões, dificuldades); pitch curto leva "Pitch" no
título; post repetido sobre o mesmo projeto tende a ser tratado como repetição, a não ser que o assunto mude;
apagar e repostar pode dar banimento. ([FAQ do TabNews](https://tabnews.com.br/faq),
[devlog sem ferir as regras](https://www.tabnews.com.br/wellingtonpragidi/como-utilizar-o-tabnews-como-devlog-para-projetos-open-source-sem-ferir-as-regras-da-plataforma)).
Então: um post por **tema técnico diferente** (motor determinístico; depois "o bug do Duelo injusto").

### Creators e comunidades BR

Não achei uma lista confiável de canais BR que jogam fan game de Pokémon (a busca não trouxe nomes verificáveis;
não vou inventar @). Caminho: o Miguel procura no TikTok/YouTube por "fan game pokémon", "pokérogue" e "jogo de
pokémon no navegador" em PT, filtra creators de 5 mil a 100 mil seguidores que postaram nos últimos 30 dias e
manda o kit. Discords: Disboard com tag pokémon e idioma PT, só no canal de divulgação.

### Nintendo: o que a pesquisa diz

- **Ser sem fins lucrativos não blinda.** Em 2024 a The Pokémon Company derrubou o **Relic Castle** (site de fan
  games sem anúncio e sem fins lucrativos) por DMCA. Pokémon Uranium (2016) caiu com 1,5 M de downloads e só
  aceitava doação sugerida; o GameJolt (562 jogos) foi citado por ter anúncio.
  ([VGC](https://videogameschronicle.com/news/pokemon-fan-game-repository-taken-down-by-a-reported-dmca-notice),
  [80.lv](https://80.lv/articles/website-hosting-pok-mon-fan-games-has-been-taken-down/),
  [TheWrap](https://thewrap.com/pokemon-uranium-nintendo-go),
  [GGRecon](https://ggrecon.com/articles/hundreds-of-fan-made-pokemon-games-have-reportedly-been-culled))
- Um YouTuber brasileiro teve os vídeos do FPS de Pokémon que fazia derrubados em YouTube, X e Reddit.
  ([Canaltech](https://canaltech.com.br/games/nintendo-derruba-jogo-de-tiro-de-pokemon-feito-por-fa-207357/))
- As diretrizes de conteúdo da Nintendo (set/2024) cobrem vídeo de **jogos da Nintendo**, não fan game, e proíbem
  sugerir afiliação. ([Nintendo](https://www.nintendo.co.jp/networkservice_guideline/en/index.html))

O risco cresce com a fama e o Miguel já conhece. Na divulgação, o que dá pra controlar:

- Zero dinheiro em qualquer lugar: **nem Spark Ads/impulsionar post** (os guias sugerem; aqui não).
- Nome e logo próprios (já é "Soccermon"); nada de logo oficial, arte oficial ou a Pokébola oficial em capa e thumbnail.
- "Fan game sem fins lucrativos, não afiliado à Nintendo/Game Freak/Creatures/The Pokémon Company" na legenda longa,
  no Reddit, no HN e na Discussion.
- Hashtag `#pokemon` como descrição tudo bem; não marcar `@pokemon`/`@nintendo` nem usar título que pareça oficial
  ("Pokémon Futsal").
- **Música:** o "Trainer Battle Remix" é remix de música da Game Freak (o próprio `divulgacao-trailer.md` avisa
  pra evitar). Pros clipes novos, prefira **som do próprio jogo** (torcida, apito, impacto, que são gravações CC0)
  ou som da biblioteca do TikTok escolhido pelo Miguel na hora de postar.

---

## 3. Plano de 4 semanas (19/10 a 15/11)

Premissas: a 0.8.6 sobe nesta semana quando o Miguel disser "pode subir"; a 0.8.7 (Liga ranqueada + **Copa do Dia**)
entra por volta da semana 3. Ritmo-alvo: **3 clipes por semana no TikTok** (o mesmo clipe em Reels e Shorts 1–2
dias depois), **1–2 posts no X**, **1 canal novo por semana**. Toda segunda: placar (`npm run stats -- --md`) na
tabela do `divulgacao-0.8.md`.

### Semana 1 (19–25/10): lançamento da 0.8.6

| Dia | O quê | Gancho |
|---|---|---|
| seg 19 | Placar 1. Miguel cria a conta do Reddit e começa a aquecer (comentar 5–10 posts por dia até sábado) | — |
| ter 20 | **Show HN** (~11h de Brasília), Miguel respondendo por 3–4 h. Clipe 1 (RIVAL EVOLUIU!) | jogo de navegador sem cadastro + motor determinístico |
| qua 21 | 0.8.6 no ar (se o "pode subir" sair). Post da 0.8.6 no **X**, **Discussion** "Desafio dos Dourados" fixada, release no GitHub | os 6 dourados |
| qui 22 | Clipe 5 ("28 campeões, 0 copas perfeitas"): abre o desafio | ninguém fez ainda |
| sex 23 | **LinkedIn** (se o acesso voltar): história do Duelo injusto | bug de multiplayer |
| sáb 24 | Clipe 6 (Snorlax no gol no meio do jogo) | prancheta ao vivo |
| dom 25 | X: resposta no fio da 0.8.6 com o print do 1º dourado de alguém (se houver) ou do Miguel | prova social |

### Semana 2 (26/10–1/11): Reddit e semana do Joey

| Dia | O quê |
|---|---|
| seg 26 | Placar 2. Escolher a mudança da semana (funil das novas) |
| ter 27 | Clipe 3 (Rattata campeão, "top percentage"). **Semana do Joey** no desafio |
| qua 28 | **r/WebGames** (§1.1, agora citando os dourados) |
| qui 29 | Clipe 2 (+2 por evolução, "qual inicial você criaria?") |
| sex 30 | **r/indiegames** com o clipe que mais rendeu no TikTok (§1.3 com o texto da seção 6 abaixo) |
| sáb 31 | Clipe 10 (carrossel: melhores goleiros de Kanto). Discords BR (texto §2.2) em 2–3 servidores |
| dom 1 | X: placar da semana em público (sessões, quantos dourados saíram) |

### Semana 3 (2–8/11): 0.8.7 e Copa do Dia

| Dia | O quê |
|---|---|
| seg 2 | Placar 3. **Kit pra creator** pronto (seção 5) e enviado a 5 creators BR pelo Miguel |
| ter–qua | 0.8.7 no ar: post "Copa do Dia" no X, TikTok, Discussion; o texto de compartilhar da Copa do Dia é o CTA |
| qui 5 | Clipe 4 (Senhor dos Céus). **Semana do Lance** |
| sáb 7 | Clipe 7 (antes/depois da defesa do goleiro, formato devlog) |
| dom 8 | **TabNews 2** com tema novo (o bug do Duelo, ou como a Copa do Dia evita trapaça revalidando a seed) |

### Semana 4 (9–15/11): comunidade

| Dia | O quê |
|---|---|
| seg 9 | Placar 4 + post "1 mês de Soccermon em público" (X e LinkedIn) com os números reais |
| ter–dom | Clipes 8 e 9; **semana do Ash** (o mais difícil); repostar (com permissão) o card do título de quem fez dourado; r/IndieGaming ou r/playmygame; mais 5 creators |

**Metas realistas** (as do `lancamento.md`, 500 sessões/semana no fim de outubro, estão longe dos 82 de hoje):
150 sessões/semana na semana 2, 300 na semana 4, pelo menos 1 canal com UTM trazendo 20+ sessões novas, e o 1º
treinador dourado de alguém de fora.

---

## 4. Dez clipes verticais (15–30 s)

Regras da skill `soccermon-assets`: sem nome em cima dos Pokémon e sem texto do jogo (o texto vem da edição),
câmera lenta de verdade no pico + flash + tremida, letreiro do golpe colado em quem usa, menus por recorte do DOM
(3x) em corte seco, nada de câmera passeando por print. Gravar com `scripts/trailer-capture.mjs` e montar a versão
"uau" com `scripts/trailer-uau.mjs`; `--modo pagina` quando precisa do HTML por cima (evolução, faixa do rival).
Vertical 1080x1920, comprimido em 2 passes (~1,45 Mbps) pra caber nos 10 MB do upload pela extensão.

Link nas legendas: `soccermon.com/tt` se o redirect entrar; senão `soccermon.com`. Comentário com o link em todo post.

### 1. RIVAL EVOLUIU!

- **Atalho:** `?demo=evolucao&rival=1` (a do rival) e `?demo=evolucao` (a sua, tela cheia).
- **Roteiro (20 s):** 0–2 s rival piscando em silhueta branca, já no meio da animação · 2–5 s faixa "RIVAL
  EVOLUIU!" e o evoluído arrancando com a bola · 5–7 s corte seco pra tela do seu Charmander · 7–14 s sua evolução
  em tela cheia · 14–20 s lance do seu evoluído, gol em câmera lenta.
- **Texto na tela:** "O rival evoluiu no meio do jogo" → "Então o meu também"
- **Legenda:** Achei que só eu evoluía no meio da partida. Agora o rival também evolui, com animação própria 😤 Soccermon, fan game de futsal com os 151 de Kanto, grátis no navegador: soccermon.com/tt
- **Hashtags:** `#pokemon #pokemonbrasil #charmander #fangame #futsal`

### 2. Criado em casa vale mais

- **Atalho:** `?demo=evolucao` até a carta evoluída aparecer na escalação (recorte do DOM) + a carta do Charizard
  pronto na galeria `?cards=1` (recorte). Conferir no jogo os números exatos antes de escrever (patch notes: 89 × 85).
- **Roteiro (15 s):** 0–2 s duas cartas lado a lado, "85" e "89" grandes · 2–9 s corte seco Charmander → Charmeleon →
  Charizard (as 2 evoluções em campo, 2 s cada) · 9–15 s a carta 89 brilhando.
- **Texto na tela:** "Charizard pronto: 85" / "Charizard que eu criei desde Charmander: 89"
- **Legenda:** Criar desde pequeno compensa: cada evolução no meio da partida dá +2 em tudo. Qual inicial você criaria? 🔥💧🌱 soccermon.com/tt
- **Hashtags:** `#pokemon #charizard #charmander #fangame #futsal`

### 3. Meu Rattata é top percentage

- **Atalho:** cena nova em `src/ui/trailer-scenes.ts` com Rattata titular (o resto do time forte) + caçar seed com
  gol do Rattata (`npx tsx scripts/trailer-hunt.ts --cena rattata --n 800 --top 8`). Fim: recorte do Joey dourado
  no Perfil (ou no card do título 9:16).
- **Roteiro (20 s):** 0–3 s gol do Rattata em câmera lenta, flash · 3–10 s mais 2 lances dele (drible, golpe) · 10–15 s
  "CAMPEÃO" · 15–20 s Joey dourado brilhando.
- **Texto na tela:** "Campeão com um Rattata titular na final" → "O Joey tava certo"
- **Legenda:** O Joey passou a vida falando que o Rattata dele era top percentage. No Soccermon, ser campeão com um Rattata na final dá o Joey dourado. Bora? soccermon.com/tt
- **Hashtags:** `#pokemon #rattata #youngsterjoey #fangame #futsal`

### 4. Senhor dos Céus

- **Atalho:** cena nova com Articuno, Zapdos e Moltres titulares + caçar seed com golpe de cada um (Ice Beam,
  Thunderbolt/Drill Peck, Flamethrower). Fim: Lance dourado.
- **Roteiro (25 s):** 0–3 s os 3 em quadra, gol de golpe do Moltres · 3–15 s um lance de cada pássaro, corte na batida
  · 15–20 s faixa de campeão · 20–25 s Lance dourado + título "Senhor dos Céus".
- **Texto na tela:** "Articuno, Zapdos e Moltres no mesmo time" → "Lance dourado desbloqueado"
- **Legenda:** Montei o trio de pássaros lendários e levei pra final. O Lance aprovou 🐦❄️⚡🔥 Campeão com os 3 titulares na final = Lance dourado no Soccermon. soccermon.com/tt
- **Hashtags:** `#pokemon #articuno #zapdos #moltres #fangame`

### 5. 28 campeões, 0 copas perfeitas (abre o desafio)

- **Atalho:** `?demo=escanteio&defesa=1` (espalmada do goleiro) + defesas da cena de goleiro já gravada
  (`brutos/cap/gk-n`); fim com a silhueta do Ash dourado bloqueado no Perfil.
- **Roteiro (18 s):** 0–2 s texto grande "28 campeões. 0 copas perfeitas." sobre defesa em câmera lenta · 2–12 s 3
  defesas seguidas na batida · 12–18 s silhueta do Ash dourado com "Campeão sem sofrer nenhum gol".
- **Texto na tela:** "28 pessoas foram campeãs. Ninguém fez sem sofrer gol."
- **Legenda:** Até hoje ninguém foi campeão no Soccermon sem sofrer gol. Quem fizer primeiro destrava o Ash dourado (e eu coloco seu nome nas Novidades do jogo). Manda o print do card do título aqui embaixo 👇 soccermon.com/tt
- **Hashtags:** `#pokemon #desafiodourado #fangame #futsal #pokemonbrasil`
- Atualizar o "28" com o placar do dia antes de postar.

### 6. Coloquei o Snorlax no gol no meio do jogo

- **Atalho:** `?demo=campeao` (tem Snorlax). Durante a partida, abrir a prancheta, trocar o Snorlax pro gol e
  confirmar; gravar a bola parada em que a mudança entra e uma defesa dele. Recortes da prancheta pelo DOM.
- **Roteiro (22 s):** 0–2 s Snorlax no gol fechando o ângulo, defesa em câmera lenta · 2–4 s "Como?" · 4–12 s
  recortes secos: prancheta abrindo, Snorlax arrastado pro gol, "Confirmar" · 12–22 s a defesa de novo, inteira, com
  a torcida.
- **Texto na tela:** "Tava levando gol" → "Snorlax pro gol" → "Entra na próxima bola parada"
- **Legenda:** Agora dá pra mexer na formação e trocar todo mundo de vaga no meio da partida. Qualquer um pode ir pro gol. O Snorlax foi e fechou 😴 soccermon.com/tt
- **Hashtags:** `#pokemon #snorlax #fangame #futsal #goleiro`

### 7. Antes e depois: a bola passava por trás do goleiro (devlog)

- **Atalho:** "antes" gravado num worktree temporário na tag `v0.8.5` com uma seed em que a bola defendida passa
  atrás do goleiro (caçar com o próprio `trailer-hunt.ts` naquela versão); "depois" com `?demo=escanteio&defesa=1`
  na 0.8.6 (espalmada saindo pelo lado da mão). Os dois em câmera lenta.
- **Roteiro (18 s):** 0–6 s ANTES com um X vermelho na hora em que a bola atravessa · 6–8 s corte seco · 8–18 s
  DEPOIS, espalmada pra escanteio.
- **Texto na tela:** "Antes: a bola passava por trás do goleiro" / "Agora: espalma pro lado da mão"
- **Legenda:** Bug que ninguém pediu pra ver de novo. Consertado na 0.8.6 do Soccermon. Achou outro? Me conta nos comentários. soccermon.com/tt
- **Hashtags:** `#gamedev #indiedev #pokemon #fangame #devlog`
- Ideal com **voz do Miguel** narrando 2 frases (formato devlog rende mais com voz).

### 8. Pênaltis na final contra a Liga Índigo

- **Atalho:** `?demo=penaltis`; cortar na última cobrança, câmera lenta no goleiro, "uuuh" da torcida.
- **Roteiro (15 s):** 0–2 s batedor parado na marca, silêncio · 2–6 s 2 cobranças rápidas · 6–15 s a última em câmera
  lenta, corta ANTES de mostrar se entrou (loop: o vídeo recomeça, as pessoas reveem).
- **Texto na tela:** "Final contra a Liga Índigo. Pênaltis." → "Quem você colocaria pra bater?"
- **Legenda:** Quem bate o último? Errou, acabou a copa ⚽ soccermon.com/tt
- **Hashtags:** `#pokemon #futsal #penaltis #fangame`

### 9. Original e Clone

- **Atalho:** `?demo=ditto` (Mew + Mewtwo com a sinergia Gênese; Ditto no time).
- **Roteiro (20 s):** 0–2 s Mewtwo marcando em câmera lenta · 2–8 s Mew passando pro Mewtwo (aura da sinergia) ·
  8–14 s Ditto virando um deles · 14–20 s título "Original e Clone" brilhando.
- **Texto na tela:** "Mew e Mewtwo no mesmo time" → "E o Ditto copiando os dois"
- **Legenda:** Mew e Mewtwo juntos têm sinergia própria, e campeão com os dois na final ganha o título Original e Clone. O Ditto entrou de penetra 🧬 soccermon.com/tt
- **Hashtags:** `#pokemon #mewtwo #mew #ditto #fangame`

### 10. Os melhores goleiros de Kanto (carrossel de fotos)

- **Atalho:** `?cards=1` (recortes das cartas, 3x, sobre o fundo de marca); números tirados dos dados do jogo
  (nota de Goleiro por espécie) por um script em `scripts/` ou no scratchpad, conferidos com o Miguel.
- **Formato:** carrossel de 6–8 fotos no TikTok (o formato da trend "realistic team"), última foto = logo + "soccermon.com/tt".
- **Texto nas fotos:** "Os 5 melhores goleiros de Kanto segundo o Soccermon" · uma carta por foto com 1 linha de
  piada ("Mr. Mime: parede invisível") · "Errei? Comenta quem faltou".
- **Legenda:** Ranking oficial (do meu jogo, não da Nintendo 😅). Quem você colocaria no gol? soccermon.com/tt
- **Hashtags:** `#pokemon #pokemonbrasil #ranking #fangame #futsal`
- Vira série: melhores pivôs, piores fixos, "time só de bronze que ganhou".

**Ideias extras** (mais difíceis de gravar): virada de 3 gols na final (Blue dourado; precisa caçar seed com
pontuação nova de "virada"); série "Prof. Carvalho: jogando com os 151", um Pokémon por dia, ótima pra conta
crescer se o Miguel aguentar o ritmo.

**Hashtags:** 4 ou 5 por post. Base PT `#pokemon #pokemonbrasil #fangame #futsal` + a espécie do clipe. EN
`#pokemon #fangame #indiegame #soccer`. Devlog `#gamedev #indiedev`. Shorts: título descritivo, que conta mais que hashtag.

---

## 5. Desafio dos Treinadores Dourados (gancho de comunidade)

**Nome:** Desafio Dourado (`#DesafioDourado`). Custa zero, já está no jogo, e o card do título 9:16 já mostra o
treinador dourado com a moldura: a prova vem pronta pra postar.

| Dourado | Feito | Dificuldade (estimada) |
|---|---|---|
| Joey | campeão com Rattata titular na final | média |
| Lance | campeão com Articuno, Zapdos e Moltres titulares na final | depende da sorte no draft |
| Prof. Carvalho | jogar com os 151 pelo seu time | longa |
| Red | 5 copas seguidas | difícil |
| Blue | virar a final depois de perder por 3 | rara |
| Ash | campeão sem sofrer nenhum gol | **0 em 28 títulos até hoje** |

**Como funciona:**

1. Discussion fixada no GitHub "Desafio Dourado" (texto na seção 6) + post no X e clipe 5 no TikTok.
2. Quem fizer posta o **card do título** com `#DesafioDourado` (TikTok/X/Instagram) ou responde na Discussion.
3. **Mural dos Dourados:** a Discussion mantém a lista dos primeiros de cada treinador; o Miguel reposta (com permissão).
4. **Prêmio sem dinheiro:** o 1º de cada dourado ganha o nome nas Novidades da versão seguinte ("Primeiro Ash
   dourado: fulano") e, se o Miguel topar, um **título exclusivo por código** (skill `soccermon-titulos`; o código
   nunca vai pro repo, que é público).
5. Uma semana em foco por vez (Joey na semana 2, Lance na 3, Ash na 4): um clipe e um post por semana.
6. Na 0.8.7 a **Copa do Dia** vira o desafio diário natural (mesma seed pra todo mundo), e o texto de compartilhar
   dela é o "Wordle" do Soccermon.

Medição: `share` no placar, posts com a hashtag e respostas na Discussion. Se quiser contar dourados no placar, faltaria
um evento `mission` na lista fixa do banco (migração), mas isso é opcional e decidido com ele.

Cuidado: o jogo roda no cliente, então dá pra trapacear. Com prêmio simbólico isso não importa; não prometer nada
que dependa de verificação.

---

## 6. Textos prontos do post da 0.8.6

Fatos conferidos em `src/ui/patch-notes.ts`, `src/store/missions.ts` e `src/i18n/*/profile.ts` (18/10). Sem
travessão, sem tricolon de IA, um CTA por texto. Os números entre colchetes vêm do placar do dia; não postar com colchete.

### TikTok / Reels / Shorts (vídeo: clipe combo da 0.8.6, ou o clipe 1 ou o 6)

**PT**

> Saiu a 0.8.6 do Soccermon ⚽ Agora o rival também evolui no meio da partida, dá pra mexer na formação com a bola rolando (o Snorlax foi pro gol) e cada evolução dá +2 na carta. E tem 6 treinadores dourados pra quem fizer coisa absurda, tipo ser campeão com um Rattata. Joga grátis no navegador: soccermon.com/tt
>
> Fan game sem fins lucrativos.
>
> #pokemon #pokemonbrasil #fangame #futsal #snorlax

**EN**

> Soccermon 0.8.6 is out ⚽ Rivals now evolve mid-match too, you can change formation while the ball is rolling (Snorlax went in goal) and every evolution adds +2 to the card. Plus 6 golden trainers for absurd feats, like winning the cup with a Rattata. Free in your browser: soccermon.com/tt
>
> Non-profit fan game.
>
> #pokemon #fangame #indiegame #soccer #snorlax

**Comentário com link:** "Joga aqui: https://soccermon.com/?utm_source=tiktok" (fixar pelo app).

### X

**PT** (post principal, com o clipe)

> Saiu a 0.8.6 do Soccermon: 6 treinadores dourados que só saem com feito absurdo. Campeão com Rattata titular na final, com os 3 pássaros, virando a final depois de perder por 3. Ninguém fez a copa sem sofrer gol até hoje. https://soccermon.com/?utm_source=x

**PT** (resposta no fio, no mesmo dia)

> Também na 0.8.6: prancheta no meio da partida. Muda a formação, troca qualquer um de vaga (até pro gol) e entra na próxima bola parada. E o rival agora evolui com animação própria, então não é só você que leva susto.

**EN**

> Soccermon 0.8.6 is out: 6 golden trainers you only get for absurd feats. Win the cup with a Rattata starting the final, with all 3 legendary birds, or by coming back from 3 down in the final. Nobody has won a cup without conceding yet. https://soccermon.com/?utm_source=x

### LinkedIn (PT, voz do Miguel; link no 1º comentário)

> Descobri esta semana que no modo multiplayer do meu jogo um dos dois jogadores levava vantagem.
>
> O jogo é o Soccermon, um fan game de navegador sem fins lucrativos em que os Pokémon de Kanto jogam futsal 5v5. No Duelo, dois treinadores entram na mesma partida, cada um no seu navegador. O motor é determinístico: mesma seed e mesmas ordens dão a mesma partida, então os dois lados simulam tudo e chegam no mesmo placar sem um servidor arbitrando.
>
> O problema estava numa regra mais antiga que o Duelo. Na Copa, o time 1 é sempre a IA, e a IA evolui os Pokémon com uma barra menor (10, contra 14 do jogador) pra copa ficar mais difícil. No Duelo, quem entra pelo link vira o time 1. Resultado: o convidado herdava a regra da IA e evoluía mais cedo que quem criou a sala.
>
> Os dois navegadores concordavam em tudo. A partida era idêntica nos dois lados, e injusta nos dois lados. Determinismo garante que todo mundo veja a mesma coisa; se a regra estiver torta, todo mundo vê a mesma regra torta.
>
> A correção foi pequena: no Duelo os dois usam a barra do jogador. O trabalho foi achar onde "time 1" ainda queria dizer "IA" no código.
>
> Se você já transformou um jogo single-player em multiplayer, qual foi a suposição escondida que apareceu no seu caso?
>
> #GameDev #TypeScript #Multiplayer

**1º comentário:** "Pra jogar (grátis, sem cadastro): https://soccermon.com/?utm_source=linkedin · código aberto: https://github.com/miguel20br/soccermon"

**EN** (se ele quiser postar em inglês também)

> This week I found out that in my game's multiplayer mode, one of the two players had an edge.
>
> Soccermon is a non-profit browser fan game where the Kanto Pokémon play 5v5 futsal. In Duel mode, two coaches play the same match, each in their own browser. The engine is deterministic, so both sides simulate everything and land on the same score with no server refereeing.
>
> The bug came from a rule older than Duel. In the Cup, team 1 is always the AI, and the AI evolves its Pokémon on a shorter bar (10 vs. the player's 14) to make the cup harder. In Duel, whoever joins through the link becomes team 1, so the guest inherited the AI's rule and evolved earlier than the host.
>
> Both browsers agreed on everything. The match was identical on both sides, and unfair on both sides. The fix was small: in Duel both players use the player's bar. The real work was finding every place where "team 1" still meant "AI".
>
> If you've turned a single-player game into multiplayer, what hidden assumption bit you?

### Reddit (EN; r/indiegames com o clipe nativo; r/WebGames como post de link)

**Título r/indiegames**

> I made a browser game where the 151 original Pokémon play 5v5 futsal, and you can now move Snorlax into goal mid-match

**Título r/WebGames**

> Soccermon: draft from the 151 Kanto Pokémon and coach them through a 5v5 futsal cup (free, no sign-up, works on mobile)

**1º comentário (os dois)**

> I'm the dev. Soccermon is a free, non-profit, open-source fan game: you draft a squad from the 151 Kanto Pokémon (pick 1 of 3, roguelike style) and coach them through a 4-match knockout cup that ends against the Indigo League. Gen 1 moves do things on the court: Earthquake hits your own teammates, Fly vanishes with the ball, Pokémon evolve mid-match.
>
> This week's update added a live tactics board (change formation or move anyone into goal, it kicks in at the next dead ball) and six golden trainers for absurd feats. Nobody has won a cup without conceding a goal yet.
>
> Play: https://soccermon.com/?utm_source=reddit · Code (AGPL): https://github.com/miguel20br/soccermon
>
> Not affiliated with Nintendo, Game Freak, Creatures or The Pokémon Company. Happy to answer anything about how it works.

**PT** (r/gamesEcultura ou outra comunidade BR, se as regras permitirem)

> **Título:** Fiz um jogo de navegador em que os 151 Pokémon de Kanto jogam futsal 5x5 (grátis, sem cadastro)
>
> Sou o dev. O Soccermon é um fan game gratuito e sem fins lucrativos: você monta o time com os 151 de Kanto num draft "escolha 1 de 3" e leva numa copa mata-mata de 4 jogos, com final contra a Liga Índigo. Os golpes da Gen 1 funcionam em quadra (Earthquake acerta o próprio companheiro, Fly some com a bola) e dá pra evoluir no meio da partida. Na atualização desta semana entrou a prancheta ao vivo e 6 treinadores dourados por feitos absurdos; ninguém foi campeão sem sofrer gol até agora.
>
> Joga aqui: https://soccermon.com/?utm_source=reddit
>
> Não é afiliado à Nintendo, Game Freak, Creatures nem The Pokémon Company.

### Discussion do GitHub (bilíngue; categoria Announcements, fixada)

**Título:** Desafio Dourado: 6 treinadores lendários na 0.8.6 / Golden Trainer Challenge

> **PT**
>
> A 0.8.6 trouxe 6 treinadores dourados, que só saem com feito absurdo:
>
> - **Joey dourado:** campeão com um Rattata titular na final
> - **Lance dourado:** campeão com Articuno, Zapdos e Moltres titulares na final
> - **Prof. Carvalho dourado:** jogar com os 151 Pokémon pelo seu time
> - **Red dourado:** 5 copas seguidas
> - **Blue dourado:** virar a final depois de perder por 3 gols
> - **Ash dourado:** campeão sem sofrer nenhum gol (em [28] títulos até hoje, ninguém fez)
>
> Conseguiu um? Responde aqui com o print do card do título (botão Compartilhar na tela de campeão). O primeiro de cada treinador entra nas Novidades da próxima versão. Vou mantendo a lista abaixo.
>
> **Mural dos Dourados:** (vazio por enquanto)
>
> **EN**
>
> 0.8.6 added 6 golden trainers you only unlock with absurd feats: Joey (win with a Rattata starting the final), Lance (all 3 legendary birds starting the final), Prof. Oak (play with all 151), Red (5 cups in a row), Blue (come back from 3 down in the final) and Ash (win the cup without conceding; nobody has done it yet). Got one? Reply with your title card. The first player for each trainer gets named in the next version's patch notes.
>
> Play: https://soccermon.com/?utm_source=github

---

## 7. Quem faz o quê

### Claude prepara sozinho (sem publicar nada)

- Os 10 roteiros acima viram **clipes renderizados** (PT e EN): cenas novas em `trailer-scenes.ts` (Rattata, pássaros),
  caça de seeds, captura normal + lenta, versão "uau", montagem 9:16 no HyperFrames (`trailer/atualizacao/` como
  base), folha de contato pra conferir, compressão pra 10 MB.
- **Clipe combo da 0.8.6** (a parte 0.8.4 já existe; dá pra fechar 0.8.4 + 0.8.5 + 0.8.6 num só ou fazer a 0.8.6 sozinha).
- **Capas** dos clipes e imagem do Desafio Dourado (os 6 dourados lado a lado) em `docs/marketing/arte/arte.html`.
- **Carrossel** dos goleiros (clipe 10) com os números puxados dos dados do jogo.
- **Kit pra creator:** pasta com 5 clipes limpos sem texto, logo, capa, 3 linhas sobre o jogo, link com
  `utm_source=creator` e uma mensagem curta de DM em PT e EN.
- Patches pequenos pra aprovar: redirect `/tt` no `vercel.json` e o "foco da semana" do `scripts/stats.ts` ignorando o vercel.app.
- Placar de toda segunda e atualização das tabelas de `divulgacao-0.8.md` / `textos-divulgacao.md` §8.
- Rascunho do texto de compartilhar da Copa do Dia (0.8.7).
- Pelo perfil pessoal do Chrome (como já combinado): subir o clipe no TikTok e **parar antes do Post** pra
  confirmação numa linha.

### Precisa do Miguel

- **Aprovar** cada clipe (assistindo no celular) e a música, se tiver música.
- **Gravar a voz** dos clipes de devlog (clipe 7, e opcionalmente o 1 e o 6): 2 ou 3 frases, no celular mesmo.
- **"Pode subir"** da 0.8.6 e dos patches de marketing (redirect, stats).
- **Contas:** criar e aquecer o Reddit (uma semana comentando antes de postar), recuperar o acesso ao LinkedIn,
  postar no HN e ficar respondendo 3–4 h, entrar nos Discords e ler as regras de cada um.
- **Clicar em Post** (ou autorizar numa linha) em tudo; fixar o comentário do TikTok pelo app.
- **Escolher os creators** e mandar o kit da própria conta (DM de dev pra creator funciona melhor que de bot).
- Decidir o **prêmio do desafio**: nome nas Novidades (sem custo) e, se quiser, o título exclusivo por código.
- Passar os números do TikTok (views, seguidores, de onde veio o tráfego) toda segunda: o Claude não consegue
  vê-los sem abrir o navegador.

---

## Fontes

- presskit.gg, TikTok para indie: https://presskit.gg/field-guides/tiktok-indie-game-marketing
- presskit.gg, Reddit para indie: https://presskit.gg/field-guides/reddit-marketing-indie-games
- bugnet.io, TikTok marketing: https://bugnet.io/blog/tiktok-marketing-for-indie-games
- StraySpark, build in public: https://www.strayspark.studio/blog/devlog-marketing-build-wishlists
- Insider Gaming (fórum), TikTok de jogos: https://insider-gaming.com/forum/threads/how-are-you-using-tiktok-to-share-gaming-content-tips-ideas-or-lessons-learned.3116/latest
- Phaser sobre o PokeRogue: https://www.phaser.io/news/2024/06/pokerogue
- Dot Esports, PokeRogue: https://dotesports.com/pokemon/news/pokerogue-creator-walks-away-from-viral-pokemon-project-after-adding-an-ending
- Millenium, PokeRogue na França: https://www.millenium.org/news/413327.html
- Wordle: https://siliconrepublic.com/?p=957516 · https://www.nintendolife.com/news/2022/01/random-heard-of-wordle-now-theres-a-pokemon-version
- Infinite Craft: https://knowyourmeme.com/memes/sites/infinite-craft
- Realistic Pokémon team trend: https://knowyourmeme.com/memes/realistic-pokemon-team-trend
- Magikarp-only: https://techraptor.net/content/man-beat-pokemon-sunmoon-magikarp
- r/indiegames (regras 2024, via redlib): https://redlib.belloworld.it/r/indiegames
- Reddit sem ban: https://www.steampageanalyzer.com/blog/reddit-indie-game-marketing · https://toucharcade.com/community/threads/reddit-advice-for-an-indie-dev.273028/
- Show HN: https://news.ycombinator.com/showhn.html · https://www.lucasfcosta.com/blog/hn-launch · https://www.indiehackers.com/@vbordo/from-failed-launch-to-going-viral-on-hacker-news-bdd734e742
- TabNews: https://tabnews.com.br/faq · https://www.tabnews.com.br/wellingtonpragidi/como-utilizar-o-tabnews-como-devlog-para-projetos-open-source-sem-ferir-as-regras-da-plataforma
- Relic Castle (2024): https://videogameschronicle.com/news/pokemon-fan-game-repository-taken-down-by-a-reported-dmca-notice · https://80.lv/articles/website-hosting-pok-mon-fan-games-has-been-taken-down/
- Pokémon Uranium: https://thewrap.com/pokemon-uranium-nintendo-go
- GameJolt (562 jogos): https://ggrecon.com/articles/hundreds-of-fan-made-pokemon-games-have-reportedly-been-culled
- Canaltech, FPS de Pokémon derrubado: https://canaltech.com.br/games/nintendo-derruba-jogo-de-tiro-de-pokemon-feito-por-fa-207357/
- Diretrizes da Nintendo para vídeo: https://www.nintendo.co.jp/networkservice_guideline/en/index.html
