---
name: feedback-nao-travar-com-questionario
description: "Don't use the blocking questionnaire tool while agent deliveries are waiting; ask in text and keep shipping approved work"
metadata:
  node_type: memory
  type: feedback
  originSessionId: e1939d5f-03fc-4882-9c76-204a383245a2
  modified: 2026-10-20T02:40:05.381Z
---

Never use the blocking questionnaire (AskUserQuestion) while finished agent work is waiting to be reviewed or shipped. Ask the questions in plain text (numbered, options with the recommendation first, answer like "1A 2A") and keep shipping what is already approved.

**Why:** on 19/10/2026 a single blocking questionnaire at 03:31 froze the session for 5h29 — four finished deliveries sat 4–6 h waiting because agent notifications are only read after the answer (measured in `docs/planos/pesquisas/velocidade.md`). Miguel approved this as rule 1 of the speed rules (CLAUDE.md "Regras de velocidade"), as a general rule judged per task.

**How to apply:** when agents are running or deliveries are pending, put decisions in the text reply; reserve the blocking tool for moments when nothing else is in flight. Related: [[feedback-browser-sem-janela]].
