# Formações com identidade (pesquisa e protótipo, 21/10/2026)

Pedido do Miguel: "Sinto falta de umas formações melhores talvez. Será que a gente adiciona mais? Mais variedade? Ou
substitui umas atuais? Porque eu queria que elas alterassem o jogo um tico mais."

Dados do jogo no ar: **~65% das copas no Losango (1-2-1)** e 79% na tática Equilibrado. Quase ninguém mexe.

Este doc tem: como as formações funcionam hoje (§1), o quanto elas mudam a partida de verdade (§2), referências
(§3), a proposta (§4), o protótipo com números (§5) e as decisões (§6). Nada mudou no jogo: o protótipo está atrás
de uma chave desligada (`FORMATION_STYLE.on`, só o calibrate liga com `--estilos`).

## Resumo

- **Hoje as 6 formações são iguais no placar.** Vitória entre 47% e 54%, gols entre 3,3 e 3,7, nenhum confronto
  passa de 55%. Elas mudam só onde cada um fica e quem faz o gol (o pivô no 1-1-2, os alas no Rodízio). O
  "Ferrolho" é até o time com **mais posse**. Na tela, o seletor mostra só o nome.
- **Proposta:** manter as 6 e dar **identidade** a cada uma (um ponto forte, um fraco, uma frase e um ícone), pelo
  mesmo caminho da tática. Mais um **pedra-papel-tesoura leve** (+3% pra quem encaixa a formação certa contra a do
  rival), pra trocar de formação antes do jogo valer a pena. Não criar nem tirar formação; goleiro-linha continua
  botão da beira da quadra.
- **Protótipo medido (12.000 partidas):** ninguém domina (**46% a 54%**), o encaixe pesa em 4 dos 5 pares (até
  64%) e os estilos se afastam (Quadrado 20 chutes e 39% de posse, Rodízio 157 passes, pivô da Linha de 3 com 55%
  dos gols). Está **desligado** no jogo; ligar pede `ENGINE_VERSION` novo e republicar a Edge Function da Liga.

## 1. Como funcionam hoje

Tudo mora em `src/engine/formations.ts`. Uma formação é só isto:

| Campo | O que faz | Onde é usado |
|---|---|---|
| `slots` | a posição de cada vaga (GK, FIXO, ALA, PIVO) | `createPlayer` em `match.ts`: o papel dá o "fora da posição" (`positionFactor`, regra única em `modifiers.ts`) |
| `attack` / `defend` | ponto-base de cada vaga com e sem a bola (quadra 40×20) | `homePosition` da IA (`ai-controller.ts`), que ainda puxa pro lado da bola |
| `kickoff` | onde cada um fica na saída de bola | `match.ts` |
| `ui` | onde a vaga aparece no mini-campo | telas |

O que **não** existe: nenhum bônus de atributo por formação, nenhuma regra de IA por formação. A diferença vem só
de onde cada um fica e de **quais papéis** o time tem, porque a IA decide muito pelo papel:

- **Fixo:** é o "xerife" (sai no portador que chega no nosso terço), faz a cobertura, sobe até a intermediária e
  arrisca a **bomba de longe** (só o 1º Fixo da formação, `leadFixo`).
- **Pivô:** o da vaga 4 fica plantado lá na frente (`pivotHold` da tática); no contra-ataque o passe procura ele.
- **Ala:** sem regra própria (é o "resto").
- No **draft**, a formação decide quais posições você escolhe (1-1-2 pede dois pivôs, Ferrolho três fixos).

A **tática** é que mexe em número: `TACTIC_MODS` (`effective.ts`, ±3–8% em atributos e fôlego) e `TACTIC_SHIFT`
(`ai-controller.ts`: sobe/desce a linha, chuta mais ou menos, pressiona mais).

Na tela: o seletor da Escalação mostra **só o nome** (segmentado). A frase da formação aparece na escolha antes do
draft e na Ajuda. Nenhum número, nenhum ponto forte ou fraco.

## 2. O quanto mudam a partida hoje

`npm run calibrate -- --n 400 --formations` (estendido neste trabalho pra mostrar estilo, não só vitória). Cada
formação joga contra as outras 5, com time draftado pra ela (`aiDraftTeam`), tática Equilibrado, 400 rodadas:
**12.000 partidas**, ~4.000 por formação. Erro da taxa de vitória: **±1,6 ponto** (95%).

Por partida, contra as outras formações (65 min de simulação):

| Formação | Vitória | Gols pró | Gols contra | Posse | Chutes | Chutes contra | xG/chute | Passes | Desarmes certos | Gols de Pivô / Ala / Fixo |
|---|---|---|---|---|---|---|---|---|---|---|
| Losango 1-2-1 | 50% | 3,4 | 3,3 | 46% | 15,5 | 17,2 | 0,084 | 129 | 5,3 | 45 / 52 / 3% |
| Quadrado 2-2 | 49% | 3,7 | 3,7 | 40% | 18,3 | 15,8 | 0,083 | 92 | 5,0 | 51 / 42 / 7% |
| Linha de 3 (3-1) | 51% | 3,3 | 3,3 | 54% | 15,9 | 16,2 | 0,083 | 143 | 4,6 | 41 / 54 / 4% |
| Rodízio 4-0 | 47% | 3,3 | 3,4 | 54% | 16,0 | 16,3 | 0,082 | 148 | 3,6 | 0 / 95 / 5% |
| Dois pivôs 1-1-2 | 54% | 3,5 | 3,3 | 50% | 16,5 | 16,7 | 0,083 | 147 | 4,6 | 84 / 12 / 4% |
| Ferrolho | 49% | 3,3 | 3,4 | 56% | 16,3 | 16,3 | 0,081 | 159 | 5,3 | 56 / 0 / 44% |

Confronto direto (% de vitória da linha contra a coluna, os dois mandos somados; ~800 jogos por célula, ±3,5):

|  | 1-2-1 | 2-2 | 3-1 | 4-0 | 1-1-2 | Ferrolho |
|---|---|---|---|---|---|---|
| **1-2-1** | — | 50% | 47% | 53% | 46% | 55% |
| **2-2** | 50% | — | 48% | 49% | 49% | 50% |
| **3-1** | 53% | 53% | — | 54% | 46% | 49% |
| **4-0** | 47% | 51% | 47% | — | 46% | 46% |
| **1-1-2** | 55% | 51% | 54% | 54% | — | 55% |
| **Ferrolho** | 45% | 50% | 51% | 54% | 46% | — |

Leitura:

- **No resultado, são iguais na prática.** Vitória entre 47% e 54%, gols pró e contra entre 3,3 e 3,7. Nenhum
  confronto passa de 55%: não existe "essa ganha daquela". Trocar de formação não muda o placar esperado.
- **No estilo, mudam um pouco, e às vezes ao contrário do nome.** O **Ferrolho** ("retranca") é o time com **mais
  posse (56%) e mais passes (159)**, e sofre os mesmos gols que os outros. O **Quadrado** é o mais direto (40% de
  posse, 92 passes, mais chutes). O Rodízio desarma menos.
- **O que mais muda é quem faz o gol**, e isso vem só do papel: no 1-1-2 o pivô faz 84% dos gols, no Rodízio os
  alas fazem 95%, no Ferrolho o fixo faz 44% (a bomba de longe). É a diferença mais visível hoje, e é pequena pra
  quem não olha estatística.
- **Dois pivôs (54%) é a melhor de leve** e o **Rodízio (47%) a pior**: o desenho mais ofensivo ganha, sem custo.
- Por que 65% ficam no Losango: é o primeiro da lista, é o padrão e nenhuma outra promete (nem entrega) nada.

## 3. Referências

### Futsal de verdade

| Sistema | Como é | Bom em | Fraco em |
|---|---|---|---|
| **1-2-1 (losango)** | fixo, dois alas, pivô | equilíbrio, largura e profundidade; o de ensinar | não tem um trunfo |
| **2-2 (quadrado)** | dois atrás, dois na frente | simples, sólido, bom pra pressionar em linha | estático, pouca troca de posição |
| **3-1** | três atrás, pivô sozinho | o pivô é a referência: segura de costas, gira, faz a parede | depende do pivô; alas precisam de fôlego pra ir e voltar |
| **4-0 (rodízio)** | quatro na linha trocando de lugar | posse, passe curto rápido, tirar a defesa do lugar; nasceu do 3-1 tirando o pivô | o mais difícil de executar; ninguém de referência na área |
| **1-1-2 / dois pivôs** | dois na área rival | pressão no ataque, bola alta e rebote | pouca gente pra voltar |
| **Goleiro-linha (5x4)** | o goleiro vira o 5º de linha | mais chutes e mais gols no ataque | gol vazio quando perde a bola; usado no fim, perdendo |

Estudos com a liga espanhola: o 5x4 aumenta finalização, mas sofre mais gol quando o time está perdendo e nos 8
minutos finais. No jogo isso já existe como **botão da beira da quadra** (experimento), não como formação.

### Jogos

| Jogo | Como a formação importa | O que dá pra levar |
|---|---|---|
| **Football Manager** | formação + "mentalidade" + instruções; o motor muda o comportamento, não o número da carta | a formação dita o estilo; o ganho aparece em estatística (posse, chutes) |
| **EA FC (FC IQ, 25+)** | papéis por posição com **ponto bom e ponto ruim** cada; "familiaridade" com o papel dá rendimento | todo papel tem um custo; mostrar o papel na carta |
| **FIFA/FC Ultimate Team** | química pela posição; tática personalizada (largura, profundidade, gente na área) | posição certa = bônus visível; poucos controles com efeito claro |
| **Inazuma Eleven** | formação com nota de **Ataque/Defesa em estrelas**, nomes próprios | rótulo simples e visual: "Ataque ★★★ Defesa ★" |
| **Super Auto Pets / TFT** | a ordem/lugar decide quem apanha e quem bate; posicionar é a decisão | escolher a formação tem que mudar **quem brilha** no time |
| **Arcade (Sensible Soccer, Mario Strikers)** | poucas formações, cada uma muda nitidamente o jogo | menos opções, mais diferentes |

A lição comum: **cada escolha tem um lado bom e um lado ruim que o jogador vê** (estrela, número, papel), e ela
muda **quem decide** a partida, não só onde as pessoas ficam paradas.

## 4. Proposta: uma identidade por formação

Manter as 6 (os desenhos já são os do futsal e o draft depende deles). Dar a cada uma **um ponto forte e um fraco**,
pelo mesmo caminho da tática (`eff` + IA), e mostrar isso no seletor.

Os números abaixo são os do protótipo (versão 4, a medida em §5). Todos passam pelo mesmo `eff` da tática (só em
campo) e por ajustes da IA que já existem pra tática (`attack`, `defend`, `pivotHold`, `shootBias`, `pressBias`),
mais três novos: passe procura o pivô (`pivotPass`), passe × drible (`passBias`) e bomba do Fixo (`longShot`).

| Formação | Identidade (frase do seletor) | Ponto forte | Ponto fraco | Ganha de | Perde de |
|---|---|---|---|---|---|
| **Losango (1-2-1)** | "O coringa: sem fraqueza, sem trunfo." | Passe e Leitura +2% | nenhuma vantagem de confronto | — | — |
| **Quadrado (2-2)** | "Marca em cima e sai rápido no pivô." | Desarme +3%, pressiona mais, pivô fica lá na frente | Passe −5% | Dois pivôs | Linha de 3 |
| **Linha de 3 (3-1)** | "Toda bola no pivô." | Pivô com Chute e Força +10%; o passe procura ele | Leitura −4% (a linha de 3 abre espaço) | Quadrado | Ferrolho |
| **Rodízio (4-0)** | "Posse, troca de lugar, ninguém parado." | Passe +8%, Velocidade +6%, Drible +3%; prefere passar | Chute −3%, Força −5% | Ferrolho | Dois pivôs |
| **Dois pivôs (1-1-2)** | "Blitz: todo mundo chuta, ninguém volta." | Chute +6%, Força +5%, linha mais alta, chuta mais cedo | Desarme −6%, Leitura −5% | Rodízio | Quadrado |
| **Ferrolho (3 fixos)** | "Tranca a área e solta a bomba de longe." | Desarme e Leitura +7%, Goleiro +8%, linha mais baixa, Fixo chuta de longe 1,5× mais | Chute −7%, Passe −4% | Linha de 3 | Rodízio |

**Pedra-papel-tesoura (ciclo de 5, o Losango fica de fora; "→" = ganha de):** Rodízio → Ferrolho → Linha de 3 → Quadrado → Dois
pivôs → Rodízio. Quem encaixa a formação certa joga com **+3% em tudo** naquele jogo (`COUNTER_FACTOR`). A lógica:

- **Rodízio** passa pelo **Ferrolho**: a posse e a troca de lugar tiram os três fixos do lugar.
- **Ferrolho** fecha a **Linha de 3**: três fixos encaixotam o pivô sozinho.
- **Linha de 3** quebra o **Quadrado**: a bola no pivô pula a pressão em linha.
- **Quadrado** segura os **Dois pivôs**: dois fixos marcam os dois pivôs homem a homem.
- **Dois pivôs** atropela o **Rodízio**: o 4-0 não tem ninguém forte atrás.

Por que um bônus explícito: sem ele, as formações não se "pegam" em nada (a matriz de hoje fica entre 45% e 55%
sem padrão). Com ele, a formação do rival que aparece na Escalação vira um motivo pra trocar a sua antes do jogo,
pagando o custo de jogar alguém fora da posição. É a decisão que falta hoje.

Como mostrar pra quem joga:

- No seletor (antes do draft e na Escalação): nome + **uma frase** + **duas linhas curtas** ("+ Passe e Velocidade",
  "− Chute") + um **ícone desenhado** (SVG no traço do `HudIcon`: losango, quadrado, seta pro pivô, setas em círculo,
  dois alvos, cadeado). Sem emoji.
- Opcional, estilo Inazuma: barrinhas de **Ataque / Defesa / Posse** (3 níveis) no cartão da formação.
- No painel do Pokémon: o bônus da formação como uma linha a mais ("Rodízio: Passe +8%"); a nota da carta não muda.
- Na Escalação e no VERSUS: selo "Vantagem tática" quando a sua formação encaixa contra a do rival (e o aviso
  contrário quando é o rival que encaixa).
- Na quadra: o que muda já aparece sozinho (posse, quem chuta, onde rouba). Pra ajudar a ver: o placar do
  intervalo e as estatísticas da partida já mostram posse e chutes.

Por que **não** mexer na nota da carta: a tática também vale só em campo (`eff`). Formação é escolha do técnico, não
do Pokémon. Pra manter "carta = campo", o bônus aparece como linha separada no painel, não na nota.

O que **não** recomendo agora:

- **Formação "Goleiro-linha" (5x4):** já é o botão do experimento da beira da quadra (`flyGk`). Virar formação
  fixa daria gol vazio o jogo inteiro; é ferramenta de fim de jogo, não de 40 minutos.
- **Substituir alguma:** os desenhos já cobrem os sistemas do futsal. Com identidade, nenhuma fica sobrando.
- **Formação nova "4-0 aberto", "2-1-1"…:** mais nomes sem identidade repetem o problema de hoje.

## 5. Protótipo e números

### Onde está

| Arquivo | O que tem |
|---|---|
| `src/engine/formations.ts` | `FORMATION_STYLES` (a tabela do §4), `COUNTER_FACTOR` e a chave `FORMATION_STYLE.on` (**desligada**) |
| `src/engine/effective.ts` | `eff` multiplica pelo bônus da formação (time e posição) e pelo encaixe contra a do rival |
| `src/engine/controllers/ai-controller.ts` | a formação soma no deslocamento da tática; passe pro pivô, passe × drible, bomba do Fixo |
| `scripts/calibrate.ts` | `--formations` agora mostra estilo e a matriz de confronto; `--estilos` liga o protótipo |

Com a chave desligada a partida é **idêntica** à de hoje (mesma saída do calibrate, byte a byte, e os 131 testes do
motor passam). Por isso não sobe `ENGINE_VERSION` enquanto ela estiver desligada.

Afinei em 4 rodadas de 3.000 partidas (n = 100). Na v1 o Quadrado ia a 62% e o Rodízio caía a 41%, e o encaixe
de +4% dava 70% em confronto. A v4 tirou Velocidade e metade da pressão do Quadrado, deu Velocidade ao Rodízio e
baixou o encaixe pra +3%.

### Antes ⇒ depois (n = 400, as mesmas 12.000 partidas, tática Equilibrado)

| Formação | Vitória | Gols pró | Gols contra | Posse | Chutes | Passes | Desarmes | Gols do Pivô / Ala / Fixo |
|---|---|---|---|---|---|---|---|---|
| Losango 1-2-1 | 50% ⇒ **48%** | 3,4 ⇒ 3,3 | 3,3 ⇒ 3,4 | 46% ⇒ 47% | 15,5 ⇒ 15,6 | 129 ⇒ 130 | 5,3 ⇒ 5,6 | 45/52/3 ⇒ 46/51/3% |
| Quadrado 2-2 | 49% ⇒ **54%** | 3,7 ⇒ 3,9 | 3,7 ⇒ 3,7 | 40% ⇒ **39%** | 18,3 ⇒ **20,0** | 92 ⇒ **89** | 5,0 ⇒ **6,1** | 51/42/7 ⇒ 55/39/6% |
| Linha de 3 (3-1) | 51% ⇒ **49%** | 3,3 ⇒ 3,4 | 3,3 ⇒ 3,5 | 54% ⇒ 55% | 15,9 ⇒ 15,9 | 143 ⇒ 147 | 4,6 ⇒ 5,1 | 41/54/4 ⇒ **55/42/3%** |
| Rodízio 4-0 | 47% ⇒ **46%** | 3,3 ⇒ 3,2 | 3,4 ⇒ 3,4 | 54% ⇒ 54% | 16,0 ⇒ 16,1 | 148 ⇒ **157** | 3,6 ⇒ 3,7 | 0/95/5 ⇒ 0/95/5% |
| Dois pivôs 1-1-2 | 54% ⇒ **53%** | 3,5 ⇒ 3,7 | 3,3 ⇒ 3,5 | 50% ⇒ 50% | 16,5 ⇒ 16,5 | 147 ⇒ 148 | 4,6 ⇒ 4,5 | 84/12/4 ⇒ 82/14/5% |
| Ferrolho | 49% ⇒ **50%** | 3,3 ⇒ 3,3 | 3,4 ⇒ 3,4 | 56% ⇒ 55% | 16,3 ⇒ 17,9 | 159 ⇒ **146** | 5,3 ⇒ **6,4** | 56/0/44 ⇒ **68/0/32%** |

Confronto, antes ⇒ depois (linha contra coluna; em **negrito** os encaixes do ciclo; ±3,5 por célula):

|  | 1-2-1 | 2-2 | 3-1 | 4-0 | 1-1-2 | Ferrolho |
|---|---|---|---|---|---|---|
| **1-2-1** | — | 50 ⇒ 44 | 47 ⇒ 45 | 53 ⇒ 55 | 46 ⇒ 45 | 55 ⇒ 51 |
| **2-2** | 50 ⇒ 56 | — | 48 ⇒ 46 | 49 ⇒ 56 | **49 ⇒ 56** | 50 ⇒ 54 |
| **3-1** | 53 ⇒ 55 | **53 ⇒ 54** | — | 54 ⇒ 50 | 46 ⇒ 49 | 49 ⇒ 36 |
| **4-0** | 47 ⇒ 45 | 51 ⇒ 44 | 47 ⇒ 50 | — | 46 ⇒ 37 | **46 ⇒ 57** |
| **1-1-2** | 55 ⇒ 55 | 51 ⇒ 45 | 54 ⇒ 51 | **54 ⇒ 63** | — | 55 ⇒ 52 |
| **Ferrolho** | 45 ⇒ 49 | 50 ⇒ 46 | **51 ⇒ 64** | 54 ⇒ 43 | 46 ⇒ 48 | — |

### Leitura honesta

- **Ninguém domina:** vitória entre **46% e 54%** contra a média (meta 45–55%). Gols por jogo seguem em ~6,7–7,6.
- **O encaixe funciona em 4 de 5:** Ferrolho × Linha de 3 (51 ⇒ 64), Dois pivôs × Rodízio (54 ⇒ 63), Rodízio ×
  Ferrolho (46 ⇒ 57), Quadrado × Dois pivôs (49 ⇒ 56). **Linha de 3 × Quadrado quase não mexeu (53 ⇒ 54)**: o
  Quadrado novo pressiona mais e anula o +3%. Dá pra subir esse encaixe ou trocar o par.
- **Os estilos ficaram mais claros, mas ainda "um tico":** Quadrado é o mais direto (39% de posse, 20 chutes, 89
  passes, mais desarmes); Rodízio é o que mais passa (157); na Linha de 3 o pivô passou a fazer **55%** dos gols
  (era 41%); no Ferrolho o pivô do contra-ataque faz 68%.
- **O Ferrolho ainda não é retranca no placar:** sofre 3,4 como todo mundo e tem 55% de posse (os três fixos tocam
  a bola atrás). Pra ele "fechar a casinha" de verdade precisa mexer na IA (fixos que não sobem, linha mais baixa
  com a bola), não só em atributo. Fica como próximo passo se você quiser.
- **O Losango caiu de 50% pra 48%** porque não tem encaixe: é o preço de ser o coringa. Se incomodar, +1% a mais.
- **Ressalvas:** times de IA na tática Equilibrado, draft pela nota, sem MT nem jogador humano. A combinação com
  as outras táticas não foi medida (a matriz de táticas leva 45+ min por rodada); a tática soma por cima, do mesmo
  jeito de hoje. Simulação não é diversão: precisa jogar.

### Motor, Duelo e Liga

- **Ligar a chave muda o resultado das partidas:** sobe `ENGINE_VERSION` (hoje 6 ⇒ 7). Os replays guardados dos
  gols da copa (`StageResult.replay`) somem, como em toda subida.
- **Duelo:** os dois lados rodam o mesmo motor e a sala só junta o mesmo deploy (versão + `__APP_BUILD__`). Nada
  a fazer além do deploy. A formação já viaja na escalação (`duel-validate.ts`).
- **Liga (Edge Function `liga`):** ela leva o motor empacotado. Depois de ligar: `npm run edge:liga` e
  `npx -y supabase@latest functions deploy liga --project-ref vszcxacbcabohhdwxfpb --use-api`, senão a Liga recusa
  as partidas. A Liga está fechada até 01/12, então o risco é baixo, mas o passo é obrigatório.
- **Copa do Dia:** o ranking só confere plausibilidade; nada muda.
- Pra ligar de vez: trocar `FORMATION_STYLE.on` por sempre ligado (ou apagar a chave), mostrar os textos no
  seletor (PT e EN em `src/i18n/`), selo de encaixe na Escalação/VERSUS e a linha no painel.

## 6. Decisões pro Miguel

Recomendação primeiro em cada uma. Responder no formato de sempre ("1, ok; 2, ...").

1. **Dar identidade às 6 em vez de criar ou tirar formação?** Recomendo **sim, manter as 6 com identidade**. Os
   desenhos já são os do futsal e o draft depende deles; o problema é que hoje elas não prometem nada.
2. **Os bônus da tabela do §4 (versão 4)?** Recomendo **aprovar como ponto de partida** e você jogar umas copas na
   prévia antes de subir. São passos do tamanho da tática (3–10%).
3. **Pedra-papel-tesoura com +3% em tudo pra quem encaixa?** Recomendo **sim, +3%** (com +4% os confrontos chegavam
   a 70%; com +3% ficam entre 51% e 64%). É o que faz trocar de formação antes do jogo valer a pena.
4. **O ciclo Rodízio → Ferrolho → Linha de 3 → Quadrado → Dois pivôs → Rodízio?** Recomendo **esse**. O Losango
   fica fora de propósito: é a escolha "segura" pra quem não quer pensar.
5. **Mostrar onde?** Recomendo: frase + "+ forte / − fraco" + ícone SVG no seletor (antes do draft e na
   Escalação), linha "Formação" no painel do Pokémon e selo **"Vantagem tática"** na Escalação e no VERSUS. Barras
   estilo Inazuma (Ataque/Defesa/Posse) ficam pra depois, se faltar clareza.
6. **O líder rival troca de formação pra encaixar contra a sua?** Recomendo **não agora**: o rival usa a formação
   fixa do clube (Pewter Ferrolho, Saffron Rodízio...), e isso já vira um quebra-cabeça visível ("o Brock joga no
   Ferrolho, vou de Rodízio"). Reação do rival fica pra quando a beira da quadra sair do experimento.
7. **Formação "Goleiro-linha" (5x4)?** Recomendo **não**: já é o botão da beira da quadra; formação fixa daria gol
   vazio o jogo inteiro.
8. **O Losango continua o padrão da tela de escolha?** Recomendo **sim, mas sem ser o primeiro "por inércia"**:
   mostrar as 6 em grade com a frase de cada uma já resolve. Medir de novo o uso 2 semanas depois.
9. **Liberar na próxima versão (precisa `ENGINE_VERSION` novo e republicar a Edge Function da Liga)?** Recomendo
   **sim, junto com outra mudança de motor**, pra não zerar os replays guardados duas vezes.

## Decidido com o Miguel (21/10/2026)

1. Sim: manter as 6, cada uma com identidade.
2. Sim: a tabela de bônus do §4 como ponto de partida.
3. "Talvez, mas deixar menos importante a diferença de formação": o encaixe vale **+1,5%** (não +3%).
4. "Acho que sim, mas não sei como me sinto com esse sistema meio pedra-papel-tesoura": o ciclo fica, **discreto**.
   Nada de falar em pedra-papel-tesoura no jogo. Só uma linha na prévia do rival ("Pewter Rochedo joga de Ferrolho:
   a vantagem é de quem vem de Rodízio") e um selo pequeno **Vantagem tática** quando a sua encaixa.
5. Sim: frase + forte/fraco + ícone SVG no seletor; a formação no painel do Pokémon.
6. Cada líder fica na formação fixa do clube.
7. Não criar o 5x4.
8. Losango continua padrão, com as 6 em grade e a frase de cada.
9. Sobe sozinha como motor novo (`ENGINE_VERSION` 9).

### Como ficou (implementado)

- Motor: `FORMATION_STYLES` sempre ligado (`src/engine/formations.ts`), `COUNTER_FACTOR` 1,015, `hasEdge`;
  `ENGINE_VERSION` 9, hashes do determinismo novos, teste do ciclo (`formations.test.ts`). A Edge Function da Liga
  foi reempacotada (`npm run edge:liga`); **falta o deploy** (`npx -y supabase@latest functions deploy liga
  --project-ref vszcxacbcabohhdwxfpb --use-api`) junto com a subida.
- Tela (rótulos curtos, pedido do Miguel: nada de frase de efeito): abas da Escalação com nome, desenho e ícone;
  embaixo, ícone + forte/fraco em 2–3 palavras ("+Passe +Vel", "−Chute −Força") e o selo de vantagem só com ícone;
  prévia do rival "Pewter → Ferrolho (3 fixos)" + ícone de vantagem com "Rodízio (4-0)". A frase de cada formação
  ficou só na escolha antes do draft e na Ajuda, mais curta. No painel do Pokémon na partida, a linha da formação
  pra posição dele (com os números) e "Vantagem tática +1,5%". Trocar de formação refaz o bloco com fade.
- O Duelo usa a mesma Escalação sem a linha do rival (a formação do outro só aparece na partida); o encaixe vale
  igual em quadra.

### Antes ⇒ depois na 0.9.3 (motor 8 ⇒ 9, encaixe +1,5%; n = 400, 12.000 partidas cada)

| Formação | Vitória | Gols pró | Gols contra | Posse | Chutes | Passes | Desarmes | Gols do Pivô / Ala / Fixo |
|---|---|---|---|---|---|---|---|---|
| Losango 1-2-1 | 51% ⇒ **49%** | 3,6 ⇒ 3,6 | 3,6 ⇒ 3,6 | 46% ⇒ 47% | 17,0 ⇒ 17,3 | 140 ⇒ 143 | 5,8 ⇒ 6,0 | 44/52/3 ⇒ 46/51/3% |
| Quadrado 2-2 | 48% ⇒ **52%** | 4,0 ⇒ 4,3 | 4,1 ⇒ 4,1 | 40% ⇒ 39% | 20,0 ⇒ **21,6** | 101 ⇒ 96 | 5,5 ⇒ 6,5 | 51/42/7 ⇒ 56/38/6% |
| Linha de 3 (3-1) | 52% ⇒ **47%** | 3,6 ⇒ 3,7 | 3,5 ⇒ 3,8 | 55% ⇒ 55% | 17,4 ⇒ 17,2 | 157 ⇒ 161 | 5,0 ⇒ 5,5 | 43/53/4 ⇒ **54/42/3%** |
| Rodízio 4-0 | 47% ⇒ **49%** | 3,5 ⇒ 3,5 | 3,7 ⇒ 3,6 | 54% ⇒ 55% | 17,4 ⇒ 17,5 | 161 ⇒ **172** | 3,9 ⇒ 4,1 | 0/94/6 ⇒ 0/95/5% |
| Dois pivôs 1-1-2 | 55% ⇒ **53%** | 3,9 ⇒ 4,0 | 3,6 ⇒ 3,9 | 50% ⇒ 49% | 18,1 ⇒ 18,0 | 160 ⇒ 160 | 5,0 ⇒ 4,8 | 84/12/4 ⇒ 81/14/5% |
| Ferrolho | 48% ⇒ **50%** | 3,6 ⇒ 3,7 | 3,8 ⇒ 3,7 | 56% ⇒ 55% | 17,8 ⇒ 19,5 | 173 ⇒ **159** | 5,8 ⇒ **6,9** | 56/0/44 ⇒ **69/0/31%** |

Encaixes do ciclo (linha contra coluna, antes ⇒ depois; ±3,5 por célula): Rodízio × Ferrolho 47 ⇒ **55**,
Ferrolho × Linha de 3 51 ⇒ **60**, Dois pivôs × Rodízio 56 ⇒ 57, Quadrado × Dois pivôs 47 ⇒ 49, Linha de 3 ×
Quadrado 56 ⇒ 52 (o Quadrado novo pressiona mais e come o +1,5%).

- **Ninguém domina:** 47% a 53% (antes 47% a 55%; o Dois pivôs, que era o melhor sem custo, desceu pra 53%).
- **O encaixe ficou leve, como o Miguel pediu:** pesa de verdade em 2 pares (+8 e +9 pontos), quase nada nos outros.
- Gols por jogo: 7,2 a 8,4 (o motor 8 já tinha subido os gols com acréscimos e Pressão final).
- Estilos: Quadrado mais direto (21,6 chutes, 39% de posse), Rodízio o que mais passa (172), pivô da Linha de 3
  com 54% dos gols (era 43%), Ferrolho desarma mais (6,9) e o pivô dele faz 69% dos gols.
- Testes: dois testes presos a seed foram refeitos (golpe máximo: seeds novas varridas 0–89; escanteio: o time do
  teste sem troca automática, pra o cobrador escolhido ficar em quadra).

## Etapa 2: formações que jogam diferente (21/10/2026, esperando o ok do Miguel)

A etapa 1 mexia quase só em número (bônus de atributo): na quadra, as 6 continuavam jogando parecido. Agora cada
formação tem um **comportamento próprio da IA** (`FORMATION_STYLES` em `src/engine/formations.ts`, lido no
`ai-controller.ts`); os bônus de atributo ficaram pequenos e servem só pra acertar o equilíbrio. Continua
`ENGINE_VERSION` 9 (ainda não subiu pra produção), encaixe +1,5%.

| Formação | O que a IA faz agora | Atributo (só pra equilibrar) |
|---|---|---|
| **Losango** (triângulos) | alas por dentro (largura 0,85), apoio a 6,5 m em vez de 9, prefere passe curto e de lado, toca mais do que conduz | Passe +3%, Leitura +2% |
| **Quadrado** (pelos lados) | vagas bem abertas (1,35), apoio procura a lateral, **ultrapassagem**: com a bola de um lado, o fixo daquele lado passa por fora; da linha de fundo, rasteiro pra trás | Passe −5%, Chute −5%, Desarme −3% |
| **Linha de 3** (pivô parede) | o **pivô vem buscar** a bola no nosso campo numa linha de passe livre; na frente da área, de costas e marcado, **devolve pra quem chega de trás**, que bate de primeira (de até 19 m); quem recebe a parede não devolve pro pivô | Passe e Chute +3%; Pivô Chute e Força +10% |
| **Rodízio** (giro) | com a bola, os 4 **trocam de vaga a cada 1,5 s** (fundo → ala → frente → ala); quem passa dispara em diagonal pra área por 1 s | Passe +5%, Vel +4%, Leitura +3% |
| **Dois pivôs** (jogo direto) | passe pra frente vale quase o dobro, gosta de passe longo, procura os pivôs, chuta mais cedo e de até 19 m | Desarme −3% |
| **Ferrolho** (bloco baixo) | sem a bola, bloco 3 m mais baixo e fechado (largura 0,7), quase não acompanha a bola; recuperou, bola longa no pivô ou bomba do fixo | Desarme +4%, Goleiro +5% |

### Comportamento: motor 8 (main) ⇒ agora

`npx tsx scripts/balance/formacoes-comportamento.ts 60`: cada formação × Losango, 60 jogos, olhando só o time da
formação. Em **negrito** a métrica de identidade de cada uma.

| Formação | Passes/jogo | Passe curto (<7 m) | Tabelas e triângulos/jogo | Recebe pelos lados | Largura c/ bola | Chutes de passe do pivô | Troca do último homem/min c/ bola | Recuperação → chute | Bloco sem a bola (altura, largura) | Chutes sofridos |
|---|---|---|---|---|---|---|---|---|---|---|
| Losango | 132 ⇒ 150 | 74% ⇒ **90%** | 55 ⇒ **61** | 10% ⇒ **4%** | 3,0 ⇒ 2,6 m | 19% ⇒ 23% | 1,8 ⇒ 2,9 | 5,6 ⇒ 5,7 s | 16,3/2,9 ⇒ 16,2/2,5 m | 18,6 ⇒ 16,9 |
| Quadrado | 101 ⇒ 125 | 72% ⇒ 32% | 46 ⇒ 72 | 6% ⇒ **55%** | 3,4 ⇒ **4,9 m** | 18% ⇒ 16% | 11,6 ⇒ 12,2 | 4,7 ⇒ 7,6 s | 15,3/3,2 ⇒ 15,7/4,1 m | 16,3 ⇒ 14,0 |
| Linha de 3 | 148 ⇒ 159 | 64% ⇒ 40% | 69 ⇒ 86 | 21% ⇒ 44% | 3,4 ⇒ 4,1 m | 20% ⇒ **34%** | 4,8 ⇒ 3,8 | 6,9 ⇒ 8,8 s | 15,7/3,4 ⇒ 15,5/4,2 m | 16,8 ⇒ 15,4 |
| Rodízio | 164 ⇒ 128 | 75% ⇒ 79% | 68 ⇒ 38 | 18% ⇒ 7% | 3,4 ⇒ 2,4 m | — | 6,5 ⇒ **13,9** | 7,6 ⇒ 4,4 s | 15,7/3,4 ⇒ 16,1/3,0 m | 16,7 ⇒ 21,3 |
| Dois pivôs | 164 ⇒ 140 | 88% ⇒ 87% | 66 ⇒ 57 | 5% ⇒ 5% | 2,6 ⇒ 2,5 m | 26% ⇒ 21% | 5,1 ⇒ 4,6 | 7,1 ⇒ **4,9 s** | 15,6/2,3 ⇒ 15,6/2,2 m | 18,4 ⇒ 19,3 |
| Ferrolho | 166 ⇒ 120 | 75% ⇒ 77% | 74 ⇒ 44 | 22% ⇒ 13% | 3,5 ⇒ 3,0 m | 10% ⇒ 9% | 16,8 ⇒ 15,1 | 7,2 ⇒ **4,4 s** | 16,4/3,3 ⇒ **14,5/2,5 m** | 17,5 ⇒ 20,4 |

Leitura: o Quadrado passou a receber **mais da metade** das bolas pelos lados (era 6%); na Linha de 3, **1 em cada 3
chutes** sai de passe do pivô (era 1 em 5); o Rodízio troca o último homem **2×** mais; o Losango é o que mais toca
curto e por dentro; Dois pivôs e Ferrolho chegam ao chute em ~4,5 s depois de recuperar (eram ~7 s). O Ferrolho
fecha mais baixo e estreito, e por isso **sofre mais chutes** (de fora); os gols contra ficam iguais.
O que não apareceu: o "passe longo" do Dois pivôs (passes de 10 m+ pra frente seguem em ~1% pra todo mundo; o jogo
direto aparece como menos passes e chute mais cedo). O Rodízio virou time de ataque rápido (menos passes, mais
chutes pros dois lados), não de posse.

### Vitória: motor 8 ⇒ etapa 1 ⇒ agora (`npm run calibrate -- --n 400 --formations`, 12.000 partidas, ±1,6)

| Formação | Vitória | Gols pró/contra (agora) | Posse | Chutes | Passes | Gols Pivô/Ala/Fixo |
|---|---|---|---|---|---|---|
| Losango | 51% ⇒ 49% ⇒ **48%** | 3,8/3,8 | 47% | 17,9 | 146 | 49/48/3% |
| Quadrado | 48% ⇒ 52% ⇒ **50%** | 4,3/4,3 | 51% | 22,9 | 116 | 51/43/5% |
| Linha de 3 | 52% ⇒ 47% ⇒ **48%** | 3,6/3,7 | 64% | 17,3 | 168 | 49/47/4% |
| Rodízio | 47% ⇒ 49% ⇒ **50%** | 4,6/4,6 | 42% | 22,3 | 126 | 0/91/9% |
| Dois pivôs | 55% ⇒ 53% ⇒ **51%** | 4,4/4,3 | 45% | 22,2 | 139 | 83/15/2% |
| Ferrolho | 48% ⇒ 50% ⇒ **53%** | 4,8/4,6 | 51% | 24,4 | 126 | 71/0/29% |

Encaixes do ciclo (linha contra coluna, motor 8 ⇒ etapa 1 ⇒ agora; ±3,5): Rodízio × Ferrolho 47 ⇒ 55 ⇒ **58**,
Ferrolho × Linha de 3 51 ⇒ 60 ⇒ **60**, Dois pivôs × Rodízio 56 ⇒ 57 ⇒ **56**, Quadrado × Dois pivôs 47 ⇒ 49 ⇒
**58**, Linha de 3 × Quadrado 56 ⇒ 52 ⇒ **54**. Os 5 pares agora pesam pro lado certo. Fora do ciclo, o maior é
**Dois pivôs × Losango 62%** (era 55%): o Losango fechado por dentro sofre com os dois pivôs.

- **Ninguém domina:** 48% a 53% (meta 45–55%). Na exploração (n = 200) o Quadrado novo foi a 59%; caiu pra 50%
  com Passe/Chute −5%, Desarme −3%, linha 1 m mais baixa e menos pressão (`pressBias` 0,02 ⇒ 0,01).
- **Gols por jogo subiram:** 7,3 a 9,4 (antes 7,2 a 8,4). Rodízio e Ferrolho são os jogos mais abertos.
- Ressalvas: IA contra IA na tática Equilibrado, draft pela nota, sem MT nem jogador humano; a combinação com as
  outras táticas não foi medida. Simulação não é diversão: precisa jogar (`?demo=lider&clube=<id>&formacao=4-0` mostra
  o mesmo time em outra formação).
- Testes: hashes do determinismo novos; o teste do golpe máximo ganhou seeds novas (2 e 6, varridas de 0 a 89).

### Decisões pro Miguel (etapa 2)

1. **O comportamento de cada formação (tabela acima)?** Recomendo **aprovar e jogar na prévia** antes de subir:
   o que mais aparece a olho é o Quadrado pelos lados, o pivô da Linha de 3 vindo buscar e o giro do Rodízio.
2. **Os bônus de atributo pra equilibrar (Quadrado −5% Passe/Chute, −3% Desarme; Rodízio +5/+4/+3%)?** Recomendo
   **sim**: deixam as 6 entre 48% e 53%.
3. **Gols por jogo subindo pra 7–9?** Recomendo **deixar** (diversão > realismo).
4. **Rodízio virou time de ataque rápido, não de posse.** Recomendo **aceitar** (combina com "passe e corre") e
   trocar o texto se você preferir; dá pra devolver a posse tirando o "passe e corre", mas o giro some no meio.
5. **Dois pivôs × Losango 62% fora do ciclo.** Recomendo **deixar por enquanto** e olhar de novo depois de jogar.

## Fontes

- [FA: Attacking systems in futsal](https://community.thefa.com/coaching/futsal/b/game-guide/posts/attacking-systems-in-futsal-)
- [We Make Footballers: Four6zero formation rooted in futsal](https://wemakefootballers.com/uk/news/four6zero-formation-rooted-in-futsal)
- [EF Deportes: táticas do sistema 3x1 no futsal](https://efdeportes.com/efd180/taticas-do-sistema-3x1-no-futsal.htm)
- [FIFA Training Centre: unopposed build up (futsal)](https://fifatrainingcentre.com/en/game/tournaments/fifa-futsal-world-cup/unopposed-build-up.php)
- [FIFA Training Centre: Higuita, the fly goalkeeper](https://www.fifatrainingcentre.com/en/game/individual-qualities/futsal-stars/higuita-the-fly-goalkeeper.php)
- [futsal.tech: power play](https://futsal.tech/en/special/pp)
- [Apunts: gols com goleiro-linha no futsal](https://revista-apunts.com/en/?p=35263)
- [UBI: momento crítico e 5x4 no futsal de elite](https://ubibliorum.ubi.pt/handle/10400.6/7557)
- [EA: FC 25 Gameplay Deep Dive (FC IQ, papéis)](https://www.ea.com/en/games/ea-sports-fc/fc-25/news/pitch-notes-fc-25-gameplay-deep-dive)
- [FUT.GG: táticas personalizadas](https://www.fut.gg/tactics/4-2-3-1-wide/)
- [Inazuma Eleven Wiki: formações com Ataque/Defesa](https://inazuma-eleven.fandom.com/wiki/Shinsei_Inazuma_Japan_(Galaxy))
- [Super Auto Pets: posição decide a luta](https://twoaveragegamers.com/super-auto-pets-win-more-consistently-with-this-ultimate-guide/)
- [FM Scout: como montar uma tática](https://www.fmscout.com/a-how-to-create-a-successful-tactic.html?pg=3)
