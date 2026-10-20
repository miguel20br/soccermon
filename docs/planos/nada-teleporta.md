# Nada teleporta (backlog, pedido do Miguel em 20/10/2026)

Mesma regra do Tutti (`~/Projects/midgar/tutti-ai/docs/adr/0005-nada-teleporta.md`): **toda troca de tela, entrada,
saída e mudança de estado tem transição, e nada pula de posição sem movimento.** O que não é instantâneo precisa
parecer (pré-carga, resposta no mesmo quadro). Vale pros menus e telas React do Soccermon; a quadra (Phaser) já tem
o seu próprio movimento.

## Regra (vale já pra tela nova)

- **Troca de tela:** fade/ease de 200–250 ms (`document.startViewTransition` no trocador de telas; navegador sem
  View Transitions troca no corte seco, sem quebrar). O que existe nas duas telas desliza (`view-transition-name`:
  logo, carta do capitão, escudo do clube).
- **Abas, filtros, listas:** a aba ativa desliza (o sublinhado de `.bc-tabs`/`.bc-seg` anda), o conteúdo entra com
  fade; item que entra ou sai da lista anima a altura (`interpolate-size: allow-keywords` onde houver).
- **Modal e painel:** entram e saem (hoje vários só aparecem). Aviso, erro e botão que aparecem depois têm o espaço
  reservado (nada empurra a página).
- **Rolagem:** botão que leva pra outra parte rola suave até ela (ex.: "Ver todos na Pokédex", consertado em 20/10).
- **Tokens:** usar `--ease-out` e `--ease-pop` (já em `src/ui/styles.css`) e criar `--dur-toque` 150 ms, `--dur-ui`
  200 ms, `--dur-tela` 250 ms. Interface até 300 ms; momentos de jogo (pacote, campeão, evolução) podem passar.
- **Movimento reduzido** (Configurações → Reduzir movimento, `reduceMotionOn()`, ou o do sistema): fica fade e cor,
  sai deslocamento, giro, zoom.
- Sem biblioteca de animação nova: CSS + View Transitions + o que o React 19 já faz.

## Retrofit (o que já existe e teleporta)

1. Trocador de telas (Home → Copa → Perfil…): View Transition por tela.
2. Abas do Perfil, da partida (prancheta/tática) e do resultado: sublinhado deslizando + fade do conteúdo.
3. Modais (carta, ficha da Pokédex, configurações, ajuda): entrada/saída.
4. Draft: a carta escolhida voa pro elenco em vez de sumir.
5. Listas que mudam (filtros da Pokédex, amigos, missões): fade + altura.
6. Ferramenta de conferência como a do Tutti (`pnpm teleporte`): um script headless que clica em tudo e acusa o que
   aparece, some ou pula sem animação (entra no CI quando estiver estável).

O Álbum novo (livro por geração, 20/10) já nasce assim: capa abre, página vira, figurinha cola.
