---
description: Brainstorm de Meu clube e Pokédex, antes de virarem plano.
---

# Brainstorm: "Meu clube" (personalização) e Pokédex (15/10/2026)

Ideias pra discutir com o Miguel, não é plano aprovado. Ligado ao [roadmap](roadmap.md) (Pokédex/álbum já estava
previsto pra 0.8+). Regras que continuam valendo: tudo **cosmético**, **nada comprado** (sem moeda paga, sem
loja), nada automático no time dele, carta segue bronze/prata/ouro pela nota.

## A ideia central: um loop só

**Jogar → preencher a Pokédex → desbloquear personalização do clube → mostrar o clube (placar, VERSUS,
Compartilhar).** As duas partes se alimentam: a Dex dá o motivo de jogar mais copas, e o clube é onde as
conquistas aparecem. Referências: o Ultimate Team (escudo, uniforme, estádio e tifo são só visuais e saem de
objetivos), as Collection Challenges e medalhas bronze → platina do Pokémon GO, e os títulos e temas do
Pokémon Auto Chess (desbloqueados por conquista).

## Parte 1: Meu clube

Uma tela nova, "Meu clube", aberta pelo nome do time na Home ou pela barra da conta. Fica salva no save, então
vai junto pra nuvem quando a pessoa está logada.

| # | Ideia | Como aparece no jogo | Esforço |
|---|---|---|---|
| 1 | **Nome fixo do clube + sigla de 3 letras** (hoje o nome é digitado a cada copa) | Nome já preenchido na Nova copa; sigla no placar no celular, onde o nome não cabe | baixo |
| 2 | **Cor principal e secundária** (hoje é sempre vermelho, `PLAYER_COLOR`) | Placar, setinhas dos jogadores, borda da narração, VERSUS, resultado. Se a cor bater com a do rival, ele usa o "uniforme reserva" | médio |
| 3 | **Escudo montável**: formato + símbolo + cores do clube | Placar, VERSUS, tela de campeão, imagem do Compartilhar | médio |
| 4 | **Mascote**: um Pokémon que você já escalou | Corre na quadra da Home, aparece no escudo e na comemoração do título | baixo |
| 5 | **Quadra do clube**: pisos temáticos (as "quadras por ginásio" do roadmap) | Quadra da partida em casa. Vencer um ginásio libera a quadra dele | médio/alto |
| 6 | **Título de treinador**: "Campeão da Liga Índigo", "Caçador de Shiny", "Mestre de Kanto"... | Embaixo do nome no perfil e no Compartilhar | baixo |
| 7 | **Avatar**: a foto do Google ou o sprite de um Pokémon da sua Dex | Barra da conta, perfil | baixo |
| 8 | **Faixa da torcida (tifo)**: uma frase curta | Aparece no VERSUS antes da partida | baixo |
| 9 | **Grito do gol**: o grito (cry) que toca no gol do seu time (do capitão ou do mascote) | Som do gol | baixo |

**Livre desde o início:** nome, sigla, cores e avatar com a foto do Google. **Por conquista:** símbolos do escudo,
quadras, títulos, mascote (precisa estar na Dex).

## Parte 2: Pokédex / álbum

Os 151 de Kanto, cada um com página própria. A carta estilo "Dex" já existe na galeria (`variant: 'dex'` no
`PokeCard2`) e pode virar a página.

| # | Ideia | Detalhe |
|---|---|---|
| 1 | **Visto / jogou** (como "visto / capturado" nos jogos) | Visto: apareceu no seu draft. Jogou: entrou em quadra numa partida. Quem nunca apareceu fica em silhueta |
| 2 | **Carreira de cada espécie** | Partidas, gols, assistências, nota média e títulos com aquele Pokémon. "Seu Gengar já fez 41 gols" é o tipo de dado que dá vontade de compartilhar |
| 3 | **Melhor carta que você já teve** | A página mostra a carta de maior nota daquela espécie que passou pelo seu time |
| 4 | **Coleção de edições** | 4 espaços por espécie: Shiny, Destaque, Ícone, Evento. Completar dá selo |
| 5 | **Medalhas em tiers** (bronze → prata → ouro → platina, como no GO) | "Dex de Kanto" 40/80/120/151, "Todos os iniciais", "Trio dos pássaros lendários", "Tipo Fogo completo", "Shiny de 10 espécies" |
| 6 | **Desafio da semana** (ligado ao evento semanal que já existe) | Na semana do tipo Pedra: escalar 5 Pokémon de Pedra diferentes. Rende selo com a data |
| 7 | **Ficha da espécie** | Tipos, BST, grito (botão pra tocar), sprite animado, cadeia de evolução, golpes que ele usa no Soccermon, posição natural |
| 8 | **Filtros** | Por tipo, posição, raridade, visto/jogou/falta |

**Recompensas:** cada medalha libera algo do "Meu clube": um símbolo de escudo, uma quadra ou um título. Nada
de bônus de atributo em campo, pra não desequilibrar a copa.

## Pontos técnicos

- **Onde salvar:** novo campo `club` e `dex` no save (Zustand persist, versão 5 com migração), que já sobe pra
  nuvem pelo `cloud.ts`. O Supabase não muda: o save inteiro já é um JSON por usuário.
- **Dex retroativa:** hoje o jogo só guarda contadores (`records`), não o histórico de copas. A Dex começa do
  zero na versão em que entrar, exceto o que dá pra tirar da copa em andamento.
- **Cor do clube:** passar `PLAYER_COLOR` pra uma cor vinda do save, no `MatchConfig`/`TeamSetup`. Precisa de
  checagem de contraste com o rival (trocar a dele se ficar parecida).
- **Escudo:** SVG montado na hora (formato + ícone + 2 cores), sem imagem nova pra cada combinação.

## Pra decidir junto

1. **Cor:** paleta curada (~12 cores com bom contraste no placar e na quadra) ou seletor livre? Minha sugestão:
   paleta curada.
2. **Quando conta como "jogou" na Dex:** escalar na copa, entrar em quadra ou vencer uma partida?
3. **Ordem:** começar pelo "Meu clube" básico (nome, sigla, cor; dá pra fazer rápido) e depois a Dex, ou
   fazer a Dex primeiro e usar as recompensas dela pra liberar a personalização?
4. **Mascote na Home:** a quadra animada da Home passa a usar o seu mascote e o seu time em vez de Pokémon
   sorteados?
5. **Pokédex na vitrine:** trocar um card "Em breve" da Home (Geração 2?) por "Pokédex" agora, como anúncio?

## Fontes

- [Pokemon Collection & User Preferences (Pokemon Auto Chess, DeepWiki)](https://deepwiki.com/keldaanCommunity/pokemonAutoChess/5.3-pokemon-collection-and-user-preferences)
- [Pokérogue Candies](https://pokeroguewiki.com/candies/) e [PokéRogue Wiki: Eggs](https://wiki.pokerogue.net/gameplay:eggs)
- [FIFA 20 Ultimate Team: customização (estádio, tifo, uniformes, escudos)](https://realsport101.com/article/fifa-20-ultimate-team-everything-involved-in-the-new-customisation-options-stadium-theme-tifo-celebrations-kits-badges-stadium-match-ball-zidane-drogba)
- [EA FC 25: trocar o nome do clube](https://gamerant.com/ea-sports-fc-25-how-change-ultimate-team-clubs-name/) e [tifos no EA FC 25](https://eathealthy365.com/your-ultimate-guide-to-unlocking-tifos-in-ea-fc-25/)
- [Pokémon GO: Collection Challenges](https://pokemongo.com/post/collections-launch?hl=en) e [Medalhas (Bulbapedia)](https://bulbapedia.bulbagarden.net/wiki/Medal_(GO))
