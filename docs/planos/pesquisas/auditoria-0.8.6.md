---
description: Auditoria headless do site na 0.8.6, com o que quebrou em cada tela.
---

# Auditoria do Soccermon 0.8.6 (branch int-086), 18/10/2026

Escopo: worktree `int-086` rodando no dev server (porta 8110), Playwright headless em 320x568, 390x844, 844x390
(deitado) e 1440x900. Comparação do primeiro carregamento com https://soccermon.com (0.8.5, sem login).
Nada foi editado no repo. Prints em `prints/` (caminhos abaixo são relativos a esta pasta:
`/tmp/claude-1000/-home-bartolomeu-Projects-soccermon/e1939d5f-03fc-4882-9c76-204a383245a2/scratchpad/auditoria-site/`).
Scripts usados: `s1-home.js` … `s9b.js` e `lib.js` na mesma pasta (dá pra rodar de novo).

**O que funcionou bem:** zero `pageerror`, zero `console.error` e zero 404 em todos os fluxos (fora o `?demo=crash`, que é
de propósito). Copa inteira nos 4 tamanhos, troca no intervalo (quem entrou aparece, a faixa some), prancheta ao vivo
(muda formação e troca vaga; entra em ~8 s de relógio a 1x), pênaltis, evolução sua e do rival ("RIVAL EVOLUIU!"),
escanteio, MT, campeão + Hall da Fama, restaurar `backup-v6-pt.json` (vira save atual, Hall com 2 títulos, treinadores
liberados), troca PT/EN sem texto sobrando, Duelo local em duas abas do draft ao fim (5 x 4, sem "Partida anulada"),
Esc fecha boas-vindas/carta/Novidades, "Reduzir movimento: seguir o aparelho" respeitado, aviso de saída no meio da
partida, copa guardada na Home ("Continuar"), aviso de erro do `ErrorBoundary`. FPS a olho (headless, GL por software):
57 a 60 fps a 1x e 8x, pior quadro 33 a 50 ms.

---

## 1. Bugs confirmados

### B1. Ajuda fica mais larga que a tela no celular (conteúdo cortado à direita) · gravidade ALTA
- Passos: celular 320 ou 390 → Home → Ajuda. O print sai com 400 px de largura; todos os painéis, a busca e títulos
  longos ("Golpes que fazem o que faziam…") ficam cortados na borda direita. Não aparece rolagem lateral porque o
  `html` tem `overflow-x: clip`, então o corte é silencioso.
- Causa: `.menu-screen` (`src/ui/styles.css:5592`) é `display: grid` sem `grid-template-columns`; a coluna implícita
  `auto` cresce até o min-content do filho mais largo, que é o `<input>` da busca (`src/ui/screens/Help.tsx:114`,
  largura intrínseca ~330 px com a fonte grande + ícone + padding = 388 px).
- Conserto (no lugar por onde todos passam): `grid-template-columns: minmax(0, 1fr)` em `.menu-screen` (vale pra Perfil,
  Configurações, Ajuda…) e `min-width: 0; width: 100%` no input da busca.
- Prints: `prints/60-ajuda-p320.png`, `prints/60-ajuda-p390.png`.

### B2. Painel do time na partida estoura a tela em 320 px com nome de time longo · gravidade MÉDIA
- Passos: 320x568, copa contra "Vermilion Voltagem" (ou qualquer rival de nome longo) → partida. A coluna "NOTA", o
  botão ▲ e as notas ficam cortados (documento com 337 px). Reproduzi trocando o texto da aba no `?demo=ditto`.
- Causa: `.team-panel` (`src/ui/styles.css:696`) é grid com coluna `auto`; as abas `.tp-tab` têm `white-space: nowrap`
  e o min-content delas (dois nomes de clube) empurra a coluna. O `min-width: 0` da aba não reduz a contribuição
  intrínseca.
- Conserto: `grid-template-columns: minmax(0, 1fr)` em `.team-panel` (o mesmo padrão do B1). Teste: um teste de
  layout headless em 320 com nome longo.
- Prints: `prints/23-partida-full-p320.png`, `prints/24-intervalo-full-p320.png`.

### B3. Barra de comparação com valor 0 mostra um risco colorido (o "Escanteios 0 x 0" da lista de pendências) · BAIXA
- Passos: resultado de qualquer partida → aba Times → linha Escanteios com 0 de um lado (ou 0 x 0).
- Causa: `.st-split i { min-width: 2px }` (`src/ui/styles.css:3888`) + `total = home + away || 1`
  (`src/ui/stats/StatsCharts.tsx:103`): com 0, a barra tem 0% mas o mínimo de 2 px desenha o risco; com 0 x 0 aparecem
  dois riscos.
- Conserto: não renderizar o `<i>` quando o valor é 0 (e, no 0 x 0, só a trilha neutra).
- Print: `prints/30-resultado-full-p390.png` (linha Escanteios 0 x 4).

### B4. "Média" do VERSUS não bate com a "Média dos titulares" do draft/escalação · MÉDIA (confunde)
- Passos: escalar alguém fora de posição (ex.: capitão Ala no gol, 52 · fora) → Jogar. A escalação/draft mostra
  "Média dos titulares: 57"; o VERSUS mostra 77.
- Causa: `src/ui/components/VersusIntro.tsx:109` usa `viewInstance(p).overall`; o draft usa a nota na vaga
  (`ratingAt`, `src/ui/screens/Draft.tsx:130`). A linha do rival na escalação ("Média 52") também usa `overall`.
- Conserto: usar a mesma conta (nota na vaga) nos dois lugares. Não mexe em equilíbrio, só no número exibido.
- Prints: `prints/14-draft-escolha-vaga-p390.png` × `prints/22-versus-pronto-p390.png`.

### B5. Número da barra de progresso ilegível nos cartões de treinador · BAIXA
- Passos: Perfil → Meu clube → grade de treinadores (ex.: Cientista "4/10", Prof. Carvalho Dourado "105/151").
- Causa: `.pf-mission-bar small` (`src/ui/profile/profile.css:323`) desenha o texto branco por cima do preenchimento
  amarelo; no cartão estreito o número cai em cima da parte preenchida.
- Conserto: número fora da barra (embaixo/ao lado) ou texto escuro sobre a parte amarela.
- Print: `prints/crop-progresso.png` (zoom de `prints/50-perfil-aba0-p390.png`).

### B6. Versão no rodapé diz v0.8.5 enquanto Novidades mostra 0.8.6 · BAIXA (checklist de lançamento)
- `package.json:4` ainda está em `0.8.5` (o rodapé e o `app_version` das estatísticas vêm dele). É o passo "suba
  `version`" do lançamento; só não esquecer, senão os eventos da 0.8.6 entram como 0.8.5 no placar.
- Print: `prints/02-home-full-p320.png` (selo "v0.8.6" e rodapé "v0.8.5").

### B7. "Ver resultado" fica fora da tela no celular em pé quando a partida acaba · MÉDIA (UX que parece travado)
- Passos: 390x844, partida até o apito final (ou pênaltis). O botão "Ver resultado" fica no grupo de controles, abaixo
  das táticas e do escanteio (y≈1040–1125 numa tela de 844). Nada na área visível diz o que fazer.
- Arquivo: `src/ui/screens/Match.tsx:510` (botão dentro de `.controls .end-group`).
- Conserto simples: rolar até o botão no fim, ou mostrar "Ver resultado" fixo embaixo/por cima do placar quando
  `ended`.
- Prints: `prints/90-penaltis-fim-p390.png`, `prints/80-duelo-fim-A.png`.

### B8. Avisos de desbloqueio cobrem o topo da tela · BAIXA
- "Treinador novo desbloqueado: Koga" e "Título novo: Hat-trick" aparecem um atrás do outro por cima do logo e do
  título da tela (resultado e recompensa).
- Arquivo: `src/ui/components/UnlockNotice.tsx` (posição fixa no topo).
- Prints: `prints/30-resultado-p390.png`, `prints/32-recompensa-full-p390.png`.

---

## 2. UX e visual por tela

**Home** (`prints/02-home-*.png`)
- 320x568: o botão "Nova copa" fica cortado na borda de baixo (y≈555–600); a primeira tela é faixa do evento + idioma
  + quadra + logo. Com o vazamento do funil entre abrir e jogar, vale subir a Copa: faixa "Semana do tipo" menor (ou
  abaixo da Copa) e quadra mais baixa no celular em pé.
- Os dois cartões de modo têm botão vermelho, e o "Criar sala" do Duelo é maior (largura total) que o "Nova copa".
  O Duelo (BETA) chama mais atenção que o modo principal.
- "Nome do seu time" centralizado em cima de um campo alinhado à esquerda (desktop).

**Boas-vindas** (`prints/01-onboarding-*.png`)
- Passo 3 em 320: o chip "Iniciais de Kanto" sai cortado da caixa da ilustração (`01-onboarding-3-p320.png`).
- Bolinhas de navegação com 24–32 px de largura (alvo pequeno), mas tem setas grandes; ok.

**Formação / capitão / draft** (`prints/10-*` a `15-*`)
- Funciona bem; as cores verde/vermelho do encaixe ajudam. Ponto de atenção: dá pra pôr o capitão Ala no gol
  (52 · fora) sem nenhuma confirmação; o vermelho avisa, mas quem é novo pode não entender "fora".
- Cada escolha = tocar na vaga + tocar no pacote + tocar na carta (≈21 toques no draft). É o lugar mais provável do
  vazamento "começou copa → jogou partida".
- Em 320 os rótulos dos atributos da carta (VEL, CHU, PAS) ficam com ~6 px, ilegíveis
  (`12-capitao-full-p320.png`).
- Deitado: quadra do draft apertada; nomes truncados ("Kangaskh…") e vagas encostadas (`15-draft-opcoes-r1-land.png`).

**Escalação** (`prints/20-escalacao-*`)
- O "Jogar oitavas" vem antes de Tática/Escanteio/Cobrador; ok pra quem tem pressa, mas quem quer mexer na tática só
  descobre depois. O seletor "Cobrador" usa a fonte grande e destoa.

**VERSUS** (`prints/22-versus-*`): bonito nos 4 tamanhos; só o número da média (B4).

**Partida** (`prints/23-*`, `24-*`, `28-*`, `100-105-*`)
- Celular em pé: a quadra ocupa ~350x190 px e os nomes se embolam (`23-partida-full-p320.png`); os painéis "GOL!",
  "DEFESA!" e "RIVAL EVOLUIU!" cobrem um terço da quadra e às vezes empilham com o rótulo do golpe e o "ESCANTEIO"
  (`crop-esc-seq.png`, `79-duelo-partida-andando-A.png`).
- Deitado: velocidades e táticas ficam inteiras abaixo da dobra; pra trocar velocidade tem que rolar
  (`23-partida-1x-land.png`).
- Prancheta: depois do apito final e durante os pênaltis o seletor de formação continua com cara de ativo e a dica
  segue "Toque num jogador pra substituir" (`90-penaltis-1-p390.png`, `80-duelo-fim-A.png`).
- Ditto copiado aparece como "Mewtwo" duas vezes na prancheta sem nenhuma marca de que um é o Ditto
  (`102-prancheta-rascunho-p390.png`).
- "2º" na fonte pixel parece "2²" ("Começar o 2º tempo", "1º tempo").
- Default de velocidade é 4x, mas 73–81% jogam em 8x (placar); considerar 8x como inicial (decisão).

**Intervalo** (`24-intervalo-*`): bom. "Mudar prancheta" é um nome pouco claro (só rola até a prancheta).

**Resultado** (`30-resultado-*`)
- Desktop: o selo "★ craque" encosta no "15" de "Golpes usados" (`crop-craque-desk.png`).
- Tabela de jogadores rola de lado dentro do painel (ok), mas sem nenhuma pista de que dá pra rolar em 320.

**Recompensa** (`31-*`, `32-*`, `95-*`)
- Pokémon tem botão "Contratar"; item e MT são cartões clicáveis sem botão. Parece que só o Pokémon é escolhível.
- Descrição da MT cortada com reticências ("empurra e atordoa quem…") sem como ler o resto ali.

**Campeão / Hall** (`94-campeao-*`)
- O desfile do Hall fica por cima até tocar; o "Fechar" é um texto pequeno e apagado no rodapé.
- A página do título tem ~8.300 px em 390 (caminho, prêmios, seleção, gols, golpes, final, elenco com tabela por
  carta, estatísticas). Muito conteúdo bom, mas o "Compartilhar" fica longe; seções recolhíveis ajudariam.
- **Carta com metal errado pra nota mostrada:** no "Elenco campeão" o Machamp aparece "61 FIX" em moldura de OURO
  (e na escalação o capitão no gol "52 GOL" também em ouro). `PokeCard2.tsx:147` escolhe o metal pelo `overall`, mas a
  nota exibida é a da vaga (`PokeCard2.tsx:100`). Regra das cartas diz bronze ≤64; é decisão visual de carta → Miguel.

**Perfil** (`50-54-*`, `crop-*`)
- "Meu clube" tem 4.500 px em 390 (avatar + 44 treinadores + títulos + clube). Os treinadores dourados bloqueados não
  têm nenhum brilho/borda dourada (são só silhueta igual aos outros); dá pouco gosto de caçar.
- "Prof. Car-valho" quebrado com hífen no cartão.
- 5 abas quebram em 3+2 no celular (ok, mas a segunda linha parece outro grupo).
- Missões: títulos lendários com a mesma cor dos comuns na lista.

**Configurações / Ajuda / Novidades / Créditos**: ok fora o B1. Novidades 0.8.6: a linha "Missão do Ash: copa perfeita
⇒ campeão sofrendo no máximo 5 gols (a perfeita virou a do Ash dourado)" é difícil de entender (`62-novidades-p320.png`).

**Duelo** (`70-80-*`)
- Fluxo completo funcionou. Nome padrão "Treinador" nos dois lados gera "Treinador 5 x 4 Treinador 2", "Time de
  Treinador", "Treinador vence!". Sugestão: usar o nome do clube quando o nome do treinador é o padrão.

---

## 3. Desempenho e acessibilidade

**Primeiro carregamento (soccermon.com, 0.8.5, sem login)**
- 30 requisições, ~2,66 MB transferidos. Desktop: FCP 0,7 s, load 1,5 s. Rede simulada (16 Mbps, 150 ms): FCP 3,1 s,
  load 4,1 s. Num 4G real de 3–5 Mbps fica na casa de 6–8 s.
- **As fontes são quase metade disso:** `Galmuri14.woff2` 552 KB, `Galmuri11.woff2` 493 KB, `Galmuri11-Bold.woff2`
  163 KB (+ `Galmuri7` 316 KB em `public/fonts/`). São fontes coreanas com milhares de glifos; o jogo usa só latim.
  Um subset Latin + Latin-1 + pontuação (`pyftsubset`) deve cair pra ~20–40 KB cada: ganho de ~1,1 MB no primeiro
  acesso, o maior e mais barato de todos.
- **JS num pedaço só:** build da int-086 = `index.js` 2,96 MB cru / 787 KB gzip / 632 KB brotli + CSS 233 KB
  (41 KB br) + worker 306 KB. Phaser (~1,4 MB minificado) e Supabase (~0,6 MB) entram na Home. Nenhum `import()` /
  `lazy()` no código. Carregar a partida (Phaser) só ao tocar em Jogar é o segundo maior ganho (já estava no roadmap).
- `vercel.json`: `/assets/(.*)` com `max-age=604800` vale tanto pros bundles com hash (poderiam ser `immutable` de
  1 ano) quanto pros sprites/sons de `public/assets` (sem hash). Dá pra separar quando os bundles forem pra outra pasta.
- Dev server não serve pra medir (240 arquivos, 38 MB sem empacotar); números de produção acima.

**Acessibilidade**
- Alvos de toque abaixo de 40 px: botões segmentados das Configurações (36 px de altura), filtros de tipo da Pokédex
  (36x36), abas da prancheta deitado (32 px), títulos do treinador (37 px), links do rodapé (37 px), link "conta pra
  gente" do Duelo (15 px de altura), "1x" da partida no desktop (39 px).
- `.btn.active` usa o mesmo contorno amarelo de 3 px que seria o foco: selecionado e focado ficam iguais
  (`styles.css:181`). Não há regra `.btn:focus-visible` própria (fica o anel padrão do navegador).
- A carta completa (`CardModal`) abre sem levar o foco pra dentro (o foco fica no slot da quadra).
- Busca da Movedex só tem placeholder, sem rótulo (`?lab=golpes`).
- Contraste dos textos `.muted` amostrados passou de 4,5:1; o "Fechar" do desfile do Hall é o mais apagado.
- Reduzir movimento: com o sistema em "reduce", nenhuma animação CSS roda na Home. Bom.

---

## 4. Ideias pra deixar mais gostoso

1. **Copa rápida / draft automático sugerido** ("Monta pra mim" com 1 toque, depois ajusta): ataca direto o vazamento
   do draft no celular.
2. **Botão flutuante na partida no celular** (velocidade + Ver resultado + Substituir) colado embaixo da quadra, em pé e
   deitado; a quadra fica sempre visível com o controle à mão.
3. **Painel de lance compacto em telas estreitas** (GOL!/DEFESA! menor, uma faixa por vez) e "Nomes na quadra: só do
   meu time" como padrão no celular em pé.
4. **Dourados com brilho mesmo bloqueados** (borda dourada pontilhada, "LENDÁRIA" no cartão) e contagem regressiva
   ("faltam 2 gols pro Artilheiro Lendário") no resultado da partida.
5. **Página do título em capítulos** (resumo + Compartilhar no topo, o resto recolhível), e o card 9:16 oferecido
   logo depois do desfile.
6. **Marca "Ditto" na prancheta e no painel** quando ele copia alguém (sprite pequeno do Ditto no canto da vaga).
7. **Velocidade inicial 8x** pra quem já terminou uma copa (os números mostram que quase todo mundo acelera).

---

## 5. Lista final

### Pode fazer sem perguntar
| Item | Tamanho |
|---|---|
| B1: `.menu-screen` com `grid-template-columns: minmax(0,1fr)` + input da busca da Ajuda com `min-width:0` | P (2 linhas + teste headless 320) |
| B2: `.team-panel` com `grid-template-columns: minmax(0,1fr)` | P |
| B3: barra de comparação sem risco quando o valor é 0 | P |
| B4: média do VERSUS (e "Média" do rival na escalação) pela nota na vaga, igual ao draft | P |
| B5: número da barra de missão legível (fora da barra ou texto escuro) | P |
| B6: subir `version` pra 0.8.6 no lançamento (checklist) | P |
| B7: "Ver resultado" visível ao acabar a partida no celular (rolar até ele ou botão fixo) | P/M |
| B8: aviso de desbloqueio sem cobrir o topo (abaixo da topbar ou embaixo da tela) | P |
| Subset Latin das fontes Galmuri (~1,1 MB a menos no primeiro acesso) | P/M |
| Prancheta: seletor desligado de verdade (visual) depois do fim e nos pênaltis; dica sem "substituir" nos pênaltis | P |
| Foco entra na carta completa ao abrir; rótulo na busca da Movedex; `.btn:focus-visible` diferente de `.active` | P |
| Alvos de 36–37 px → 44 px (segmentados das Configurações, filtros da Pokédex, abas da prancheta deitado, link do Duelo) | P |
| Chip "Iniciais de Kanto" dentro da caixa no passo 3 das boas-vindas em 320 | P |
| Selo "craque" sem encostar no "Golpes usados" no desktop | P |
| Item e MT da recompensa com botão "Escolher" igual ao Pokémon | P |
| Texto da linha do Ash nas Novidades 0.8.6 reescrito sem "⇒" | P |
| Duelo: usar o nome do clube quando o treinador está com o nome padrão | P |
| "Fechar" do desfile do Hall mais visível | P |

### Precisa do Miguel
| Item | Tamanho |
|---|---|
| Metal da carta fora de posição (Machamp "61" em ouro, capitão "52 GOL" em ouro): metal pela nota mostrada ou pela natural com marca de "fora"? Mostrar em `?cards=1` antes | M |
| Home no celular: "Nova copa" acima da dobra em 320 (faixa do evento menor/abaixo, quadra mais baixa); Copa com destaque maior que o Duelo | M |
| Nomes na quadra no celular em pé (padrão "só do meu time"?) e painéis de lance menores | M |
| Velocidade inicial padrão 8x | P |
| Barra de controle flutuante na partida (celular em pé e deitado) | M |
| Copa rápida / "monta pra mim" no draft (funil) | G |
| Carregar Phaser e Supabase só quando precisar (code splitting) e cache `immutable` pros bundles: mexe em build/deploy | M |
| Página do título recolhível e Perfil "Meu clube" mais curto (decisão de layout) | M |
| Dourados bloqueados com visual próprio | P/M |

### Ideia pra depois
| Item | Tamanho |
|---|---|
| Contagem regressiva das missões no resultado ("faltam 2 gols…") | M |
| Marca do Ditto na prancheta/painel | P |
| Clipe/replay do "gol da copa" na tela do título (0.8.7) | G |
| Dica visual de rolagem lateral na tabela de jogadores | P |
| Monitoramento de erros em produção (hoje só o ErrorBoundary + Discussions) | M |

Tamanho: P = até 1 h, M = meio dia, G = 1 dia ou mais.
