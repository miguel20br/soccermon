---
name: retomar-frentes-21-10
description: "Passagem de 21/10/2026 (noite): frentes paradas pelo limite de uso, worktree de cada uma e o próximo passo"
metadata:
  node_type: memory
  type: project
  originSessionId: 244f6e33-1322-4600-b6a0-ca8dcc92462f
  modified: 2026-10-21T20:44:17.857Z
---

No ar: **0.9.3.2** (main c2ca7d2; ENGINE_VERSION 8; Rota Índigo ligada; Liga com motor 8 publicado). Regras de uso de agentes em [[feedback-economia-de-tokens]]; texto em [[feedback-texto-sem-cara-de-ia]]. Retomar UMA ou DUAS frentes por vez, agente NOVO com brief curto (ler o doc + `git log`/`git diff origin/main` do worktree), não retomar os agentes antigos.

| Frente | Worktree (.claude/worktrees/) | Estado | Próximo passo | Modelo |
|---|---|---|---|---|
| CLAUDE.md enxuto (37→14 KB, histórico em docs/planos/historico.md) + skills atualizadas, `scripts/memoria.sh` e `scripts/docs.test.ts` (CLAUDE.md < 16 KB, versão, tabela de skills, índice de docs/memoria) | claudemd (2 commits, push) | pronto | subir junto com a próxima versão aprovada. Ao juntar a `musica`, pôr de volta a linha `soccermon-musica` na tabela de skills (o teste cobra) | — |
| Formações jogando diferente (comportamento na IA por formação, não só %) | formacoes (8 commits + WIP sujo "v6, medindo") | parado no meio | terminar: diagnóstico de comportamento, IA por formação (Losango triângulos, Linha de 3 bola no pivô parede, Rodízio giro, Quadrado pelos lados, Dois pivôs direto, Ferrolho bloco baixo), clipes/rastro por formação, calibrate; textos curtos ("Pewter → Ferrolho (3 fixos)" + ícone de vantagem); encaixe +1,5%. ENGINE_VERSION 9. Doc docs/planos/formacoes.md | Opus |
| Beira da quadra 2 (golpe máximo acende com o capitão com bola em posição de chute e sai na hora; capitão goleiro = defesa máxima; sem gritos; goleiro-linha balanceado; troca de posição e substituição na hora, volante) | beira (1 commit, agente morreu no meio de "latched cue helper") | conferir o que falta | revisar o commit, terminar, números em docs/planos/beira-da-quadra-2.md, decidir se sai do experimento. Vira ENGINE_VERSION 10 na junção com formações | Opus |
| Polimento da Rota (Hall separado Relâmpago x Rota com taça índigo, textos do Miguel no amarelo, "Fim da linha", piada do Caçador de Insetos) | rota-polimento (6 commits, push) | pronto | subir junto com a próxima versão aprovada; conferir a taça índigo na tela de campeão | — |
| Música: rodada 6 + ligar no jogo | musica (1 commit: skill soccermon-musica, scripts/musica, doc docs/planos/pesquisas/musica.md) | rodada 6 (a) em andamento desde 21/10 noite | (a) compor: palmas com timbre de palma de verdade e menos na seção final da Abertura com gancho v2 (vira a Home); temas PRÓPRIOS de Brock, Misty e Rocket e as partidas deles citando o tema; Planalto com SOC-CER-MON mais evidente; groove do Mercado funk v2 como modelo; tudo loopável sem costura; partida separada em 1º e 2º tempo, seções loopáveis por intensidade + JSON de loop/BPM. Amostras e index.html copiados em /home/bartolomeu/Música/soccermon-amostras/index.html (regerar com scripts/musica/render.mjs). (b) ligar no jogo: volume "Música" nas Configurações, crossfade 250 ms, lazy por tela, partida que cresce como experimento | (a) Opus (b) Sonnet |
| Cenas (diretor de cena + abertura em Pallet em ?lab=cenas; estilo Modern Interiors + o resto pintado igual; treinadores pixel art + retrato do Showdown na fala) | cenas (10 commits, push) | pronto, só lab | nada até o Modo história; pode subir só o lab quando quiser | — |
| Duelo melhor de 3 | md3 (3 commits) | esperando "pode subir" desde 0.9.0 | perguntar ao Miguel | — |

Pendências de decisão do Miguel: título grande do vice ("FIM DA LINHA"); trailer usa remix de música dos jogos (trocar pela Abertura nossa?); ligar a regra de movesets únicos (8 espécies, `UNIQUE_MOVESETS`) depois de ver em ?cards=1; ícones no ranking (ver [[lembrete-icones-ranking]]); MCPs sem uso podem ser desligados com /mcp.

Docs só em worktree (não commitados): pesquisa-apis/docs/planos/pesquisas/apis-e-assets.md, historia/docs/planos/historia.md (a versão atualizada foi pra branch cenas).

**Aprovado pelo Miguel em 21/10 (noite), fila:** (1) subir tudo que está pronto (rota-polimento, claudemd, md3, cenas-lab) depois que o agente do claudemd (ADRs, índice, PR template, pre-push, convenções) terminar; (2) `UNIQUE_MOVESETS = true` junto com formações (muda partida: mesma ENGINE_VERSION 9 + edge:liga); (3) ícones no ranking (servidor manda o time; migração em produção aprovada); (4) MTs mais fortes: ele "quase nunca fica em dúvida entre pegar" → análise com antes/depois (skill balanceamento), aplicar só com ok; (5) SOC-CER-MON piscando nas 3 batidas da Abertura na Home, onde tiver música + logo, e no trailer (entra na música etapa b); (6) trailer: testar versão com a Abertura misturada com a música de batalha. Negado pelo classificador (Self-Modification): `.claude/settings.json` com plugins, hook SessionStart do índice e `disable-model-invocation` nas skills: o Miguel faz/autoriza à mão.
