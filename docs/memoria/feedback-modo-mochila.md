---
name: feedback-modo-mochila
description: Claude pode desligar o modo mochila sozinho; script aceita on [horas]|off|status
metadata:
  type: feedback
---

Em 24/10 o Miguel deu liberdade pro Claude desligar o modo mochila (tampa fechada sem suspender) sozinho. Script `~/.config/hypr/scripts/modo-mochila`: `on [2|1.5|90m]` (desliga sozinho), `off`, `status`; Super+Alt+M liga/desliga, Super+Alt+Shift+M pergunta as horas.

**Why:** ele sai com o PC na mochila e esquece ligado; a bateria sofre.
**How to apply:** quando o trabalho que precisava do PC acordado acabar, rode `modo-mochila off` (não use o toggle sem argumento, que pode ligar). Pra trabalho noturno, prefira `on N` com tempo.
