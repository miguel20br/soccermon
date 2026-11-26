---
description: Proposta (16/11/2026) da decoração e do conteúdo de Natal do Soccermon: visual por ambiente, Copa do Dia de Natal, desafio comunitário, calendário em segundas, referências e 3 opções. Só proposta, nada de código.
---

# Natal no Soccermon (proposta de 16/11/2026)

Só proposta: nenhum código mexido, nada postado. O que já está decidido vem de `calendario.md`, `crescimento.md`,
`ultimate-team.md` e da pauta do Pallet FC; o que é novo está marcado como **proposta**.

## Resumo

- **Recomendação: opção B.** Decoração por data (liga 11/12, desliga 06/01), com neve nos 5 ambientes, gorro no
  Pokémon da Home, letreiro e título; Copa do Dia de Natal (24 e 25/12); desafio comunitário com prêmio na conta.
  Música de Natal e push opt-in entram junto.
- **A estrutura de tema por data já está sendo feita** no tema "neon" (19 a 22/11, branch `tema-neon`, outro agente).
  O Natal **reaproveita o mesmo liga/desliga por data** e só troca o conteúdo: não criar segundo mecanismo. (A branch
  ainda não tinha o tema quando olhei, só conserto de celular; o desenho exato do mecanismo eu não vi. Antes de
  codar, ler o que o neon deixou.)
- **Código na segunda 07/12, decoração liga sozinha na sexta 11/12.** O evento do Time Ultimate já liga sozinho em
  07/12 (`EVENTS`, `natal-2026`; adiantado de 15/12 pelo Miguel em 26/11, junto com o Desafio de Natal). A semana 14/12 serve pro desafio comunitário e o push.
- O Natal do Time Ultimate **já existe**: cartas Evento de Gelo (1 em 12 por carta), 3 objetivos, enfeite "Natal" no
  Perfil, pick de Evento. Esta proposta é a camada de fora (cara do jogo, Copa do Dia, comunidade), não mexe nisso.

## 1. O que muda no visual

Regras que valem pra tudo: sem emoji (ícones desenhados em SVG ou Phaser), tudo entra e sai com transição de
200 a 300 ms (a neve aparece em fade, não pula), nada de efeito que mude o resultado da partida, e o motor não é
tocado (neve do campo é só camada da cena, sem `Rng` do motor).

| Item | O que seria | Custo | Risco |
|---|---|---|---|
| **Neve nos 5 ambientes** (Laboratório, Rota, Estádio, Arena, Sede) | uma camada de flocos em CSS (2 ou 3 tamanhos, 20 a 30 flocos, `transform` só) por cima do fundo de cada ambiente, em `ambientes.css` / `Backdrops.tsx`. Sem imagem nova | **barato** (1 dia) | baixo; respeitar `prefers-reduced-motion` e o modo fumaça |
| **Luzes** (fio de pisca-pisca) | faixa SVG no topo de cada ambiente, com 4 cores da marca piscando em ciclo lento. Estádio: no teto das arquibancadas | **barato a médio** (1 dia pros 5) | baixo; não pode brigar com o letreiro nem cobrir botão |
| **Gorro nos Pokémon da Home** | gorro vermelho desenhado (SVG) ancorado na cabeça do sprite clássico, em `FieldSprite.tsx`. Cada espécie precisa de uma âncora (x, y, escala); começa pelos que aparecem mais (capitão, os 5 do clube) e cai pra "sem gorro" se não tem âncora. Só no clube do jogador, no máximo 1 ou 2 por ambiente | **médio** (2 a 3 dias; âncora é o trabalho) | médio: sprites têm formatos esquisitos (Magikarp, Gastly, Onix). Regra: sem âncora revisada, sem gorro. `sprite-scale.ts` já tem escala por espécie, dá pra pegar carona |
| **Gorro no campo da partida** | **proposta: não.** Sprite de campo é pequeno, anda e vira; o gorro viraria mancha, custa âncora por frame e confunde quem é quem (cor do time!). No máximo o capitão na entrada do Walkout e no pódio | cheio pra pouco ganho | alto (legibilidade do time) |
| **Letreiro de LED do Estádio** | o letreiro já escreve texto (`led` em `Estadio.tsx`, a Copa do Dia escreve o dia). Na fase de Natal ele alterna "FELIZ NATAL" / contagem pro dia 25 / "META DA COMUNIDADE 62%". Só texto e uma moldura de pisca-pisca | **barato** (meio dia) | baixo. Texto direto, sem metáfora |
| **Campo da partida com neve leve** | partículas Phaser lentas no `MatchScene` (poucas, brancas, atrás dos Pokémon, opacidade baixa) e o cinza-azulado do chão 5% mais frio. Nada cobre a bola. Em Copa, Copa do Dia e UT; no Duelo e na Liga **não** (mesma tela dos dois lados, evitar diferença entre aparelhos) | **médio** (1 a 2 dias, com print em 390 e 1440) | médio: desempenho no celular fraco. Teto de 40 partículas e desliga sozinho abaixo de X fps |
| **Tela final de título** (Campeão) | trocar o confete por mistura de confete e neve, faixa "Campeão de Natal" só durante o evento, troféu continua igual (regra do Miguel: troféu só no título) | **barato** | baixo |
| **Título do jogo / splash** | logo com gorrinho no "O" ou neve acumulada na letra. Mexer na logo é marca: passa pela skill `soccermon-marca` e pelo Miguel | **médio** (arte) | médio: logo é identidade, só com ok |
| **Cartas** | nenhuma mudança: Evento de Gelo já existe e visual de carta só com ok dele | zero | zero |

**Barato = neve, luzes, letreiro, fim de partida, texto.** **Caro = gorro (âncoras), logo, neve do campo.** A decoração
inteira cabe numa versão só se o gorro ficar limitado à Home e a logo ficar de fora.

### O que reaproveitar

- **Liga/desliga por data:** o mecanismo do tema neon. Proposta de forma: uma lista de temas
  `{ id, start, end, classe }` e uma classe no `<html>` (`tema-natal`) que o CSS usa; o dev ganha um parâmetro
  (`?tema=natal`) igual ao `?utnow=` do Time Ultimate, pra testar sem mudar o relógio. Datas em horário de Brasília
  (`brt(...)`, igual `EVENTS`).
- **"Semana do tipo"** (`news.ts`, `home-motion.css`): mostra que o jogo já tem faixa temática semanal com reflexo.
  O Natal pode cair como "Semana do tipo Gelo" nas semanas do evento, com a faixa e a pauta de tipo de graça.
- **Música:** skill `soccermon-musica` já prevê Natal com melodia de domínio público; `pesquisas/musica.md` tem "Natal
  v2" (valsa nossa + "Noite Feliz", Gruber, 1818) e "Natal na Sala" (nossa, sem citar canção). Só falta ligar no
  menu por data. O Miguel já aprovou o gosto (romântica, domínio público).

## 2. Conteúdo jogável (sem dinheiro, sem sorteio)

### 2.1 Copa do Dia de Natal (24 e 25/12)

Já aprovada em 08/11 (rivais de Gelo). Proposta de detalhe:

- Mesma Copa do Dia de sempre (mesma seed pra todo mundo, número do dia, Compartilhar), só que o sorteio de rivais
  sai da lista de Gelo: **Articuno, Lapras, Dewgong, Cloyster, Seel** e capitão **Snorlax** (de gorro) na final. Jynx
  fica fora, Delibird nem existe em Kanto.
- Letreiro do Estádio escreve "COPA DE NATAL 24/12". Nada de Mercado (regra dos modos arcade: só recompensa 1 de 3).
- **Recompensa:** título "Natal 2026" (cosmético) pra quem ganha a Copa nos dois dias; carta Evento garantida no
  1 de 3 da recompensa só no dia 25 (se a Copa do Dia já tiver pick, é só trocar a lista de opções). Se mexer em
  quantidade de recompensa, avisar o Miguel, é equilíbrio.
- Dois dias seguidos de Copa de Natal puxa retenção (quem joga dia 24 volta dia 25), e o push opt-in do dia 24 é o
  momento certo.

### 2.2 Desafio comunitário (meta somada de gols)

O Miguel decidiu: prêmio **na conta do jogador**, não por código. Desenho proposto:

- **Meta somada de gols** de todos, de 15/12 a 05/01. Escada em 3 degraus (barra única com 3 marcas), assim o
  primeiro degrau é quase certo e o último é esticado. Ex.: 1º degrau enfeite no Perfil, 2º título "Natal 2026",
  3º 1 Pacote Mini de Evento. **Calibrar com o `npm run stats`** (gols por dia dos últimos 30 dias, pico estimado):
  não achei número de gols total agora, então não chuto a meta aqui. Regra de bolso: marcar o 3º degrau em ~60% do
  que a base atual faria se todos jogassem no pico, pra a barra fechar sem dar de graça.
- **Quem ganha:** quem marcou pelo menos 1 gol no evento (ajuda a meta, nada de prêmio pra quem entrou só pra ver).
  A meta bate, o jogo abre o prêmio na conta na próxima vez que a pessoa entrar. Sem código, sem sorteio.
- **Onde fica a conta:** tabela agregada no Supabase (uma linha por dia com a soma de gols), cliente manda o total
  da partida **terminada**, validado pelo mesmo caminho do placar (`game_events`). Precisa de migração em produção:
  **só com o ok do Miguel**. Sem Supabase (jogo local), o desafio aparece como "só online" e o jogador pode
  seguir normal.
- **Anti-trapaça sem exagero:** teto de gols por conta por dia e por partida (o motor já limita), conta que passa
  do teto não entra na soma. Não vale blindar mais: o prêmio é cosmético e o Supabase grátis não aguenta um
  sistema pesado.
- **Visibilidade:** barra no Estádio (letreiro do LED), faixa pequena na Home, e a pauta de segunda do News
  mostra "faltam X gols pro 2º degrau". Fica melhor que "vença 25 partidas" porque todo mundo ajuda, até quem só
  joga uma Copa do Dia.
- **Risco real:** com ~40 a 58 sessões por dia (números de 01 a 07/11 do `crescimento.md`), a meta pode ficar
  parada e dar cara de jogo vazio. Dois remédios: degraus baixos, e mostrar "você marcou N gols" junto da barra, pro
  jogador sentir contribuição mesmo com a barra devagar.

### 2.3 Figurinha ou título de Natal

- **Título "Natal 2026"** (cosmético, nome em PT-BR direto, igual aos títulos do jogo): vira troféu do Natal; a
  mecânica de título por código já existe, aqui sai por conquista. Código nunca no repo (regra do projeto).
- **Figurinha:** o jogo não tem sistema de figurinha hoje. Não inventar um só pro Natal. Se fizerem, usar o Álbum
  que já existe: uma página "Natal 2026" com 5 casas (Lapras, Articuno, Snorlax, Seel/Dewgong, Cloyster) que enchem
  quando você pega a carta Evento da espécie. Isso reaproveita o pacote Evento. Proposta como **extra** da opção C.

### 2.4 Pokémon do evento (só Kanto)

| Pokémon | Papel | Observação |
|---|---|---|
| **Lapras** | capitão do Gelo na Copa do Dia de Natal; carta Evento "símbolo" | trenó, o mais "natalino" da lista |
| **Articuno** | chefe da Copa do Dia no dia 25 (lendário, final) | só vale se o motor e o Mercado não tiverem que mudar |
| **Snorlax de gorro** | mascote da Home e da pauta (já é o herói do Pallet FC) | combina com o episódio 23 ("só o Snorlax fica quentinho") |
| **Seel e Dewgong** | rivais comuns nas fases iniciais | evolução natural, serve pra vitrine |
| **Cloyster** | rival de defesa | casca vira bola de neve |
| **Ditto** | "árvore de Natal" (arte, não jogo) | já é o plano do ep. 26 |
| ~~Jynx~~ | fora | design polêmico, regra do Miguel |
| ~~Delibird~~ | fora | Gen 2 |

Nada de "sorteio por carta" além do que o Time Ultimate já faz. Nenhuma espécie nova entra no motor, nenhum
atributo muda: Evento é só pintura de Gelo +2, como já está.

## 3. Calendário

Atualização toda segunda. Segundas possíveis: 23/11, 30/11, **07/12**, **14/12**, 21/12, 28/12, 04/01. O UT abre
27/11 e a Liga em 12/01 (terça).

| Quando (Brasília) | O que sai | Fonte |
|---|---|---|
| seg 23/11 e 30/11 | pós-UT (conserto e polimento). Nada de Natal no jogo | `calendario.md` |
| **seg 07/12** | **versão de Natal**: decoração, música de Natal, Copa do Dia de Natal e o desafio comunitário **dormindo** (tudo atrás de data, nada visível). Prévia na Vercel com `?tema=natal` pro Miguel jogar | "pode subir" |
| sex 11/12 | decoração liga sozinha, 00:00 (neve, luzes, letreiro, gorro na Home) | casa com o ep. 22 do Pallet FC ("a neve chegou") |
| seg 14/12 | segunda **leve**: ajuste do que o Miguel viu na prévia, push opt-in, texto das Novidades | `crescimento.md`: push estreia no Natal |
| ter 15/12 | evento do Time Ultimate liga sozinho (cartas Evento, objetivos), **desafio comunitário abre** | `EVENTS` já na main |
| seg 21/12 | só conserto (evento rodando, ninguém mexe no que está ao vivo) | |
| qui 24/12 e sex 25/12 | Copa do Dia de Natal, push nos dois dias | já aprovado |
| seg 28/12 | segunda de conserto + "balanço do Natal" no News | |
| ter 05/01 23:59 | evento do UT e desafio fecham | `EVENTS.end` |
| **qua 06/01 00:00** (Dia de Reis) | decoração desliga sozinha, música volta pro padrão | proposta |
| seg 04/01 e 11/01 | limpar o que sobrou, preparar a Liga (12/01) | |

Observação: ligar a decoração em 11/12 e não 07/12 deixa a versão de segunda sem risco de "o jogo tem neve antes
do UT ter uma semana". Se o Miguel quiser a neve mais cedo, é só trocar a data do tema.

### News e vídeos

- **News de segunda:** 07/12 "Natal chegando: o que muda"; 14/12 "O desafio da comunidade"; 21/12 "Natal na
  Copa do Dia"; 28/12 balanço (gols somados, quem fechou a meta, quantos jogaram).
- **Vestiário de Natal (Pallet FC):** já existe o roteiro em `docs/marketing/pallet-fc-temporada-1.md` (itens 22 a
  29). Nada novo a propor, só garantir que cada episódio no ar tenha **a coisa correspondente no jogo** no mesmo
  dia: 11/12 neve, 15/12 carta de Gelo, 24/12 Copa do Dia. Capa estática do evento (item do mesmo doc) vira o
  banner do desafio.
- **Clipe de jogo (TikTok/Reels):** trailerzinho 9:16 da neve no Estádio com a barra do desafio enchendo, 7 a 10 s,
  para 14/12.

## 4. Referências

Escrito a partir do que conheço dos eventos; **não reabri as páginas hoje** (sem busca na web nesta rodada), então
os links são das fontes oficiais e podem ter mudado. Conferir antes de citar publicamente.

| Jogo | O que faz no Natal | Funciona | Cansa |
|---|---|---|---|
| **Pokémon GO** (Holiday Event, dezembro) | Pokémon com gorro (Pikachu, Eevee), Delibird e Articuno no foco, bônus de dia e uma Pesquisa Cronometrada com narrativa | gorro vira colecionável e vira print; bônus em data certa dá motivo pra voltar | texto longo, dois eventos seguidos de 2 semanas; "tem que logar todo dia" |
| **PokéRogue** | eventos sazonais com bônus de espécies e shiny em janela de dias (mantidos pela comunidade e pelo Discord) | janela curta e clara, um destaque por vez | retrabalho de balanceamento a cada janela |
| **Clash Royale** | temporada de Natal com arena e skins de neve, desafio de tempo limitado com prêmio grátis | uma "arena" nova muda o clima sem mudar a regra; desafio com prêmio tira o jogador casual do medo de competição | skins pagas e sensação de "tudo é venda" (aqui não vale: sem dinheiro) |
| **Rocket League** | Frosty Fest, bola de hóquei (Snow Day), itens de Natal grátis por jogar | **modo de jogo novo em 1 playlist, mas igual no controle** (a bola vira disco): é o que mais gruda; itens grátis por jogar | evento anual repetido sem novidade, caixas pagas |
| **Balatro** | (não tem evento de Natal fixo; usei como referência de "cara de jogo", o jogo usa colaborações e atualizações com tema, sem calendário) | personalidade forte de UI, sem barulho de evento | não serve de modelo de calendário |

**O que levar:**

1. **Uma coisa que muda a sensação, não a regra** (Rocket League, Clash): neve, música, gorro. É o que o Soccermon
   faz de barato.
2. **Janela curta e legível** (PokéRogue, GO): 15/12 a 05/01 com 3 degraus. Não encher de 10 missões.
3. **Gorro como colecionável** (GO): vira print, vira post, vira divulgação grátis. Em Kanto isso vale mais que um
   Pokémon novo.
4. **Meta comunitária com degraus** (GO tem metas globais em eventos grandes): o jogador contribui sem competir.

**O que evitar:**

- Evento mais longo que a atenção (3 semanas é o teto, o Miguel já fixou 2 a 3).
- Loja de skin e caixa (já proibido pelo ADR 0006).
- Tudo ao mesmo tempo no dia 1: o jogador não vê a neve se o menu tem 5 selos novos.
- Tratar o Natal como desculpa pra mudar equilíbrio.

## Opções

| | A. Neve e música | **B. Neve + Copa de Natal + desafio** | C. Natal rico |
|---|---|---|---|
| **Visual** | neve, luzes, letreiro, música, tela de campeão | A + gorro nos Pokémon da Home + neve leve no campo da partida | B + logo com gorrinho + Álbum "Natal 2026" |
| **Jogável** | Copa do Dia de Natal (24 e 25) | A + desafio comunitário com prêmio na conta | B + título e Álbum de Natal |
| **Push opt-in** | não | sim (estreia) | sim |
| **Esforço** | ~3 a 4 dias | ~7 a 9 dias (1 semana + ajuste) | ~12 a 14 dias |
| **Risco** | baixo | médio (Supabase em produção, desempenho da neve) | alto: logo, Álbum novo, tudo na mesma segunda |
| **Entrega** | seg 07/12 | seg 07/12 (visual) + seg 14/12 (desafio e push) | só dá se começar já; senão desliza pra 21/12 |

**Recomendação: B**, por segunda. Visual em 07/12 (dormindo, liga em 11/12), desafio e push em 14/12, tudo no ar
em 15/12 com o evento do UT. A é o plano de contingência: se o desafio ou a migração Supabase atrasar, o Natal sai
sem ele e ninguém vê buraco. C só se o Miguel aprovar logo e abrir mão de "versão menos frequente, revisão dupla".

## Decisões pro Miguel

Recomendação primeiro; respondo no que aprovar.

1. **Opção B?** Sim. A como plano B se o desafio atrasar.
2. **Decoração liga em 11/12 (sexta) e desliga 06/01?** Sim: casa com o ep. 22 do Pallet FC e com o Dia de Reis.
3. **Gorro só na Home (não no campo da partida)?** Sim, só Home e no capitão do Walkout/pódio. No campo vira
   mancha e confunde o time.
4. **Desafio comunitário: prêmio em 3 degraus (enfeite, título, pacote Mini de Evento) e só pra quem marcou pelo
   menos 1 gol?** Sim. Aprovar também a **migração de produção** (uma tabela de soma por dia no Supabase).
5. **Meta:** deixo eu calibrar com o `npm run stats` e te mostro os 3 números antes de subir? Sim.
6. **Copa do Dia de Natal: Snorlax de capitão, rivais Lapras, Articuno, Dewgong, Cloyster, Seel, título "Natal 2026"
   pra quem ganha os dois dias?** Sim. Jynx e Delibird fora.
7. **Música:** liga "Natal na Sala" (nossa) no menu ou a valsa com "Noite Feliz"? Recomendo "Noite Feliz" (domínio
   público, valsa que você já aprovou) no menu e a nossa na Sala.
8. **Logo com gorrinho:** fica de fora nesta rodada? Sim (marca só com seu ok e arte pronta).
9. **Push opt-in no Natal:** sim, no máximo 1 por dia, só 15/12, 24/12 e 25/12 (já aprovado em `crescimento.md`).

## Fontes

Não reabri todas hoje; conferir antes de citar.

- Nossos docs: `docs/planos/calendario.md`, `docs/planos/crescimento.md`, `docs/planos/ultimate-team.md`,
  `docs/planos/animacoes-novas.md` (C6, datas), `docs/planos/pesquisas/musica.md`, `docs/marketing/pallet-fc-temporada-1.md`,
  `src/store/ultimate/rules.ts` (`EVENTS`, `natal-2026`), `src/ui/ambientes/Estadio.tsx` (letreiro), `src/ui/news.ts`
  (Semana do tipo).
- Pokémon GO, eventos e notícias: https://pokemongo.com/news
- PokéRogue (jogo e Discord): https://pokerogue.net
- Clash Royale, notícias das temporadas: https://supercell.com/en/games/clashroyale/
- Rocket League, eventos sazonais (Frosty Fest): https://www.rocketleague.com/news
- Balatro (referência de identidade de UI): https://www.playbalatro.com

## Decidido com o Miguel (16/11/2026)

- **Opções A, B e C juntas.** "Amo o Natal e quero fazer isso acontecer."
- **Versão de Natal perto de 30/11**, a segunda depois da estreia do Time Ultimate, pra cobrir dezembro inteiro. Proposta: decoração de 30/11 a 06/01. As datas de dentro continuam: desafio, Copa de Natal em 24 e 25/12 e evento do UT.
- **O título "Natal 2026" tem efeito de gelo.**
- **Itens 3 a 9 aprovados:**
  - gorro só na Home e no pódio;
  - desafio com 3 degraus e a tabela nova no Supabase de produção;
  - meta calibrada e mostrada antes de valer;
  - Copa de Natal com o Snorlax de capitão e rivais de gelo;
  - "Noite Feliz" no menu e a nossa na Sala;
  - logo com gorrinho (entra, pela opção C);
  - push em 15, 24 e 25/12.
- **Antes do Álbum "Natal 2026"** o Miguel quer lançar o "Soccermon Songs vol. 1". Falta confirmar se é álbum de músicas ou de figurinhas.
- **Pedido junto:** revamp do Perfil do jogador. O seletor de título está "super primitivo", e há outras features atrasadas.

## Plano técnico do desafio comunitário (24/11/2026, sem código)

Precisa de uma migração e de uma Edge Function, as duas só com o ok do Miguel: nada foi criado. Tabela `natal_gols(dia date primary key, gols bigint not null default 0)` mais `natal_marcou(user_id uuid, dia date, gols int, primary key (user_id, dia))`, com RLS (cada um lê e escreve só a própria linha de `natal_marcou`; `natal_gols` só leitura pública). Ao fim de cada partida terminada entre 15/12 e 05/01 o cliente chama uma RPC `natal_gols_somar(gols)` (security definer) que limita os gols ao teto por partida e por conta por dia, grava em `natal_marcou` e soma a diferença em `natal_gols`; a barra do letreiro, da Home e do News lê `natal_gols` (uma linha por dia, soma no cliente, cache de 1 min). Quem tem `natal_marcou` com pelo menos 1 gol abre o prêmio do degrau batido na próxima entrada (enfeite, título `natal2026` via `redeemedTitles`, Pacote Mini de Evento), sem código. Sem Supabase o desafio aparece como "só online". As 3 metas saem do `npm run stats` e o Miguel vê antes de valer. Fora do repo: nada de segredo, e o jogo local segue igual.

## Desafio de Natal: implementado (25/11/2026, branch `feat-desafio-natal`)

O Miguel aprovou em 25/11 pra 0.10.0 e pediu **8 degraus com prêmios melhores**, tela de prêmio e painel informativo.
Datas: **07/12/2026 00:00 a 05/01/2027 23:59** (Brasília). Antes de abrir, a faixa mostra "Desafio de Natal abre em N
dias". `?desafio=aberto` força aberto no dev e nas prévias; `?utnow=2026-12-20` muda o relógio (o mesmo do Time Ultimate).

### Números da meta (constante única: `DEGRAUS` em `src/store/desafio-natal.ts`)

Conta com o `npm run stats -- --dias 30` e uma consulta de gols no mesmo banco (26/10 a 24/11):

- **Gols do jogador em 30 dias:** 42.313 (`gf` do `match_end`, só soccermon.com) = 1.410 por dia. Últimos 14 dias:
  13.678 = 977 por dia (o ritmo caiu depois do pico de fim de outubro).
- **Só conta Google soma.** As 52 contas com save na nuvem têm 24.069 gols na carreira, contra 56.493 gols de todo
  mundo desde 15/10 nos eventos: ~43% dos gols vêm de quem tem conta. Com desconto pelas contas de teste, **~40%**.
- **Base de 30 dias que soma:** 0,40 x 42.313 ≈ **16.900 gols**. Regra de bolso (60%): **10.000 no último degrau**.
- **1º degrau quase certo:** no ritmo devagar, quem tem conta faz ~390 gols por dia (977 x 0,4): **500** fecha em 1 a
  2 dias. O desafio, o Natal e o Time Ultimate puxam login, então a base deve subir; se a barra parar, baixar os
  números é trocar a constante.

| Degrau | Meta (gols) | Prêmio |
|---|---|---|
| 1 | 500 | Enfeite de Natal no cartão do Perfil |
| 2 | 1.000 | 300 Fichas |
| 3 | 2.000 | Pacote Mini de Evento (3 cartas, todas Evento de Natal) |
| 4 | 3.000 | Título "Natal 2026" (quem já ganhou na Copa de Natal não recebe de novo) |
| 5 | 4.500 | Pick de Natal (1 de 3 Evento, Prata ou melhor) |
| 6 | 6.000 | 2 Pacotes Grandes |
| 7 | 8.000 | Pick de Natal Ouro (1 de 3 Evento Ouro garantida) |
| 8 | 10.000 | Estrela de Natal (enfeite raro, dourado) + Pacote Grande de Evento |

### Como ficou

- **Quem ganha:** quem marcou pelo menos 1 gol no período (`natal_marcou`). O prêmio de cada degrau batido abre sozinho
  na próxima entrada, uma vez por save (`ultimate.gifts` com `desafio-natal-N`), só depois do save acertar com a nuvem,
  e até o fim da Temporada 1 do Time Ultimate (01/06/2027).
- **Contagem:** gols do jogador em toda partida terminada: Copa, Copa do Dia, Rota (o resultado da copa), Time Ultimate
  (Batalhas, líderes e Draft) e **Duelo** (partida nova e de agora; anulada não conta). `src/cloud/desafio.ts` chama a
  RPC `natal_gols_somar(gols)`. Sem login, sem Supabase ou offline: "Só online", e o jogo segue igual. A fila de envio é
  da aba (fechou sem rede, aquela partida não soma).
- **Anti-trapaça sem exagero:** 30 gols por partida, 300 gols e 200 partidas por conta por dia; o que passa não soma.
  Não usa o `game_events` (é anônimo, não dá pra cruzar com a conta).
- **Visibilidade:** faixa pequena no menu de modos (Home), faixa com cara de letreiro no Estádio, texto no LED da
  torcida, "você marcou N gols" junto da barra. Tocar abre o painel dos 8 degraus (prêmio desenhado, meta, batido /
  faltam X / bloqueado). Leitura com cache de 1 min; a soma vem por GET direto (sem o supabase-js na Home).
- **Tela de prêmio (`RewardReveal`):** cada prêmio grande no centro, um por vez, com o que é, por que ganhou, de onde
  veio e onde está. A mesma tela mostra o Presente de Natal do dia 25 e o título da Copa de Natal.
- **Pacote de Evento:** tipo novo de pacote no Time Ultimate (`evmini`/`evbig`, campos `evMini`/`evBig` no save, sem
  migração: save antigo lê 0), com a arte do Pick de Natal.

### Banco (não aplicado)

Migração `supabase/migrations/20261125120000_desafio_natal.sql`, testada num Postgres 17 puro com
`supabase/tests/desafio_natal.test.sql` (prazo, só conta Google, tetos, RLS, leitura pública). Depende de
`hoje_brasilia()` e `conta_google()` da migração da Copa do Dia (já no ar). **Aplicar em produção só com o ok do
Miguel**, no lançamento, da raiz do repo:

```bash
psql "$(grep '^POSTGRES_URL_NON_POOLING=' .env.local | cut -d= -f2- | tr -d '"')" -v ON_ERROR_STOP=1 \
    -f supabase/migrations/20261125120000_desafio_natal.sql
```

Sem a migração, o jogo mostra a barra como "Só online" e nada quebra.
