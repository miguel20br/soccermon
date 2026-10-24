---
name: retomar-frentes-21-10
description: "Passagem de 21/10/2026 (noite): frentes paradas pelo limite de uso, worktree de cada uma e o próximo passo"
metadata:
  node_type: memory
  type: project
  originSessionId: 244f6e33-1322-4600-b6a0-ca8dcc92462f
  modified: 2026-10-21T20:44:17.857Z
---

No ar: **0.9.5** (main 08ae0dd, 22/10: formações com comportamento + movesets únicos, ENGINE_VERSION 9, Liga redeployada; antes 0.9.4: 21/10 noite: Rota polida, Duelo md3, claudemd/ADRs, lab de cenas; worktrees e branches dessas apagados; ENGINE_VERSION 8; Rota Índigo ligada; Liga com motor 8 publicado). Regras de uso de agentes em [[feedback-economia-de-tokens]]; texto em [[feedback-texto-sem-cara-de-ia]]. Retomar UMA ou DUAS frentes por vez, agente NOVO com brief curto (ler o doc + `git log`/`git diff origin/main` do worktree), não retomar os agentes antigos.

| Frente | Worktree (.claude/worktrees/) | Estado | Próximo passo | Modelo |
|---|---|---|---|---|
| Beira da quadra 2 (golpe máximo acende com o capitão com bola em posição de chute e sai na hora; capitão goleiro = defesa máxima; sem gritos; goleiro-linha balanceado; troca de posição e substituição na hora, volante) | beira (1 commit, agente morreu no meio de "latched cue helper") | conferir o que falta | revisar o commit, terminar, números em docs/planos/beira-da-quadra-2.md, decidir se sai do experimento. Vira ENGINE_VERSION 10 na junção com formações | Opus |
| Música: rodada 6 + ligar no jogo | musica (1 commit: skill soccermon-musica, scripts/musica, doc docs/planos/pesquisas/musica.md) | rodada 6 (a) em andamento desde 21/10 noite | (a) compor: palmas com timbre de palma de verdade e menos na seção final da Abertura com gancho v2 (vira a Home); temas PRÓPRIOS de Brock, Misty e Rocket e as partidas deles citando o tema; Planalto com SOC-CER-MON mais evidente; groove do Mercado funk v2 como modelo; tudo loopável sem costura; partida separada em 1º e 2º tempo, seções loopáveis por intensidade + JSON de loop/BPM. Amostras e index.html copiados em /home/bartolomeu/Música/soccermon-amostras/index.html (regerar com scripts/musica/render.mjs). (b) ligar no jogo: volume "Música" nas Configurações, crossfade 250 ms, lazy por tela, partida que cresce como experimento | (a) Opus (b) Sonnet |

Pendências de decisão do Miguel: título grande do vice ("FIM DA LINHA"); trailer usa remix de música dos jogos (trocar pela Abertura nossa?); ligar a regra de movesets únicos (8 espécies, `UNIQUE_MOVESETS`) depois de ver em ?cards=1; ícones no ranking (ver [[lembrete-icones-ranking]]); MCPs sem uso podem ser desligados com /mcp.

Docs só em worktree (não commitados): pesquisa-apis/docs/planos/pesquisas/apis-e-assets.md, historia/docs/planos/historia.md (a versão atualizada foi pra branch cenas).

**Aprovado pelo Miguel em 21/10 (noite), fila:** (1) FEITO: 0.9.4 no ar; (2) `UNIQUE_MOVESETS = true` junto com formações (muda partida: mesma ENGINE_VERSION 9 + edge:liga); (3) ícones no ranking (servidor manda o time; migração em produção aprovada); (4) MTs mais fortes: ele "quase nunca fica em dúvida entre pegar" → análise com antes/depois (skill balanceamento), aplicar só com ok; (5) SOC-CER-MON piscando nas 3 batidas da Abertura na Home, onde tiver música + logo, e no trailer (entra na música etapa b); (6) trailer: testar versão com a Abertura misturada com a música de batalha. Negado pelo classificador (Self-Modification): `.claude/settings.json` com plugins, hook SessionStart do índice e `disable-model-invocation` nas skills: o Miguel faz/autoriza à mão.
**21/10 madrugada:** formações APROVADAS pelo Miguel (comportamento, ajustes de atributo, mais gols, Rodízio contra-ataque); pediu baixar Dois pivôs × Losango (62%). Agente novo ajustando + `UNIQUE_MOVESETS = true` + merge da 0.9.4 → depois preparar a 0.9.5 (int-095) e a sessão principal publica + `functions deploy liga`. MTs e Beira ficam pra ENGINE_VERSION 10.

**22/10:** 0.9.5 no ar. MTs: análise pronta (/tmp/claude-1000/mts/), Miguel escolhe A (só números), B (golpe treinado: +1 uso, ×1,3, IA prioriza, selo MT) ou B + A nas piores (Mega Drain, BubbleBeam, Fissure) → ENGINE_VERSION 10 com a Beira. Evento `reward` precisa gravar o que foi pego (processo). Música rodada 6 pronta na branch musica (ouvir em ~/Música/soccermon-amostras via http.server :8000); próximo: etapa (b) ligar no jogo + SOC-CER-MON piscando + trailer com Abertura × batalha.

**22/10 (madrugada), redes do Dia D:** o Miguel liberou o perfil pessoal do Chrome (Browser 2, Linux), mas o CIC só funciona quando o Claude Code está na conta pessoal dele; na conta da Bowe, o TikTok aparece deslogado. Assim que ele trocar de conta, faça os itens 1–6 da `docs/marketing/pauta.md`:
- confira se o TikTok das 19h está agendado;
- Reels;
- Shorts (falta o canal do YouTube);
- rascunho pro X;
- release "Trailer 2" no GitHub;
- comentário com o link.

Confirme numa linha antes de cada Post.

Em andamento (agentes): preparar a 0.9.6 (MTs B+A, Beira ligada, zona do golpe máximo por posição; o Miguel já disse "pode lançar"; a sessão principal publica e roda `edge:liga`), música 8b mais ligar as faixas aprovadas na `musica-jogo`, e a revisão de UX da Rota (com o tutorial em slides). Na fila: categoria livre de composição, trailer com a Abertura × batalha.

**22/10, decisões da revisão da Rota:** (1) tutorial em balões apontando o botão real: 2 na Home na 1ª visita e de 1 a 3 na 1ª vez em cada modo, aparece uma vez, dá pra pular e rever na Ajuda; (2) o balão recomenda a Relâmpago pra quem nunca jogou; (3) rivais da Rota combinando com o tipo (Ornitólogo com pássaro); (4) propor teto pro capitão no draft da Rota, com números; (5) Treino final sem ninguém pra evoluir ganha uma opção alternativa (regra nova aprovada). Novo: a dificuldade da Rota está estranha, o draft 1 parece um draft normal e o jogador já sai com o melhor time na 1ª partida. Propor uma progressão (começar mais fraco e crescer pela rota) com antes e depois. Fila: um agente de equilíbrio da Rota (2+3+4+5+progressão), os balões depois do rota-ux, a composição livre e o trailer.

**22/10 ~03h, plano da noite (o Miguel foi dormir e deixou tudo rodando):**
**0.9.6 NO AR (22/10 ~04h40):** main 896378b, motor 10 na Liga. Log da noite em scratchpad/noite.md (sessão 860a4e4b).
- Publicar a 0.9.6 quando o agente terminar (ele disse "pode lançar").
- Rodar em seguida: equilíbrio da Rota (proposta), balões do tutorial, composição livre e o trailer com a Abertura × batalha.
- Quando todas as revisões acabarem, fazer uma revisão dupla nos pontos que a primeira pode ter perdido (pedido dele).
- Quando ele acordar: resumo de tudo que foi feito à noite.
- Nada além da 0.9.6 vai pra main sem o ok dele: o mapa precisa do print antes e depois.

**22/10 madrugada, fim da noite:** a int-097 está pronta, com CI verde. Ela junta rota-ux, tutorial, rota-equilibrio, musica-jogo e os consertos da revisão dupla, e está esperando o "pode subir" do Miguel. Antes de subir:
- o Miguel olha o print do mapa novo;
- aplicar a migração `20261022180000_eventos_tutorial.sql` e ligar `COACH_EVENTS`;
- escrever as Novidades da 0.9.7 (citar que os rivais mudam numa Rota em andamento).

Esperando decisão dele:
- progressão da Rota (recomendação: vagas, reforço do Planalto e capitão ≤82);
- a copa ~3 pp mais difícil com o técnico IA rival;
- ouvir a 8b, a categoria livre e o trailer com a Abertura;
- a virada por líder;
- o voltar do Android;
- as telas longas.

Log completo: scratchpad/noite.md da sessão 860a4e4b.

**22/10 ~09h30: 0.9.7 NO AR.** main = int-097: música, mapa com bifurcações, tutorial em balões, rivais por tipo e os consertos da revisão dupla. `ENGINE_VERSION` continua 10. A migração dos `coach_*` foi aplicada via psql (`POSTGRES_URL_NON_POOLING`): o histórico de migração do CLI está vazio, porque as migrações sempre foram aplicadas à mão. `COACH_EVENTS = true`. Removidos os worktrees int-097, rota-ux, tutorial, rota-equilibrio e musica-jogo. Rodando: virada por líder com a pressão mantida até o apito (sugestão aceita), trailer v2 (mais energia e piscada forte) e voltar do Android com as telas longas. O Miguel aprovou a copa mais difícil.

**22/10 manhã, fila aprovada:**
1. Logo da Home: marcar todos os ganchos da Abertura (compassos 0, 1, 36 a 42 e 52); piscada forte no estilo do trailer v2 (escala, branco, brilho, tremida no MON); sem som, piscar sozinho.
2. Sistema de troca de música no tempo (batida ou compasso), com a virada redesenhada dentro da própria música da partida (virada de bateria, torcida, sobe de nível). A vinheta saiu.
3. Cries: tirar do draft e revisar a normalização dos volumes (cries, efeitos, música, torcida).
4. Temas dos líderes Erika, Koga, Sabrina, Blaine e Giovanni, inspirados no clima dos originais, sem copiar melodia.
5. Curtas promocionais: Snorlax e pênaltis primeiro, depois Ginásio vazio e Acendam as luzes (amizade).
6. Jogo de ritmo vai pro roadmap como ideia.

**Trailer v2 (22/10):** o Miguel achou "bem melhor" e gostou muito da música acompanhando o corte e do efeito novo do SOC-CER-MON no trailer. Próximo (v3), na branch `trailer-abertura`:
- mais presença (médios de 2 a 6 kHz, ainda 1–2 dB abaixo do remix);
- tirar o "holofote estranho" no topo;
- voltar à tela final do trailer publicado (a do Trailer 2 original; confirmar se ele quis dizer o Trailer 1), mantendo a piscada nova.

Entra quando abrir vaga (agora: logo, transição e virada-lider).

**22/10 ~17h40, ESTADO PRA RETOMAR (o Miguel ficou sem tokens):**
- **No ar:** 0.9.11. TikTok agendado: trailer v3 às 19h e Snorlax às 21h. O trailer antigo do remix foi apagado pelo Miguel.
- **Chrome do Soccermon:** o perfil pessoal do Miguel no workspace 3. Depois de `/login` é preciso `/mcp` → reconectar o claude-in-chrome. Nunca usar `switch_browser`: o pedido aparece nos PCs do trabalho.
- **Kit pra IG e YT,** que o Miguel posta: ~/Vídeos/soccermon-postar (vídeos, capas e LEGENDAS.txt).
- **Parados no meio, retomar com agente novo:**
  - `ritmo`: logo no SOC-CER-MON de qualquer faixa, relógio de batida, cartas do draft na batida;
  - `curtas-2` v3: gol novo, sem etiquetas, a bola nunca se mexe sozinha mas lances cartunescos valem, sem fantasma, "a quadra é a banda" explícito, tela de CTA com elemento do curta, QA `trailer/qa-quadros.mjs`.
- **Aprovado e não começado:**
  - pré-evoluções na Rota com semente travada (anti-reset);
  - golpe máximo com barra em 3 níveis, timing na batida e defesa com timing;
  - patrocínios novos (olheiro, agente, preparador, torcida, clube formador);
  - golpe máximo por tipo e depois por Pokémon;
  - curtas das trilhas novas (Magikarp, Gengar, Ditto, Psyduck, Eevee).
**Lançamentos (22/10, ~17h30):** o Miguel voltou atrás e prefere "ir upando enquanto vai fazendo". Cada frente pronta, com CI verde, sobe na sua própria versão 0.9.x. A 0.9.12 (ritmo) já está no ar.
- `ritmo` pronto na branch (efb1599f, CI verde), sem versão. Falta medir o logo piscando no gancho do draft.json no navegador; as cartas já foram medidas, com erro de até 3 ms.

**FIM DE 22/10 (~17h45).** No ar a 0.9.13: Novidades com data, a versão mais recente em destaque e as antigas recolhidas. TikTok com o trailer v3 às 19h e o Snorlax às 21h. O kit do Instagram e do YouTube está em ~/Vídeos/soccermon-postar, e é o Miguel quem posta. Próximas frentes, cada uma subindo na sua 0.9.x:
1. golpe máximo com 3 níveis, timing na batida e defesa com timing;
2. pré-evoluções na Rota (a "copa baby") com a semente travada;
3. patrocínios novos;
4. golpe por tipo;
5. curtas v3 (Ginásio e Luzes) e os curtas das trilhas novas;
6. sound design (fase 2 do ritmo).

Também vale apagar o vídeo antigo do TikTok de 16/10, item 6 da pauta.

**23/10 meio-dia, ESTADO PRA RETOMAR.** Arquivados pelo Miguel (ver [[feedback-video-sem-inspiracao]]): curtas banda/amigos (curtas-2), clipes 11-12, música eletro (musica-eletro). Branches de trailer, historia e pesquisa-apis apagadas.
- **golpe-max PRONTO** (CI verde, 3 níveis já é o padrão, motor 11, sem bandeira): N3 x2,2 + goleiro rival x0,7, defesa N1 0,75 s, líderes 55/35/10, Lance 70/25/5, toque cedo guardado. Goleiro ok (≤ +4 pp); linha: segurar pro N3 empata com N1 (barra cheia na zona só 0,44/jogo) — sair das faixas (gomo 10, zona maior) pede ok. Prévia: soccermon-git-golpe-max-miguel20brs-projects.vercel.app/?demo=maximo&nivel=3. Pra subir 0.9.14: ele jogar + "pode subir" + patch-notes + `npm run edge:liga` + deploy da `liga`.
- **rota-baby PRONTO** (8856e4cd, CI verde): LONE_START_MAX 82, rival Rota 1 piso −2, conserto Seel+Dewgong com teste (falhou antes). n=400: Rota 1 54%, título 15%, nota inicial 64,6, capitão 67,8. Sem ENGINE_VERSION. Sobe numa 0.9.x própria com "pode subir".
- **Jogo novo:** ~/Projects/jogo-novo (CLAUDE.md + 6 skills copiadas), docs/brainstorm.md: top 3 Turnê (banda na van, gestão + show), Compasso (Balatro de compasso), Avenida (escola de samba, Patapon). Próximo: 2 protótipos sem arte (Turnê e Compasso) com músicas de referência dele.
- Fila: proposta de patrocínios, proposta de golpe por tipo. Timer claude-bom-dia 05:03 funciona (hoje bateu no limite).
**23/10 ~13h: 0.9.14 (golpe máximo 3 níveis, motor 11, `liga` redeployada) e 0.9.15 (Rota de baby) NO AR**, worktrees e branches apagados. Rodando: propostas de patrocínios novos (branch patrocinios) e golpe máximo por tipo (branch golpe-tipo).
**23/10 tarde:** Miguel aprovou TUDO (patrocínios 1–11, golpe por tipo 1–12). Rodando: `patrocinios` (Olheiro de Viridian, Preparador de Lavender, Charanga de Pewter, Clube Formador de Pallet; motor 12), `golpe-tipo` (precisão do N3 sem bandeira + 15 efeitos por tipo no N3 atrás de bandeira; motor 12), `trailer-baby` (rascunho 6–8 s, parar pro ok). Próxima atualização = os dois juntos numa integração (ENGINE_VERSION 12, regenerar hashes, edge:liga), com revisão dupla e trailerzinho. Arquivo do pipeline do trailer v3: branch `arquivo/trailer-abertura`.
**23/10:** scratchpads das sessões 244f6e33 e 860a4e4b (logs das noites 21 e 22/10) movidos pra ~/.cache/soccermon-tmp/scratch-antigos/ (o /tmp é RAM e enchia). patrocinios PRONTO (62ed37a2, CI verde, motor 12).
**23/10 tarde:** Miguel aprovou o aviso na quadra quando a Charanga liga ("A CHARANGA ENTROU" + bumbo) → entra na integração 0.9.16. Quer postar mais um curta hoje; depois de tudo, vai atualizar o PC e sugerir skills que viu no Instagram.
**23/10 noite, aprovado pra 0.9.17 (fila, entra quando abrir vaga):** N3 estilo Final Smash (hitstop 0,3 s tingido do tipo, desligado em 8x; faixa diagonal com retrato PMD + nome do golpe só no N3; zoom/tremida; onda de choque) e feedback de quem é atingido em TODOS os golpes de efeito (empurrão/queda real com poeira e estrelas, palavra DERRUBADO/QUEIMADO/CONFUSO… ~1 s na cor do tipo, ícone de status desenhado com anel de contagem, linha no painel). Rodando: int-0916 (patrocínios + golpe por tipo + aviso Charanga + revisão dupla), max-esperar (botão Esperar, vai pra 0.9.16), animatics A/C (B pronto) do vídeo "MODO NOVO com Pokémon não evoluídos".
**23/10 noite, ESTADO:** 0.9.16 no ar (patrocínios, golpe por tipo, Esperar; motor 12). Esperando o "pode subir" do Miguel: **int-0917** (CI verde, prévia soccermon-git-int-0917-…): N3 estilo luta + reação de quem é atingido + funil (balão, medição, isBot, rolagem) + polimentos (retrato sem rosa, só faixa diagonal, "efeito Dragão") + dev server ignora .claude da raiz. Prontas em branch: `assinaturas` (fase 2, ?assinatura=1, motor 13, polida 44ef2caf), vídeo 0916-modo-novo.mp4 (Miguel não viu), propostas `funil` (Home 1 botão etc.), `nomes-quadra`. Rodando: medida do N3 por capitão (Mewtwo +8,5 pp no ar). Log: scratchpad/tarde.md da sessão 05e77ef9.
