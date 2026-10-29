---
name: retomar-frentes-21-10
description: "LER PRIMEIRO: estado atual do Soccermon pra retomar depois de limpar o contexto (atualizado 26/10/2026)"
metadata:
  node_type: memory
  type: project
  originSessionId: 870d2189-4e00-4622-965c-fb94cb1fbb91
  modified: 2026-10-26T12:08:25.938Z
---

**ESTADO EM 26/10/2026 (o Miguel limpou o contexto depois disso).** Regras de agentes em [[feedback-economia-de-tokens]]; vídeo em [[feedback-video-sem-inspiracao]]; textos em [[feedback-texto-sem-cara-de-ia]]; postar pelo Chrome em [[reference-postar-pelo-chrome]]; menus em [[project-menus-ambientes]].

**No ar: 0.9.22 "Botão de apertar"** (main 6d5bd19a; motor 13, `liga` no 13). A 0.9.21 trouxe a tela inicial em 5 ambientes (Lab | Rota | ESTÁDIO | Arena | Sede; `?lab=off` = Home antiga). A 0.9.22 trouxe o kit global "variante B com placas" em `src/ui/kit/kit.css`: dourado só joga, verde segue/compra, azul secundário, vermelho só perigo; 1 botão gordo por tela; ação de lista vira chip na carta; painel com moldura grossa e título em placa; escolhido = azul (`--pick-fill`/`--pick-ring`); contorno de texto só ≥16 px; nível de treinador (missões em degraus, `trainerLevel` em metas.ts); `?lab=kit` = galeria. Nenhuma branch de trabalho aberta (worktrees velhos de vídeo/música = arquivo, não apagar sem perguntar).

**No ar: 0.9.23 "Vestiário"** (main 8133da17, tag v0.9.23). **Em andamento: branch `consertos-0923`** (CI verde 923c2f5d, NÃO subiu): 0.9.23.1 (Pokémon sem teleporte, quadra da Arena completa, Novidades prontas) + partida nova atrás de `?lab=hud` com a mistura aprovada (base hud + caixa do golpe da C + Trocar no painel do jogador da B; regras contra caos no 8x: frase mínima 1 s e filtro, câmera segue só no 1x/2x, toque pausa). Vídeo 1x/8x no scratchpad da sessão. Pendente: Miguel mandar print do "botão por cima do Pokémon no PC" (não reproduzi), dizer se sobe a 0.9.23.1, jogar copa com `?lab=hud`. Limpeza pós-0.9.23 (worktrees estilo-*, branch vestiario) foi interrompida por ele: não apagar sem perguntar.

**Próximo: revamp-ui** (`docs/planos/revamp-ui.md`, 19 decisões aprovadas com as recomendações): 0.9.23 "Vestiário" (Escalação no vestiário, VS com túnel, barra da copa em todas as telas da copa, sheet e confirmações em sheet) → 0.9.24 Beira da quadra (Partida, atrás de `?lab=hud`) → 0.9.25 Placar → 0.9.26 Poké Mart → 0.9.27 Sede (Caminho do treinador) → 0.9.28 Lab/Arena por dentro → 0.9.29 Faxina. Miguel prefere juntar versões e gosta de ver variantes lado a lado antes de espalhar visual (foi assim que escolheu a B). Na 0.9.22 ele autorizou deploy direto após revisão; nas próximas, pedir o "pode subir".

**Lembretes:** 02/11 conferir o funil (`npm run stats -- --dias 7`): "Monta pra mim" virou discreto até na 1ª copa (desfez a regra de 23/10). Login Google, convite de Duelo e copas guardadas não foram testados na tela (precisam da nuvem); o Miguel ia conferir no ar.

**Docs de decisão:** clash-2x2-menus-arcade.md (ordem menus → arcade [Monotipo, Draft às cegas, Pênaltis sem fim] → 2x2: A parceiro IA + B amigo por link). revisao-textos.md (blocos 1–4 aplicados; próximos 5 Resultado/Mercado … 11 Config: tabela numerada, ele aprova por número; ele gosta de nome oficial em inglês e de "pra"). funil-draft.md (pendente: evento de saída da partida = migração Supabase; encurtar a 1ª partida). docs/marketing/pesquisa-perfis-virais.md.

**Redes:** no ar Snorlax (TikTok, Reels, Shorts) e POV nível 3 com Dragonite. "O rival evoluiu" NÃO vai ao ar ("nhe"). Série "Escalaram um ___ no gol" aprovada (seg/qua/sex 19h); pitches Magikarp (evolui pra Gyarados no gol), Ditto (vira quem chuta), Onix (só Água fura) esperando o ok dele; antes de gravar, conferir no jogo que acontece. Vídeos de versão prontos e não postados: ~/Vídeos/soccermon-postar/ambientes-clash.mp4 e kit-0922.mp4. Postar exige Claude Code na conta pessoal (/login) e Chrome perfil "Miguel".

**Pendências pequenas:** acento do "Í" de Índigo some na Galmuri (`npm run fonts`); nome do treinador corta em 360 px; Home antiga (`?lab=off`) ainda com 2 botões gordos; faixa do Hiper Raio fica Normal (decisão dele). Modo mochila desligado em 26/10 ([[feedback-modo-mochila]]).

**27/10 madrugada (fim da sessão de 26/10):** 0.9.23.1 no ar (golpe máximo dramático, consertos). Branches pra próxima versão: `n3-indefensavel` (motor 14, N3 82% de gol, aprovado; ao subir, republicar a Edge Function `liga`) e `redes-buffer` (script do Buffer + skill social; pode subir junto). Curta EP 2 "Escalaram um Magikarp no gol" postado nas 3 redes pelo Buffer (branch `curtas`, música livre-magikarp com o motivo PLOF). Ritmo combinado: um curta de história, uma funcionalidade, alternando. Próximos: comentário com link no TikTok do EP 2, EP 3 (roleta já anunciada), partida nova `?lab=hud` segue atrás da bandeira, print do "botão por cima do Pokémon no PC" ainda pendente, worktrees de vídeo antigos (curtas-2, curta-rival, trailer-baby, video-*) esperam o ok dele pra apagar. Ver [[reference-postar-pelo-buffer]].
