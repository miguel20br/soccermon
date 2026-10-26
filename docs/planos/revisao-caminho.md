---
description: Revisão do caminho do jogador na copa (26/10/2026): o que se repete, o que esconde a ação e o que cortar, numerado pro Miguel aprovar por número.
---

# Revisão do caminho do jogador (26/10/2026)

Pedido do Miguel ao aprovar o vestiário: "revisar a diagramação de tudo e o caminho do usuário; o objetivo é deixar
tudo mais fácil, objetivo e simples de entender". Como foi feita: um jogador novo (save vazio, 390x844, headless, com
os balões do tutorial) jogou a Copa Relâmpago até a semifinal, mais as abas da Home, a Rota e os demos de campeão e
MT. Cada tela: a ação principal, se ela aparece sem rolar, toques, botões, o que se repete e o que corta. Zero erro
de página. Prints e relatório bruto ficaram fora do repo (scratchpad da sessão).

**O que já está bom:** a ação principal fica sempre à vista na barra de baixo, não há rolagem pro lado em nenhuma
tela, e nenhum balão do tutorial cobre o que aponta.

**Já consertado na branch `vestiario`** (bug, sem precisar de ok): o Golpe Máximo saiu da aba Tática pra barra fixa;
o nome da fase cortava na barra da copa ("QUARTAS DE FIN…") e agora usa o nome curto.

## Lista (aprovar por número)

| # | Tela | Problema visto | Proposta | Recomendo |
|---|---|---|---|---|
| 1 | Resultado, Recompensa, Mercado | A fase aparece 2 a 3 vezes: barra da copa, etiqueta amarela ("VITÓRIA! PRÓXIMA FASE: QUARTAS") e frase ("Oitavas de final vencidas") | A barra da copa vira o único lugar da fase; sai a etiqueta repetida e a frase | sim |
| 2 | Mercado | "₽8" grande no título e de novo na barra da copa | Fica só na barra da copa (que conta moeda por moeda quando ganha) | sim |
| 3 | Draft | A mesma instrução 3 a 4 vezes: título, linha cinza embaixo dele, dica amarela e a barra de baixo | Fica o título e a frase da barra de baixo (perto do dedo); saem a linha cinza e a dica amarela | sim |
| 4 | Recompensa | Tela quase vazia com o pacote fechado: 1 toque a mais só pra abrir | O pacote abre sozinho ao entrar (a animação continua; um toque pula) | sim |
| 5 | Recompensa | "Escolha uma recompensa" no título e de novo na barra de baixo; "Sortear de novo" em cima e "Pular (+1 sorteio)" embaixo | Os dois botões juntos na barra de baixo (Sortear à esquerda, Pular à direita); sai a frase repetida | sim |
| 6 | Resultado | Conquistas novas (treinador liberado, título) só aparecem depois de rolar | Uma faixa "NOVO: Treinador Brock · Título Hat-trick" logo abaixo do placar | sim |
| 7 | Fim de jogo | "Ver resultado · 3 s" vai sozinho e pode tirar o jogador antes de ver o placar final | Tirar o automático: o botão espera o toque (o "Ficar aqui" some) | sim |
| 8 | Mercado | 2 telas de rolagem; os patrocínios (2 cartas grandes + 3 vagas) ocupam metade | Patrocínios viram uma linha "Patrocínios 0 de 3 ›" que abre numa sheet; as contratações sobem | sim |
| 9 | Escalação | Sem a dica antiga, nada diz que a lousa abre a Chave e a Tática | 1 balão na 1ª escalação: "Toque em dois pra trocar. Tática e Chave ficam na lousa" | sim |
| 10 | Formação (1ª copa) | O balão "Escolha a formação" cobre as formações enquanto fala delas | O balão vai pro pé da tela | sim |
| 11 | Partida | A aba Tática tem 20+ controles do mesmo peso | Fica pra 0.9.24 "Beira da quadra" (já planejada: quadra grande e controles em sheet) | depois |
| 12 | Draft | Atributos das cartas candidatas em letra muito pequena | Mexe em carta: só pela galeria `?cards=1`, com variantes, se você quiser | só se quiser |

Fora da lista (vi e não mudaria): o intervalo está claro (placar, sugestão de troca e um botão); a "Média" do VS é o
mesmo número da escalação; o logo grande da Home só aparece na 1ª visita.
