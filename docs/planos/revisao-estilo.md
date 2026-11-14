---
description: O que ainda está no estilo antigo (aparência e animação) depois do kit B e do vestiário, numerado pro Miguel aprovar.
---

# Revisão de estilo: o que falta virar o estilo novo (26/10/2026)

Pedido do Miguel: "atualizar algumas aparências e animações pra serem mais tipo esse novo estilo" e o brand guide junto.
Levantamento a 390x844 (prints fora do repo) mais leitura do CSS. Todo `.btn` já é do kit; o que sobra é o que não usa
as peças novas (sheet, placa, número contornado, barra de topo) e as animações com tempo ou curva fora dos tokens.

| # | Onde | Hoje | Proposta | Custo |
|---|---|---|---|---|
| 1 | Telas de menu (Perfil, Ajuda, Coleção, Sala de troféus, Configurações) | Logo + etiqueta "MENU" + engrenagem quadrada em cima | A barra de topo da Home (nível, taças, x/151) e a placa do título com o voltar | M |
| 2 | Partida: intervalo, ordem dos pênaltis, banco, pedido de tempo | Painel de moldura amarela fina, título sem placa, setas chapadas | Painel do kit com a placa pendurada, botões do kit; entra com pop | M |
| 3 | Carta completa e as outras janelas do meio (inspecionar jogador, cartão do treinador, Novidades, Momentos, conta) | Janela central, X quadrado | Sheet (sobe de baixo no celular, X redondo vermelho) | G |
| 4 | Aviso rápido (toast) | Pílula no rodapé, sem cor: "Não deu pra copiar" parece sucesso | Desce do topo, cor por função (verde deu certo, vermelho erro), ícone, entra e sai animado | P |
| 5 | Resultado | Dobras chapadas (Destaques e gols, Estatísticas) | Abas de pasta (a ativa sobe com faixa dourada) | M |
| 6 | Campeão | Pílulas de borda fina, números parados | Selos com contorno; números contornados contando | M |
| 7 | Perfil, Coleção, Sala de troféus | Abas chapadas, barra de progresso fina | Abas de pasta e barra chanfrada de 14 px com "x/y" dentro | M |
| 8 | Configurações | "Apagar tudo?" numa caixa vermelha no meio da página; rodapé de links sublinhados | ConfirmSheet; rodapé em botões terciários | P |
| 9 | Ajuda | Acordeões e busca de borda fina | Cartões do kit e o campo do kit | P |
| 10 | Animações | Entrada de tela só com fade de 180 ms, curvas `ease` cruas, tempos de 120 a 150 ms | Tudo nos tokens (`--dur-*`, `--ease-out`, `--ease-pop`); tela nova entra subindo 8 px | P |
| 11 | Transição de momento | Só no `?lab=kit` | Ligar em: começar a copa (desenho sorteado), entrar em quadra (bola), título (troféu) | P |

Fora: a partida (o `?lab=hud` vira padrão depois de jogado numa copa inteira) e as cenas de cinema (VS, evolução,
pacote), que ficam mais longas de propósito.
