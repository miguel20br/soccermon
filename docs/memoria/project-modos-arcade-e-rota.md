---
name: project-modos-arcade-e-rota
description: "Divisão de modos decidida em 11/11/2026: Rota Índigo complexa (₽ + Mercado), Copa do Dia e Jogo Rápido arcade (só recompensa 1 de 3)"
metadata:
  node_type: memory
  type: project
  originSessionId: f446d3d3-ffc7-4829-b86e-0a71ade8ebd8
  modified: 2026-11-12T02:57:51.918Z
---

Em 11/11/2026 o Miguel e os amigos discutiram trocar a recompensa da partida pelo Mercado. Ele aprovou a recomendação do Claude seguindo a divisão de modos:
- **Copa do Dia e Jogo Rápido = arcade:** só a recompensa grátis "escolha 1 de 3", sem ₽ e sem a tela do Mercado depois da vitória. O patrocínio aparece às vezes como opção da recompensa, pra não perder os combos.
- **Rota Índigo = complexa:** a vitória paga ₽ no lugar da recompensa, e o jogador gasta nas casas de Mercado do mapa.

**Why:** dados de 14 dias: 49% das 1.848 visitas ao Mercado saíam sem comprar (tela a mais pra metade), mas o patrocínio era 41% das compras e quem tinha patrocínio ganhava o título 49% das vezes, contra 16% de quem não tinha. A complexidade fica onde o jogador escolheu ela.

**How to apply:** feature nova de economia ou recompensa respeita a divisão (arcade sem conta, Rota com gestão). Mudança de equilíbrio continua com antes e depois em números pro Miguel. Ver [[feedback-itens-quebrados-combam]] e [[project-menu-de-modos]].

**Números aprovados (12/11/2026):** Patrocínio em 40% das telas de recompensa do arcade (`SPONSOR_REWARD_CHANCE`) e ₽3 por Jogo vencido na Rota (`ROTA_JOGO_PAY`). Entra na 0.9.51 (branch de integração `v0951`).
