---
name: project-golpe-universal
description: "30/10/2026 — golpe máximo universal (todo capitão chuta, goleiro dá bicuda), parry no lugar da defesa máxima, efeito na bola, N3 com cena de especial; vai na 0.9.29, depois da 0.9.28"
metadata:
  node_type: memory
  type: project
  originSessionId: 152ccaaa-4524-49c1-9d45-e064e56ed88b
  modified: 2026-10-30T16:44:58.566Z
---

Em 30/10/2026 o Miguel aprovou a ideia de um amigo, com as minhas recomendações ("concordo com tudo"). Plano completo em `docs/planos/golpe-universal.md`, na branch `golpe-universal`.

- **N1:** chute forte + status do tipo.
- **N2:** N1 + derruba a linha do chute.
- **N3:** sempre no alvo + efeito do tipo, com cena estilo Street Fighter.
- **Goleiro capitão:** bicuda; só no N3 pode ser gol direto.
- **Parry:** qualquer goleiro, SÓ contra golpe máximo rival (não o tempo todo); perfeito rebate pra um companheiro.
- **Efeito na bola:** AUTOMÁTICO, curva leve que o motor escolhe (sem arrastar).
- **Fantasma:** fica como está (30/10: "assustado não existe nos jogos"); não inventar status fora da Gen 1.
- **Polimento:** ele pediu "tudo bem polido, música na medida, efeitos especiais legais".

**Why:** a defesa máxima do goleiro "não funfava", e o golpe máximo é o momento em que o dedo importa ([[project-menu-de-modos]] concorre: Modo Treinador até 27/11).

**How to apply:**
- A 0.9.28 (branch `ajustes-golpe`) sai antes, sem isto.
- O protótipo leva números de antes/depois pro ok dele antes de valer.
- Motor 17 + republicar a `liga`.
