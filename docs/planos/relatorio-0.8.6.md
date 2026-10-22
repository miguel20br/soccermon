---
description: Relatório da 0.8.6 e as decisões do Miguel sobre ela.
---

# Relatório da noite: 0.8.6 pronta pra subir (18/10/2026)

Pedido do Miguel (17/10, antes de dormir): auditoria completa do site, o que dá pra mudar já na 0.8.6, revamp da
tela de partida, agência do técnico sem virar "jogar", personalização e coleção, marketing e revisão do roadmap.
O que dava pra decidir sozinho está feito e testado; o que é dele está na seção 4, com recomendação primeiro.

## 1. Resumo em 8 linhas

1. A 0.8.6 está pronta em **duas candidatas**: `int-086` (a partida com a cara de hoje) e `int-086-revamp` (a
   mesma coisa + partida com cara de transmissão). Você escolhe uma; a outra é apagada.
2. As duas passaram no teste de fumaça completo (build de produção, headless, 320/390/deitado/desktop, Copa
   inteira, Duelo em duas abas, backup v6 → save v9, PT/EN), zero erro de página.
3. Os 5 defeitos que o teste achou já estão consertados (seção 3.3), com teste.
4. Motor: `ENGINE_VERSION` 3; save v9 com migração. Determinismo igual em Node, Chromium, Firefox e WebKit.
5. Primeiro acesso: 2,5 MB → 0,4 MB de JS; Home com fonte em 1,5 s (era 5,6 s).
6. Pesquisas guardadas em `docs/planos/pesquisas/` (agência, coleção, marketing, auditoria, mockups da partida).
7. Proposta de roadmap (seção 5): 0.8.7 = Copa do Dia + liga; agência "beira da quadra" logo depois.
8. Nada foi pra `main`. Falta só o seu "pode subir" (e a escolha A ou B).

## 2. As prévias

| Candidata | Branch | Prévia (login da Vercel) |
|---|---|---|
| A · partida de hoje | `int-086` | https://soccermon-git-int-086-miguel20brs-projects.vercel.app |
| B · partida-transmissão | `int-086-revamp` | https://soccermon-git-int-086-revamp-miguel20brs-projects.vercel.app |

**Recomendo a B.** No celular os controles ficam sempre à mão (velocidade, Lances e Pular numa barra fixa
embaixo), o placar vira placar de TV com a barra de pressão, a narração aparece numa linha em cima da quadra e o
painel do técnico vai pra abas (Tática, Prancheta, Time, Lances). Deitado, tudo cabe numa tela só. No desktop,
tudo fica à vista sem rolar. Na A, a 320 e deitado, os controles ficam fora da tela.

Pontos fracos da B (dá pra ajustar depois de você ver):
- no celular a prancheta fica numa aba (a padrão é Tática);
- "restam N mudanças" virou bolinhas (●●●), menos explícito;
- a 320 a aba Tática fica apertada acima da barra fixa;
- a faixa da cor do time no placar e no letreiro é proposital (cara de TV); julgue na prévia.

Mockups das 3 direções que eu estudei (A transmissão, B prancheta no centro, C HUD de batalha):
`docs/planos/pesquisas/ui-partida/`. A candidata B é a direção A daquele estudo, com as abas e a barra de pressão
adiantadas da 0.8.7.

## 3. O que tem na 0.8.6

### 3.1 O que você pediu

| Item | Onde |
|---|---|
| Título do treinador visível no VERSUS, no placar e no saguão do Duelo (com o brilho dele) | VERSUS, placar, saguão |
| Missão do Ash: campeão sofrendo no máximo 5 gols na copa (~1 em 117 copas) | `src/store/missions.ts` |
| Missões lendárias: 6 treinadores dourados (Ash, Lance, Joey, Red, Blue, Carvalho) e 9 títulos brilhando | moldura, perfil, VERSUS, desfile, card |
| Sprite dourado "100% dourado" | `scripts/build-gold-trainers.ts` |
| Prancheta ao vivo (formação e vagas) na Copa e no Duelo, entra na próxima bola parada, sem limite, goleiro incluso | motor: ordem `lineup` |
| Defesa do goleiro: a bola defendida não passa mais por trás dele | motor |
| Evolução do rival com animação e faixa próprias ("RIVAL EVOLUIU!") | cena |
| +2 em tudo por evolução da carta (Charmander → Charizard = +4 sobre o pronto) | `src/engine/instance.ts`, aprovado |
| Duelo: os dois lados evoluem com limiar 14 | `src/engine/evolution.ts`, aprovado |
| Item novo pra quem já segura um: você escolhe pra quem vai o antigo (ou descarta) | Recompensa |
| Duelo "já + polimento": trapaça e reconexão nas regras da sala, revanche de um toque, rival que saiu, nomes iguais, Substituir apagado de verdade | `src/net/` |

### 3.2 O que eu fiz sozinho (julguei que você aceitaria)

**Coleção (nada de motor, tudo retroativo pelo save):**
- estojo das 8 insígnias de Kanto: tirado antes de subir (o Miguel prefere guardar as insígnias pro Modo história; o `BadgeCase` fica pronto pra lá);
- álbum de edições na Pokédex (Normal, Shiny, Evento, Ícone, Destaque; save v9);
- fita de campeão por espécie;
- 9 coleções temáticas (iniciais, pássaros, fósseis, Eevee...), cada uma com título.

**Som:** grito do capitão no seu gol (desliga em Configurações).

**Auditoria do site (B1 a B8 e polimento):**
- Ajuda no celular sem passar da tela;
- barra 0 x 0 sem risco;
- média do time pela nota na vaga em todo lugar;
- número da missão legível;
- relógio mostra Intervalo no intervalo;
- dourados bloqueados com brilho e selo Lendária;
- nome comprido de treinador não vaza;
- item e MT com "Escolher";
- foco do teclado e alvos de 44 px;
- "Fechar" do Hall visível.

**Desempenho:**
- Fontes Galmuri só com o que o jogo usa (1,2 MB → 23 KB).
- Phaser e Supabase em pedaços à parte.
- Cache de 1 ano pros bundles (`vercel.json`; os arquivos têm hash no nome, então nunca fica velho).

**Medição:**
- `match_end` conta as ordens do técnico por tipo. É a base pra decidir a agência.
- `soccermon.com/tt`, `/yt` e `/ig` levam com utm.
- O placar parou de sugerir o vercel.app como canal.

### 3.3 Consertos do teste de fumaça final (hoje de manhã)

| Defeito | Conserto | Teste |
|---|---|---|
| Depois do "Começar o 2º tempo", ~2 s de "Intervalo" no placar e quem saiu ainda na prancheta | o 2º tempo começa armado (a cena pula o trecho parado do intervalo); vale Copa e Duelo | `src/ui/match-view.test.ts` |
| Aviso "Treinador novo" cobria o "Ver resultado" no celular | aviso em cima, em toda tela | print 390 |
| "Ver resultado" abaixo da dobra no fim do jogo (A, celular em pé) | a tela rola até ele (na B ele já está na barra fixa) | print 390 |
| Painel "Quem sai?" abria abaixo da dobra | rola até o topo do painel (Copa e Duelo) | — |
| Duelo B com nomes padrão: "PAL x PAL" no placar do celular | siglas nunca repetem (pelo nome do placar, ou "PA2") | `src/net/duel.test.ts` |

**Troca a conferir:** o aviso de desbloqueio voltou pro topo. A auditoria tinha reclamado que lá ele cobre o logo e o
título da tela. Ficou assim porque cobrir o botão de seguir é pior. Ele não pega toque e some em 3,6 s.

### 3.4 Conferido

- **Checagens:** `tsc`, Biome sem erro, 221 testes (A) e 226 (B), build de produção das duas.
- **Determinismo:** 4 navegadores.
- **Teste de fumaça (prints):** `scratchpad/fumaca/` desta sessão.
- **E-mail:** todo commit com o noreply.

## 4. Decisões que são suas (recomendação primeiro)

> **18/10/2026, respostas do Miguel (questionário):**
> - **Bote:** manter no chute e no carrinho.
> - **Metal da carta fora de posição:** fica pela nota natural (como está).
> - **Home a 320:** "Nova copa" acima da dobra e Copa com mais destaque que o Duelo (vai junto do visual novo).
> - **Velocidade:** quem nunca jogou começa em 1x; a escolhida fica salva em Configurações (na 0.8.6).
> - **Copa rápida:** testar na 0.8.7.
> - **Nomes na quadra:** continua opção do jogador, padrão os dois times.
> - **Agência, só pra testar se orna (nada confirmado):** Pedido de tempo + Gritos (3 por jogo, 4 opções; tempo dá
>   +5% de fôlego), Goleiro-linha (liberado o jogo todo), Golpe máximo do capitão (lances do time, mais rápido
>   perdendo) e a ordem dos pênaltis. Copa e Duelo juntos. **Segurar a evolução: não.**
> - **Rival que reage:** sim, com os líderes. **Plano de jogo:** em dúvida (medo de complexidade), fica parado.
> - **Emotes:** deixar bem mais legais, inspirados no Clash Royale.
> - **Coleção:** medalhas com degraus, vitrine (borda + cartão) e escudo + uniforme. Mascote: não. Faixa da
>   torcida: lista fechada, mas ele duvida do visual (mockup antes). Acabamentos de carta: viram **selo de carreira
>   na Pokédex** (Folha, Holo, Prisma, Ouro escuro, como a fita de campeão), sem mudar o acabamento da carta pra não
>   competir com a raridade e as edições. Talvez um selinho na carta também: só depois de mostrar em `?cards=1`.
> - **Duelo:** mandar só o que mudou na 0.8.7; partida curta antes do espectador.
> - **Desafio Dourado:** nome nas Novidades + título por código.
> - **Música Bliitzit:** fora dos clipes novos.
> - **Missões não simuladas:** olhar no placar em 2 semanas.
> - **Fonte:** nomes fora do alfabeto latino na fonte do sistema, aceito.
>
> Antes de subir a 0.8.6 ele pediu o site inteiro no visual da partida-transmissão (branch `site-revamp`). Roadmap: conversar depois.

### Pra subir a 0.8.6
1. **A ou B?** Decidido em 18/10: **B**, com tática e escanteio sem limite de mudanças e o banco à vista no Substituir
   (dá pra começar por quem entra). A branch `int-086` sai de cena.
2. **"Pode subir"?** Depois disso eu sigo a skill de lançamento (fast-forward da `main`, tag v0.8.6, release, conferir
   o ar, apagar worktrees e branches).

### Tela e jogo (pequenas, podem entrar na 0.8.7)
3. **Bote da animação Attack.** Ele já é descontado no mergulho do goleiro. Descontar também no chute e no carrinho?
   Recomendo não: ali o bote dá impacto ao lance.
3b. **Metal da carta fora de posição.** Hoje um Machamp com "61" na vaga sai em ouro, e o capitão "52 GOL" também.
   Recomendo o metal pela nota mostrada, com a marca "fora". Mostro antes em `?cards=1`.
4. **Home no celular a 320.** "Nova copa" acima da dobra (faixa do evento menor) e a Copa com destaque maior que o
   Duelo. Recomendo sim.
5. **Velocidade inicial padrão 8x.** 79–81% já jogam em 8x. Recomendo sim.
6. **Copa rápida / "monta pra mim" no draft.** É pro funil: 33% das pessoas novas saem entre "começou copa" e
   "jogou partida". Recomendo testar na 0.8.7.
7. **Nomes na quadra no celular em pé.** Recomendo o padrão "só do meu time".

### Agência do técnico
Detalhes em `pesquisas/agencia.md`. A regra pra não virar "sempre clique": custo visível, efeito visível em 8x,
nenhuma decisão dominante, e quem não usa perde no máximo ~5 pontos de vitória. Tudo medido com um técnico robô
antes, com o antes/depois pro seu ok.

8. **Quais 3 entram?** Recomendo:
   - Pedido de tempo + Gritos do técnico ("beira da quadra");
   - Goleiro-linha (só no 2º tempo, o gol vazio é o custo);
   - Golpe máximo do capitão (1 por partida).

   De brinde e baratos: a ordem dos pênaltis e um "Segurar a evolução".
9. **Rival da Copa que reage (M10)?** Recomendo junto dos líderes com personalidade. Sem ele, as outras viram
   receita fixa.
10. **Duelo junto ou depois?** Recomendo a Copa primeiro e o Duelo na versão seguinte.
11. **Plano de jogo** ("se... então...", montado antes do jogo): fere o "nada automático"? Recomendo permitir, só
    depois da M10, avisando na narração.

### Coleção e personalização
Detalhes em `pesquisas/colecao.md`.

12. **Medalhas com degraus.** ~20 medalhas, bronze/prata/ouro + platina holográfica. Eu monto a tabela pro seu ok.
13. **Vitrine de 3 destaques.** Borda do avatar e cartão de treinador no Perfil e no VERSUS do Duelo. Recomendo 3.
14. **Escudo montável e uniforme** (cor secundária e padrão). É visual de placar e de quadra.
15. **Faixa da torcida.** Recomendo uma lista fechada de frases, sem texto livre.
16. **Acabamentos de carta por espécie.** Recomendo depois do escudo, com `?cards=1`.
17. **Mascote na Home e emotes novos.**

### Duelo
18. **Cota do Realtime.** Mandar só o que mudou (~1 dia) evita estourar o plano grátis se o Duelo pegar. Recomendo
    na 0.8.7.
19. **Partida curta e espectador por link** (saíram da auditoria do Duelo). Recomendo a partida curta primeiro.

### Marketing
Plano de 4 semanas e 10 roteiros de clipe em `pesquisas/marketing.md`.

20. **Desafio Dourado (`#DesafioDourado`).** Prêmio sem dinheiro: nome nas Novidades e, se quiser, um título
    exclusivo por código. Recomendo os dois.
21. **Contas e posts** (só você pode):
    - criar e aquecer o Reddit;
    - recuperar o LinkedIn;
    - Show HN (ficar 3–4 h respondendo);
    - escolher 5 creators BR pro kit;
    - aprovar cada clipe e clicar em Post.
22. **Música Bliitzit** (remix da Game Freak) fora dos clipes novos. Recomendo. É o tipo de coisa que pega Content
    ID ou denúncia.

### Pequenas
23. As missões lendárias que não simulei: Lance, Red, Blue, Carvalho e parte dos títulos. Recomendo deixar como
    estão e olhar no placar em 2 semanas.
24. Nomes fora do alfabeto latino (japonês, cirílico) agora aparecem na fonte do sistema (efeito do corte da
    Galmuri). Recomendo aceitar.

## 5. Roadmap proposto (só proposta; o `lancamento.md` só muda com o seu ok)

| Versão | Tema | O quê |
|---|---|---|
| 0.8.6 | Lendas douradas e prancheta ao vivo | Esta versão |
| 0.8.7 | Copa do Dia e liga | Copa do Dia (mesma seed, ranking do dia, texto de compartilhar estilo Wordle), sequência gentil (dias na semana, sem zerar), Duelo mandando só o que mudou, Copa rápida / monta pra mim, metal da carta e Home a 320 |
| 0.8.8 | Beira da quadra | Pedido de tempo + gritos, goleiro-linha, golpe máximo do capitão, pênaltis com ordem, segurar a evolução; técnico robô no balanceamento |
| 0.8.9 | Melhores momentos | Replay e "gol da copa", exportar clipe |
| 0.8.10 | Treinadores e quadras | Líderes com personalidade (rival que reage, M10), quadras temáticas, vitrine e escudo |
| 0.9 | Modo história | Como já está (o estojo de insígnias já serve) |

A Liga ranqueada inteira (Elo, temporada) pode ficar com a Copa do Dia ou ir pra depois da agência. Recomendo a
Copa do Dia primeiro: é o motivo diário de voltar e custa menos.

## 6. Onde está cada coisa

| O quê | Onde |
|---|---|
| Candidatas | branches `int-086` e `int-086-revamp` (worktrees `.claude/worktrees/int-086` e `agent-ab8d347125e4c01e0`) |
| Auditoria do site (bugs B1–B8, UX por tela, desempenho, lista final) | `docs/planos/pesquisas/auditoria-0.8.6.md` |
| Revamp da partida (diagnóstico, 3 direções, mockups) | `docs/planos/pesquisas/ui-partida/` |
| Agência do técnico (12 mecânicas, ranking, 11 perguntas) | `docs/planos/pesquisas/agencia.md` e `agencia-referencias.md` |
| Coleção e personalização (15 itens) | `docs/planos/pesquisas/colecao.md` |
| Marketing (diagnóstico, plano de 4 semanas, 10 clipes, desafio, textos) | `docs/planos/pesquisas/marketing.md` |
| Bônus de evolução (+2, com a sim antes/depois) | `docs/planos/balanceamento-geral.md` |
