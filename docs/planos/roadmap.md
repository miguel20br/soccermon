---
description: Roadmap do Soccermon: o que vem depois.
---

# Roadmap do Soccermon (atualizado em 16/10/2026)

**Plano de lançamento e versões 0.8.3 → 1.0: [lancamento.md](lancamento.md).** Tela de campeão: [tela-campeao.md](tela-campeao.md).

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
| 0.8 | Perfil, Pokédex, Golpedex, golpes da Gen 1, MT do ginásio, jogo em inglês, estatísticas anônimas |
| 0.8.2 | Hall da Fama com desfile, prêmios e seleção da copa, recordes, gols da campanha, card do título 9:16/1:1, celular deitado, Mimic |

## Agora (antes de divulgar)

- [x] Botão oficial do Google ligado com o Client ID (tira o endereço do Supabase da tela de login) (16/10/2026)
- [x] Tela de consentimento OAuth em produção, com nome, logo e link de privacidade (15/10/2026)
- [x] Repositório público + descrição, site e tópicos; Discussions ligado (15/10/2026, v0.7.3 · Beta aberta)
- [x] Ditto no painel da partida mostrando a forma copiada (14/10/2026)

Polimento combinado em 15/10/2026 (antes de divulgar):
- [x] Testar pênaltis, tela de campeão e substituição com o robô (16/10/2026, headless)
- [x] "Como jogar" curto na primeira copa (3–4 dicas que dá pra fechar e não voltam)
- [x] Botão "Dar feedback / reportar bug" na Home e no resultado, apontando pro Discussions
- [x] Celular deitado: "Nova copa" fica abaixo da dobra (diminuir quadra/logo; visual: decidir com o Miguel)
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
- **Jogo em inglês, tradução completa** (pedido do Miguel, 15/10/2026): menus, cartas, narração, Ajuda, Perfil,
  Pokédex e Golpedex, com os **nomes oficiais em inglês dos jogos originais** (golpes, habilidades, itens, tipos,
  status, líderes e cidades de Kanto, frases como "It's super effective!"), nunca traduzidos de volta do
  português. Idioma pelo navegador + seletor em Configurações e na tela inicial. Em andamento no branch
  `traducao`; o que depende dos golpes novos e da MT fica em `docs/planos/traducao-pendente.md`.

### Mais adiante (vitrine "Em breve" do menu)
- **Modo história**: ginásios, insígnias e a Liga Índigo contados como história.
- **Multiplayer**: desafiar o time de um amigo (o desafio por seed já existe como primeiro passo).
- **Futebol de campo 11x11** (`MatchConfig` já é paramétrico para 7v7/11v11).
- **Geração 2**: os Pokémon de Johto.
- **1.0 = lançamento oficial** com tudo do "Em breve" (decisão do Miguel, 16/10/2026). Depois da 1.0: modo jogável,
  Gens 3 a 9, personalização absurda e modo Ultimate Team (detalhes em [lancamento.md](lancamento.md)).
- **Pokédex por geração (sugestão do Triple M, 20/10/2026):** quando a Gen 2 sair, a Pokédex separa em duas, como os
  livros do Álbum (Kanto e Johto), cada uma com a sua conta e a sua platina.
- **Sala de troféus (20/10/2026):** deixar físico o que hoje é lista (troféus da Copa, Copa do Dia, Duelo, Liga,
  medalhas, escudo, camisa, faixa). Brainstorm e decisões em [sala-de-trofeus.md](sala-de-trofeus.md).
- **Nada teleporta (20/10/2026):** menus e telas com transição em tudo, como no Tutti; regra e retrofit em
  [nada-teleporta.md](nada-teleporta.md).
- **Ultimate Team no Em breve (20/10/2026):** o Miguel quer dois modos principais, o futsal casual (Copa) e o
  Ultimate Team (time da temporada, pacotes, reset por temporada). Proposta com opções e decisões em
  [ultimate-team.md](ultimate-team.md); se entra na 1.0 é a decisão 6 de lá.

## Decisões que continuam valendo

- Login só com Google. Nada automático no time do jogador. Diversão antes de realismo.
- Posições, fórmulas e equilíbrio são decididos junto com o Miguel, com números de antes e depois.
- Sem dinheiro nenhum no projeto (sem doações nem anúncios): é o que mais protege o fan game.
