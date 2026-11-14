---
name: feedback-um-agente-pesado-por-vez
description: 3 agentes com navegador/vitest/render ao mesmo tempo estouram os 7,5 GB e o systemd-oomd mata o terminal inteiro (sessão fecha)
metadata:
  type: feedback
---

Em 12/11/2026 a sessão do Claude Code fechou 4 vezes seguidas: o systemd-oomd matou o escopo do terminal (`journalctl | grep oomd`: "killed 129 process(es)… memory pressure 87% > 50%") com 3 agentes rodando prints headless, check e render de vídeo ao mesmo tempo. Os agentes morrem junto.

**Why:** a máquina tem 7,5 GB; o limite "3 agentes em paralelo" vale pra agente leve (código, texto), não pra três com Chromium + vitest + ffmpeg.

**How to apply:** agente que abre navegador, roda check ou renderiza vídeo: um por vez (no máximo um pesado + um leve). Se a sessão "fechar sozinha", olhe `journalctl --since -1h | grep -i oom` antes de retomar. Agentes fazem commit a cada passo. Ver [[feedback-economia-de-tokens]].
