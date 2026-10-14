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
- [ ] Repositório público + descrição, site e tópicos; canal da comunidade (Discussions ou Discord)
- [ ] Ditto no painel da partida mostrando a forma copiada

## Próximas versões

### 0.7.x / 0.8: partida e espetáculo
- **Melhores momentos / replay**: os snapshots da partida já existem; dá para rever gols, defesas e golpes.
- **Quadras temáticas** por ginásio e **treinadores com sprite** na Copa (ideia da 0.6.x).
- **Escolher os golpes do Pokémon** (o Miguel perguntou se no futuro vai dar; o moveset hoje vem de
  assinatura + golpes de nível).
- Evento semanal vindo do servidor (hoje é calculado no aparelho pela semana).

### 0.8+: modo carreira
- Temporadas com ginásios, **insígnias** e a **Liga Índigo**.
- XP, nível e evolução ao longo da carreira (o motor já usa `PokemonInstance` com nível e evolução).
- **Pokédex / álbum**: as edições especiais entram na coleção.
- **Nuzlocke opcional**.
- Ranking.

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
