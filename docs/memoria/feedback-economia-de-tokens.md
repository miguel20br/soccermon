---
name: feedback-economia-de-tokens
description: Miguel quer gastar bem menos tokens sem perder qualidade; regras de como usar agentes no Soccermon
metadata:
  node_type: memory
  type: feedback
  originSessionId: 244f6e33-1322-4600-b6a0-ca8dcc92462f
  modified: 2026-10-21T20:36:08.594Z
---

Em 21/10/2026 a sessão bateu o limite de uso e derrubou 4 agentes; o Miguel pediu pra "rever completamente nosso uso de tokens... mas não quero perder qualidade" e aprovou o plano:

1. Rodada nova = agente NOVO com brief curto apontando docs/skills, não SendMessage pra agente com 300–500k de contexto.
2. Modelo por tarefa: Opus pra motor/equilíbrio/composição/design difícil; Sonnet pra layout, texto, QA de tela, lançamento; Haiku pra busca.
3. No máximo 2–3 agentes em paralelo, priorizando o que ele espera.
4. CLAUDE.md enxuto (histórico de versões em docs/planos/historico.md).
5. Prints: só os essenciais; eu (sessão principal) só abro imagem quando ele precisa ver.
6. calibrate n=200 pra explorar, n=400 só no número final; local só testes relacionados, o CI roda o resto.
7. Respostas a avisos de "ainda esperando" o mais curtas possível.

**Why:** o gasto vinha de contexto gigante reenviado (agentes retomados, CLAUDE.md de 37 KB em todo turno), muitos Opus em paralelo e imagens.
**How to apply:** antes de abrir agente, escolher modelo e escopo mínimos; nunca mais de 3 rodando. Ver [[feedback-nao-travar-com-questionario]].
