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

## Feito na 0.8.9 (20/10/2026)

| Peça | Onde | Como |
|---|---|---|
| Troca de tela | `src/store/screen-transition.ts` + `src/ui/view-transition.ts` | toda mudança de `screen` no store (até as de dentro, como a última contratação do draft) passa por uma View Transition de 250 ms; sem suporte, Reduzir movimento ou aba escondida: direto |
| Abas e seletores | `src/ui/tab-slide.ts` | um observador só pra página: o marcador da opção ativa de todo `.bc-tabs`/`.bc-seg` desliza; o conteúdo da aba entra com fade (`[role=tabpanel] > *`) |
| Modais e o que tem `data-exit` | `src/ui/exit-motion.ts` | uma cópia sem clique some com fade no lugar do que o React tirou (`data-exit="collapse"` fecha a altura); desligado em teste automático, `?motion=1` liga |
| Draft | `flyCard` em `src/ui/view-transition.ts` | a carta contratada voa até a vaga (`data-fly` → `data-uid`) |
| Listas | `src/ui/motion.css` | linha de amigo entra com fade e sai fechando a altura; a confirmação de remover abre a altura (`interpolate-size`) |
| Conferência | `npm run teleporte -- <base> [LxA]` (`scripts/teleporte.mjs`) | toca em abas, seletores e botões de abrir de 4 telas e acusa o que aparece, some ou pula sem animação; ainda fora do CI |

Falta: View Transition com nome nas peças que existem nas duas telas (logo, carta do capitão, escudo), o resto das
listas (missões, filtros da Pokédex), mais telas no `teleporte` e ele no CI quando estiver estável.

## Retrofit (o que já existe e teleporta)

1. Trocador de telas (Home → Copa → Perfil…): View Transition por tela.
2. Abas do Perfil, da partida (prancheta/tática) e do resultado: sublinhado deslizando + fade do conteúdo.
3. Modais (carta, ficha da Pokédex, configurações, ajuda): entrada/saída.
4. Draft: a carta escolhida voa pro elenco em vez de sumir.
5. Listas que mudam (filtros da Pokédex, amigos, missões): fade + altura.
6. Ferramenta de conferência como a do Tutti (`pnpm teleporte`): um script headless que clica em tudo e acusa o que
   aparece, some ou pula sem animação (entra no CI quando estiver estável).

O Álbum novo (livro por geração, 20/10) já nasce assim: capa abre, página vira, figurinha cola.
