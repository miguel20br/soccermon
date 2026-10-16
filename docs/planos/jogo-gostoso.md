# Plano "jogo gostoso" (0.8.3 em diante, 16/10/2026)

Pedido do Miguel: o jogo tem que ficar **gostoso de jogar** (number go up, fluidez, dopamina, vontade de jogar
mais uma copa) **sem virar um amontoado de regras e efeitos**. Fontes: auditoria jogando 9 copas (celular e PC),
pesquisa de jogos parecidos e pesquisa de game feel (Balatro, EA FC, Clash Royale, Vampire Survivors, Retro Bowl,
Super Auto Pets, Slay the Spire, Pokérogue, Duolingo, "Juice it or lose it", "The art of screenshake").

Dados que guiam: 81% jogam em 8x; o maior vazamento é entre começar a copa e jogar a 1ª partida.

## Regras pra não virar bagunça

1. **Um sistema de impacto só**, com 4 níveis: sussurro, toque, batida, explosão. Todo efeito (gol, golpe,
   evolução, carta, título) passa por ele. Efeito que não cabe num nível não entra.
2. **O tamanho do efeito acompanha a importância**: golpe comum = sussurro; gol = batida; gol de virada na final
   e título = explosão.
3. **Um de cada vez**: cartas viram em sequência, números sobem rolando, bônus acendem um por um.
4. **A festa encurta com a repetição**: a 1ª evolução de cada espécie é completa; depois um toque pula.
5. **Funciona em 8x**: lance grande cai pra 1x por meio segundo e volta.
6. **Reduzir movimento troca o canal**: tremor e flash viram cor e som, o retorno nunca some.
7. **Sistema novo = um por versão**, com o ok do Miguel e números de antes e depois.

## Fase 1: bugs da auditoria (sem decisão pendente)

- Evolução do rival comemorada como se fosse sua ("Parabéns!" com som de gol, partida para).
- "Média dos titulares" do draft ignora quem está fora de posição (usa a nota da carta, não a da vaga).
- Quatro "craques" diferentes na tela de resultado: um critério só, ou nomes diferentes.
- Carta Destaque dada na partida da eliminação (prêmio vazio).
- Rival com item de tipo que não existe na Gen 1 (Metal Coat, Black Glasses).
- Cor do rival muda entre seções do resultado; tabela "Seu time na copa" corta coluna a 390 px.

## Fase 2: a base (P)

- `impacto(nível)`: hit-stop, tremor que decai, flash e som numa função só; os `cam.shake` soltos passam por ela.
- Em 8x, gol e golpe decisivo caem pra 1x por ~600 ms.
- Gol: pausa de 100 ms + batida; gol de virada ou na final = explosão; o som do gol sobe um tom a cada gol seu.
- Golpe: só crítico e super efetivo ganham texto e número, na cor do tipo.

## Fase 3: number go up (P/M)

- **Draft:** as 3 cartas viram uma de cada vez (ouro segura um pouco mais, com brilho e som mais agudo); a nota do
  time sobe rolando com "72 → 76" e o "+4" verde; ao contratar, "supera seu Ala Dugtrio por +19".
- **Resultado:** números contam linha a linha com o tom subindo; o craque vem por último, com batida.
- **Recompensa como pacote:** um toque revela em etapas (tipo → silhueta → carta); Shiny e Destaque ganham
  entrada de 1,2 s estilo walkout do FIFA; da 7ª abertura em diante um toque pula tudo.
- **Volta pra Home:** barra da Pokédex enche (47 → 50/151) com "+3 novos".
- **Eliminação também recompensa:** "Nesta copa: +9 vistos, +14 golpes, avatar novo".

## Fase 4: a partida com decisão (M)

- **Intervalo de verdade:** pausa com placar, fôlego, chutes, uma dica ("estão chutando muito de longe") e tática e
  substituição a um toque. Continua sendo escolha sua; dá pra seguir direto.
- **Substituição com informação:** fôlego, posição e "nota na vaga" de quem sai e de quem entra.
- **Velocidade inicial pra quem chega:** 4x ou "Lances" com uma linha explicando, em vez de 1x (13 min por jogo).
- **Celular em pé:** velocidades numa linha, tática e Substituir em outra, última frase da narração por cima da
  quadra, nomes que não se embolam.

## Fase 5: sistemas novos (um por versão, com o ok do Miguel)

| Ideia | Referência | Status |
|---|---|---|
| **Barra de evolução que não zera entre partidas** (sugestão de jogador): vira uma barra de XP da copa, visível na carta entre os jogos | Pokémon (XP), Retro Bowl | decidir: evolui mais vezes por copa |
| **Ligas de dificuldade** depois do 1º título (cada nível soma uma regra; Hall mostra a maior Liga por capitão) | Slay the Spire, Balatro | aprovado a ideia; números a decidir |
| **Gritos do técnico**: 2–3 cartas por jogo ("Pressão total", "Fechar a casinha") | Football Manager, Top Eleven | planejar com calma |
| **Sinergias com degraus visíveis** (3 Água = chuva na quadra; contador "Água 2/3" no draft) | Teamfight Tactics | planejar: substitui o +3%/+6% invisível |
| **Golpe máximo do capitão** com barra de momentum e reta final | Pokémon Unite | planejar com calma |
| **Congelar carta** em momentos específicos | Super Auto Pets | definir os momentos |
| **Ginásios com personalidade**: 2 Pokémon assinatura fixos por líder (Onix do Brock, Starmie da Misty) | — | decidir (mexe na dificuldade); casa com a 0.8.6 |
| **Bênção do Oak** no começo da copa (1 de 3, com risco e recompensa) | Neow (Slay the Spire) | decidir |
| **Piso de nota por rodada do draft** (evitar 3 opções ruins) | — | decidir |
| **Rivais que são times de outros jogadores** | Super Auto Pets, Backpack Battles | pensar melhor (0.10) |
| Replay por link | Pokémon Showdown | entra com os melhores momentos (0.8.5) |
