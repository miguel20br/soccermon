---
description: Revisão de todos os textos do jogo em PT por blocos (inventário, verificador e propostas do bloco 1).
---

# Revisão dos textos do jogo (24/10/2026)

O Miguel acha os textos "meio estranhos, meio feitos de IA". A revisão vai por blocos, na ordem em que o jogador
vê: ele aprova um bloco, o Claude aplica (PT e EN juntos) e passa pro próximo. Nada foi alterado no jogo ainda.

Critérios: método de escrita do brand guide (§4), a memória "texto sem cara de IA" e a skill humanizer
("Signs of AI writing"): dois-pontos de anúncio, "não é X, é Y", trio por regra, par de enfeite ("rápido e
direto"), gerúndio pendurado, explicar o óbvio, palavra de sistema (save, visitante), travessão, mistura de
"pra" e "para".

## 1. Inventário por bloco

Contagem das strings PT do dicionário (`src/i18n/pt/*.ts`, achatado: cada texto, item de lista ou forma de
plural conta 1) mais os textos do motor que aparecem na tela (`MOVE_EXPLAIN` em `src/engine/moves.ts`, itens e
formações). Total: **3.551** (3.425 do dicionário + 126 do motor).

| # | Bloco | O que entra | Strings |
|---|---|---|---:|
| 1 | Home, menus e primeira visita | `home`, `common.ui`, fases (`common.stage*`), barra da conta (`settings.bar`), `account` (juntar saves, copa guardada), cartões da Home (Copa do Dia, Liga, Duelo), passo a passo de boas-vindas, tela de Ajuda (busca), `bracket` | 205 |
| 2 | Draft, escalação e cartas | `team` (draft, escalação, carta, painel), posições, atributos, formações, táticas, escanteio, vínculos (`common.link`), corpo do Pokémon | 376 |
| 3 | Partida: HUD, técnico e letreiros | `match` (menos líderes), `battle` (letreiros e pops em quadra) | 372 |
| 4 | Narração | `commentary` | 160 |
| 5 | Resultado, recompensa e Mercado | `result`, `reward` (inclui MTs), `shop`, `moments` (clipes) | 319 |
| 6 | Golpes, itens e efeitos | `MOVE_EXPLAIN` (94), Golpedex (`stats.lab`), status, tipos, itens, bônus (`common.mod`); o texto gerado de `src/i18n/move-text.ts` vai junto | 278 |
| 7 | Rota Índigo, líderes e história | `longCup`, falas dos líderes (`match.leaders`), cenas do Modo história (`src/i18n/story.ts`, 11) | 241 |
| 8 | Ajuda e dicas do técnico | `help` (seções, perguntas frequentes, balões do técnico) | 283 |
| 9 | Perfil, coleção e troféus | `profile` (clube, Pokédex, álbum, missões, medalhas, títulos), `trophies`, `title`, `stats`, raridade e acabamento | 838 |
| 10 | Duelo, Liga e amigos | `duel`, `liga` (menos o cartão da Home), `friends` | 351 |
| 11 | Configurações, créditos e erros | `settings` (menos a barra), créditos, tela de erro, importar e exportar | 139 |

**Fora do i18n** (strings soltas em `src/ui`): quase tudo é ferramenta de dev (`?lab=posicoes`, `?cards=1`,
galerias e laboratórios, ~95 strings) e fica fora. As que o jogador vê são nomes: tipos em
`type-colors.ts` (18), raridades em `rarity.ts` (~10), o título da aba em `settings-sync.ts` e 3 erros do
simulador em `sim-client.ts`. Entram nos blocos 6, 9, 1 e 11.

**Novidades** (`src/ui/patch-notes.ts`, 90 versões) ficam fora: é histórico, revisado a cada lançamento.

## 2. Resultado do verificador

### `copy_ia.py` (todos os `src/i18n/pt/*.ts`, `story.ts`, `move-text.ts` e os textos do motor)

12 achados, só 4 reais. O verificador pega o tique mecânico; o que soa estranho no jogo é de estrutura.

| Bloco | Achado | Situação |
|---|---|---|
| 2 | `team.lineup.title`: "Escalação — {team}" | travessão, trocar por "·" |
| 3 | `match.reload`: "A quadra não carregou — recarregar" | travessão |
| 3 | `match.agency.maxWaitHint`: "próximo nível" | falso: é o nível do golpe máximo |
| 4 | `commentary.timeDraw`: "Fim de jogo! {score} — vamos para os pênaltis!" | travessão |
| 5 | `result.shareText`: emoji 🏆 (2) | pode: é texto de Compartilhar |
| 9 | `trophies.nextLevel`: "Próximo nível" | falso: nível da taça |
| 11 | `settings.credits.pmd`: travessão no meio dos créditos | travessão |
| motor | 4 em comentários de código | falso |

### Filtro da humanizer (script no scratchpad, adaptado pro PT)

Sinais por bloco. É filtro grosso: dois-pontos de rótulo ("Dica:") e explicação longa na Ajuda contam também. O
número real sai na leitura de cada bloco.

| # | Bloco | Sinais | O que mais aparece |
|---|---|---:|---|
| 1 | Home e menus | 33 | mais de 12 palavras 9, trio 8, "para" 5, palavra de anúncio 3, dois-pontos 3, negrito 3 |
| 2 | Draft e escalação | 66 | "para" 16, dois-pontos 15, trio 13, mais de 12 palavras 11, "sem X" 6, "clássico/sólido e direto" nas formações |
| 3 | Partida | 28 | dois-pontos 10, "para" 7, mais de 12 palavras 6, "Parabéns! … evoluiu!" |
| 4 | Narração | 40 | exclamação dupla 16, "para" 13, dois-pontos 5, "clássico!" |
| 5 | Resultado e Mercado | 22 | mais de 12 palavras 8, dois-pontos 5, "em vez de" 5 |
| 6 | Golpes e itens | 177 | mais de 12 palavras 77, dois-pontos 76 (quase todo `MOVE_EXPLAIN` é "Rótulo: regra; regra.") |
| 7 | Rota Índigo e líderes | 36 | exclamação dupla 20 (falas dos líderes; parte é fala de personagem e pode), mais de 12 palavras 8 |
| 8 | Ajuda | 192 | mais de 12 palavras 93, trio 31, negrito 30, dois-pontos 28 |
| 9 | Perfil e troféus | 54 | dois-pontos 17, mais de 12 palavras 15, trio 14 |
| 10 | Duelo, Liga e amigos | 49 | mais de 12 palavras 25, dois-pontos 20 |
| 11 | Configurações | 25 | trio 9, mais de 12 palavras 6, "para" 4 |

Padrões que se repetem no jogo todo (valem pros próximos blocos):

- **"para" e "pra" misturados**, às vezes na mesma tela ("Não deu para salvar…" ao lado de "Não deu pra abrir…").
  Proposta: "pra" em todo texto de jogo; "para" só no aviso legal e nos créditos.
- **"Rótulo: explicação"** em fila (golpes, dicas do intervalo, formações). Um ou outro é rótulo; em fila vira tique.
- **Par de enfeite** no fim da frase: "rápido e direto", "Sólido e direto", "Equilíbrio clássico".
- **Palavra de sistema**: save, progresso de visitante.

## 3. Bloco 1: Home, menus e primeira visita (205 strings)

Só onde há melhora real. PT; o EN acompanha depois do ok.

| Chave | Texto atual | Proposta | Por quê |
|---|---|---|---|
| `home.soon[1].text` | O time da temporada, montado abrindo pacotes | Abra pacotes e monte o time da temporada | gerúndio pendurado ("montado abrindo"), frase de catálogo |
| `home.eventText` | Cartas Evento do tipo {type} podem aparecer no draft. | Cartas Evento de {type} podem sair no draft. | repete "tipo" do título logo antes ("Semana do tipo Fogo"); no draft o jogo diz "saem", não "aparecem" |
| `home.quickCup.line` | Mata-mata de 4 jogos, rápido e direto. | Mata-mata das oitavas à final. | "rápido e direto" é par de enfeite (linguagem de venda); "4 jogos" já está na etiqueta do lado |
| `home.tiles.news[0]` e `home.news` | Notas da versão | Novidades | tradução de "patch notes", cara de programa; é o nome que o próprio projeto usa |
| `help.screen.tipsBack` | Dicas de volta nas telas | As dicas voltaram | frase sem verbo, ordem estranha |
| `help.onboarding.welcomeText` | Os **151 de Kanto** num futsal 5 contra 5. Monte o time e ganhe a copa. | Os **151 de Kanto** jogando futsal 5 contra 5. Monte o time e ganhe a copa. | "num futsal" soa traduzido |
| `settings.bar.error` | Não deu para salvar na nuvem (o jogo continua salvo neste aparelho) | Não deu pra salvar na nuvem. Neste aparelho está salvo. | parêntese explicativo; "para" do lado do "pra" do aviso seguinte |
| `liga.home.dailyDone` | Ver o dia | Ver resultado | vago: o botão abre o resultado da Copa do Dia que você já jogou |
| `liga.home.ligaClosed` | A Liga abre quando tiver mais gente jogando. Enquanto isso, a Copa do Dia tem ranking todo dia. | Enquanto a Liga não abre, a Copa do Dia tem ranking. | 17 palavras; "Dia… todo dia" repete; "quando tiver mais gente" contradiz a contagem logo abaixo ("Abre em 37d"). **Decisão sua:** se o motivo deve aparecer, fica a primeira frase |
| `duel.line` | Desafie um amigo ao vivo: mande o link e joguem juntos | Mande o link pra um amigo e joguem ao vivo | dois-pontos de anúncio; "desafie" e "joguem juntos" dizem a mesma coisa |
| `account.bring.title` e `account.bring.yes` | Levar seu progresso para a conta? / Levar para a conta | Levar seu progresso pra conta? / Levar pra conta | "pra" como o resto da tela |
| `account.bring.text` | Você entrou com o Google. Este aparelho tem progresso de visitante: | Você entrou com o Google. Este aparelho tem um jogo salvo sem conta: | "progresso de visitante" é palavra de sistema |
| `account.merge.text` | Sua conta já tem um save, e este aparelho tem progresso de visitante. | Sua conta já tem um jogo salvo, e este aparelho tem outro. | "save" e "visitante" |
| `account.best` | Recordes e Pokédex juntam o melhor dos dois. | Recordes e Pokédex ficam com o melhor dos dois. | "juntam o melhor" é frase feita e não diz o que acontece |
| `account.parkedNote` | A outra fica guardada na tela inicial para você retomar quando quiser. | A outra fica guardada na tela inicial. | explica o óbvio |
| `account.otherAccount` | Este aparelho tinha o save de outra conta; ele continua guardado nela. | Este aparelho tinha o jogo de outra conta. Ele continua salvo nela. | ponto e vírgula e "save" |

### Strings sem uso (apagar em PT e EN, em vez de revisar)

Conferido com busca no código: nenhuma tela lê estas chaves.

- `home.rec.*` (6): título, copa, perfeita, destaque, evolução, ícone.
- `home.tiles.*[1]`, os subtítulos dos atalhos (6), e `home.tiles.moves` (2). A Home só mostra o nome
  (`[0]`). Inclui "Ideia, elogio ou bug: conta pra gente".
- `profile.quick.*` (3): Copas, Títulos, Gols.

### Ficam como estão

- `home.tagline` ("Monte seu time com os 151 de Kanto e ganhe a Copa de Futsal."): é o exemplo de texto bom do
  próprio `copy_ia.py`.
- `help.onboarding.draftText` ("Não gostou? **Sorteie de novo**."): pergunta e resposta, mas é fala natural.
- `home.confirmNew`, `account.confirmDiscard` ("Ela some de vez."), "Bora jogar", "Vem aí", `home.longCup.line`.
- Subtítulos das portas ("Taças, medalhas e números", "Pokédex, Álbum e Golpedex"): são trios, mas repetem as
  abas de cada tela.
- `home.disclaimer`: aviso legal, fica formal.
