---
name: feedback-browser-sem-janela
description: "Testes de navegador sempre headless (nada de janela roubando foco); contas pessoais do Miguel ficam no Brave, que o Claude não acessa"
metadata:
  node_type: memory
  type: feedback
  originSessionId: a97e8982-8eb5-4a9e-ab1f-a02f57c32faf
  modified: 2026-10-16T18:08:26.056Z
---

Testes visuais do jogo: sempre headless (script Node com Playwright `headless: true`, ou o MCP do Playwright com `PLAYWRIGHT_MCP_HEADLESS=true` já posto em ~/.claude/settings.json). Nunca abrir janela visível.

**Why:** em 16/10/2026 o teste abriu várias janelas do Soccermon e o foco ficava saindo do terminal; o Miguel teve que ficar clicando de volta.

**How to apply:** vale para subagentes também: diga no prompt deles para não usar ferramentas que abrem janela. Contas pessoais dele (TikTok, LinkedIn etc.) estão no Brave, que não dá pra controlar; o perfil pessoal do Chrome (Linux) só aparece no Claude in Chrome quando o Claude Code está logado na conta pessoal dele, não na da Bowe. Sempre confirmar qual navegador antes de usar.
