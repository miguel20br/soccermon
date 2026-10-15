# Roadmap do Soccermon (atualizado em 14/10/2026)

Planos para o futuro combinados com o Miguel. O que já saiu está no [CHANGELOG](../../CHANGELOG.md); o
plano detalhado da 0.6 (cartas) e o roadmap original estão em [v0.6-cartas-e-roadmap.md](v0.6-cartas-e-roadmap.md).
As memórias de preferência do Miguel (cópia das do Claude no PC) estão em [../memoria](../memoria/).

## Já no ar

| Versão | O que entrou |
|---|---|
| 0.5 | Físico, sinergias de história, Ditto, galeria de cartas, laboratório de posições |
| 0.6 | Carta Metal (bronze/prata/ouro), edições especiais (Shiny, Destaque, Ícone, Evento semanal), ícones de tipo, VERSUS na diagonal |
| 0.7 | Contas Google + save na nuvem, evolução no meio da partida, substituição pelo técnico, painel do Pokémon em campo, estatísticas, golpes revisados com animação própria, 6 formações, tela de campeão, menus novos |
| 0.7.1 | Revisão completa: bugs, textos, celular |
| 0.7.2 | Bônus de time recalculados nas trocas e evoluções, privacidade e "Apagar minha conta", preparação para abrir o repo |

## Agora (antes de divulgar)

- [ ] Botão oficial do Google ligado com o Client ID (tira o endereço do Supabase da tela de login)
- [ ] Tela de consentimento OAuth em produção, com nome, logo e link de privacidade
- [x] Repositório público + descrição, site e tópicos; Discussions ligado (15/10/2026, v0.7.3 · Beta aberta)
- [x] Ditto no painel da partida mostrando a forma copiada (14/10/2026)

Polimento combinado em 15/10/2026 (antes de divulgar):
- [ ] Testar pênaltis, tela de campeão e substituição com o robô (`?demo=penaltis`, `?demo=campeao`)
- [ ] "Como jogar" curto na primeira copa (3–4 dicas que dá pra fechar e não voltam)
- [ ] Botão "Dar feedback / reportar bug" na Home e no resultado, apontando pro Discussions
- [ ] Celular deitado: "Nova copa" fica abaixo da dobra (diminuir quadra/logo; visual: decidir com o Miguel)
- [ ] Quadra em pé: nomes dos Pokémon se embolam (esconder quando juntos ou só os do seu time; decidir)

Depois do lançamento: contador anônimo de jogadores (Vercel Analytics + página de privacidade), Phaser
carregado só na partida (Home mais rápida; JS hoje ~600 KB gzip), monitoramento de erros, melhores momentos
como clipe compartilhável.

Plano do trailer e dos posts de lançamento (LinkedIn como projeto pessoal, X como fan game):
[divulgacao-trailer.md](divulgacao-trailer.md).

## Próximas versões

### 0.7.x / 0.8: partida e espetáculo
- **Melhores momentos / replay**: os snapshots da partida já existem; dá para rever gols, defesas e golpes.
- **Quadras temáticas** por ginásio e **treinadores com sprite** na Copa (ideia da 0.6.x).
- **Escolher os golpes do Pokémon** (o Miguel perguntou se no futuro vai dar; o moveset hoje vem de
  assinatura + golpes de nível).
- Evento semanal vindo do servidor (hoje é calculado no aparelho pela semana).

### Meu clube e Pokédex (brainstorm)
- Personalização do clube (nome, sigla, cores, escudo, mascote, quadra, títulos) ligada a uma Pokédex com
  carreira por espécie, edições e medalhas: [personalizacao-e-pokedex.md](personalizacao-e-pokedex.md).

### 0.8+: modo carreira
- Temporadas com ginásios, **insígnias** e a **Liga Índigo**.
- XP, nível e evolução ao longo da carreira (o motor já usa `PokemonInstance` com nível e evolução).
- **Pokédex / álbum**: as edições especiais entram na coleção.
- **Nuzlocke opcional**.
- Ranking.

### Tradução
- **Jogo em inglês** (o trailer EN sai com a interface em português; depois traduzir menus, cartas e narração).

### Mais adiante (vitrine "Em breve" do menu)
- **Modo história**: ginásios, insígnias e a Liga Índigo contados como história.
- **Multiplayer**: desafiar o time de um amigo (o desafio por seed já existe como primeiro passo).
- **Futebol de campo 11x11** (`MatchConfig` já é paramétrico para 7v7/11v11).
- **Geração 2**: os Pokémon de Johto.
- **Modo jogável**: controlar um Pokémon ou o time inteiro, estilo FC (o motor já tem `HumanController` e
  `LiveRunner`).

## Decisões que continuam valendo

- Login só com Google. Nada automático no time do jogador. Diversão antes de realismo.
- Posições, fórmulas e equilíbrio são decididos junto com o Miguel, com números de antes e depois.
- Sem dinheiro nenhum no projeto (sem doações nem anúncios): é o que mais protege o fan game.
