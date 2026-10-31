---
name: project-menu-de-modos
description: "Decisões de 29/10/2026 do menu de modos (antes do Estádio): 3 modos, Ultimate Team no fim de novembro, Natal separado em dezembro, nomes fechados (Copa, Treinador, História)"
metadata:
  node_type: memory
  type: project
  originSessionId: 152ccaaa-4524-49c1-9d45-e064e56ed88b
  modified: 2026-10-29T17:52:04.721Z
---

Em 29/10/2026 o Miguel pediu um menu de modos bonito antes da Home/Estádio (estilo FIFA ou Fortnite antigo), com 3 modos:
o atual (tudo que existe hoje), Ultimate Team (trancado) e **Modo História** (trancado; esse nome fica).

Decidido:
- Jogador novo não vê o menu antes da 1ª partida; da 2ª visita em diante, com o último modo em destaque.
- Os trancados não podem parecer jogo inacabado: cena viva com sprites, nada de cadeado e "Em breve" seco.
- **Datas:** Ultimate Team no **fim de novembro de 2026** ("nos desafiar"); Modo História "2027".
- **Dezembro de 2026 = atualização de Natal separada.** Não juntar o UT com ela.
- **Nomes (fechados em 29/10):** Modo Copa (o atual), **Modo Treinador** (o Ultimate Team; EN "Trainer Mode") e
  Modo História. "Ultimate" fica só como nome interno no código (`ultimate`). Antes ele tinha recusado Copa/Clube/Jornada,
  Futsal/Time dos Sonhos e Kanto Cup/Clube Pallet; "Arcade" ficou descartado.
- **Sala do time + troféus:** fica pra depois da 0.9.27 (conceitos em `?lab=sala-trofeus&v=a|b|c`, branch `sala-trofeus`).

Conceitos visuais na branch `menu-modos` (`?lab=menu-modos`). Base do UT: `docs/planos/ultimate-team.md`, que ainda
tem as decisões em aberto.

**Why:** organizar o jogo e dar propósito ([[project-menus-ambientes]]); a data é um desafio que ele mesmo propôs.
**How to apply:** o UT precisa caber até o fim de novembro; puxe as decisões do ultimate-team.md logo, e não ocupe
dezembro com outra coisa além do Natal.

**30/10/2026:** ele quer trocar o nome do Modo Treinador pra **Modo História** (falta confirmar o que acontece com o
Modo História de 2027). Está inclinado a trocar o menu de modos pro conceito **C (fatias na diagonal, estilo Smash)**
no lugar do A; prints em scratchpad/alvo/conc-*-{390,1440}.png da sessão 152ccaaa.

**30/10/2026 (2):** o Modo Treinador passa a se chamar **Time Ultimate** (EN "Team Ultimate"); Modo História continua o de 2027.
Menu de modos: **C (Smash) aprovado, adaptado pro celular** (branch `menu-smash`). Decisões do Time Ultimate: 1 ok (mas pesquisar o
Ultimate Team do FC 27 antes), 2 Liga separada, 3 sim (temporada atravessa o Natal), 4 sem limite duro (rival acompanha a média, nível escolhido, objetivos com restrição):
"a dificuldade é o limite", 5 moeda = Fichas, 6 ok (prata com química empata com ouro sem química).

