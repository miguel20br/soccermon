# Trailer e divulgação: LinkedIn + X (14/10/2026)

Plano pra gravar um trailer curto e postar o lançamento em dois tons diferentes: LinkedIn como projeto
pessoal (ângulo de engenharia) e X como fan game (ângulo de comunidade Pokémon). Ligado ao
[roadmap](roadmap.md).

## 1. Onde gravar: os atalhos de dev já são o material

`npm run dev` e abrir cada um localmente — todos já montam um cenário pronto, sem precisar jogar de verdade:

| Atalho | O que mostra | Por que serve pro trailer |
|---|---|---|
| `?demo=campeao` | Copa inteira com time forte (Snorlax, Machamp, Mew, Aerodactyl, Mewtwo + banco Dragonite/Pikachu) até a **tela de campeão** | Nomes icônicos pra quem conhece Pokémon, tela final bonita |
| `?demo=ditto` | Time com Ditto + sinergia Mew/Mewtwo (Gênese), primeira partida já tem combo | Golpe de efeito visual + Transformar |
| `?demo=evolucao` | Time de iniciais (Charmander, Squirtle, Bulbasaur, Pikachu), evolução **logo no começo** da partida | O momento de evolução é o gancho mais forte: reconhecível por qualquer fã |
| `?demo=penaltis` | Copa que empata e já cai na tela de escalação pros pênaltis | Tensão, bom pra um corte de "decisão" |

Também vale `?cards=1` pra um clipe rápido da galeria de cartas (bronze/prata/ouro, edições especiais) e os
controles de velocidade (1x–8x) pra pular o "meio de campo chato" e segurar em 1x só no gol/evolução/golpe.

## 2. Ferramentas (grátis, sem marca de água)

- **Gravar:** OBS Studio, Window Capture na janela do navegador. 1080p, 30 ou 60fps (60 se quiser desacelerar
  os melhores momentos depois). CBR ~9000–12000 kbps, encoder NVENC se tiver GPU Nvidia, senão x264 `veryfast`.
- **Editar:** DaVinci Resolve (mais completo) ou Shotcut/OpenShot (mais simples, zero curva de aprendizado) —
  os três são de graça e sem watermark.
- **Música:** Soundraw ou AIVA (trilha royalty-free gerada por IA, escolhe gênero/clima/duração). **Evite
  remix ou trecho da trilha oficial de Pokémon** — é o tipo de coisa que mais chama atenção de retirada, e o
  projeto já é sem dinheiro nenhum por causa disso.
- **Cortes verticais (Reels/Shorts/TikTok), se quiser republicar depois:** Kapwing, editor no navegador.

## 3. Estrutura do trailer (30–40s cobre X, LinkedIn e Reels ao mesmo tempo)

Regra de ouro das pesquisas: você tem **3 a 5 segundos** pra prender antes de rolarem o feed — nada de logo
ou texto nesse início, só a cena mais forte.

| Tempo | O que | Fonte |
|---|---|---|
| 0–3s | Gol ou golpe de efeito mais vistoso (ex.: Mewtwo chutando, combo Mew+Mewtwo) | `?demo=ditto` ou `?demo=campeao` |
| 3–10s | Revela o conceito: carta virando, draft "escolha 1 de 3", nomes dos 151 passando rápido | `?cards=1` + draft |
| 10–20s | O loop principal: partida normal, passe, carrinho, chute — 1 frase curta de contexto (futsal 5v5 + Pokémon) | partida comum |
| 20–28s | Escalada, cortes mais rápidos: evolução em campo, Ditto transformando, gol de taça | `?demo=evolucao`, `?demo=ditto` |
| 28–33s | Nome, "jogue agora", link, (quando público) link do GitHub | tela de campeão / logo |

Música entra junto com o corte de abertura e intensifica na escalada (20–28s).

**Specs por canal:** X aceita até 2min20 em 1080p H.264, mas o mesmo corte de 30–40s funciona nos dois.
No LinkedIn, suba o vídeo nativo (não link de YouTube — o algoritmo prioriza vídeo direto na plataforma).

## 4. Os posts: dois tons pro mesmo lançamento

### X — fala pra quem já entende o universo (fan game)
- Tom casual, minúsculas na boa, **nada de "tenho o prazer de anunciar"** — isso lê como nota de imprensa e
  a galera do X scrolla direto.
- Estrutura de thread:
  1. Gancho + trailer: algo como "fiz um fan game onde os 151 de Kanto jogam futsal 5v5" — jargão à vontade
     (BST, learnset, Gen 1).
  2. O que é: draft roguelike, copa, golpes de Pokémon virando ações de futsal, de graça e sem fins lucrativos.
  3. Um clipe/print de uma feature específica (cartas, evolução em campo).
  4. Link pra jogar + (quando público) link do repo.
  5. CTA soft: pedir o que acharam, não "vender".

### LinkedIn — fala pra rede profissional (projeto pessoal)
- Aqui a audiência não tá lá pelo Pokémon — tá lá pra ver o que você constrói. Puxe o ângulo de engenharia:
  motor determinístico a 20Hz (mesma seed + mesmas ordens = mesma partida, dá pra testar e replay), stack
  (Vite 8, React 19, Phaser 4, TypeScript, Supabase), feito sozinho como projeto pessoal.
- Estrutura: história curta (por que fez / o que aprendeu) → o vídeo do trailer → 2–3 bullets técnicos → link.
- Pode simplificar o contexto Pokémon pra quem não é fã ("fan game baseado em Pokémon"), mas sem soar
  defensivo — é só contexto, não desculpa.

## 5. Ordem sugerida pra hoje/amanhã

1. Miguel termina os itens 0 e 1 (Client ID do Google + tela de consentimento em produção).
2. Claude abre o repositório quando o Miguel confirmar.
3. Gravar os clipes pelos atalhos `?demo=` (15–20 min, roteiro da seção 1).
4. Montar o trailer de 30–40s (seção 3) com música royalty-free.
5. Postar primeiro no X (comunidade de fan game mais receptiva), depois no LinkedIn com o ângulo técnico.

## Fontes da pesquisa

- [How to Make a Game Trailer on a Budget](https://bugnet.io/blog/how-to-make-a-game-trailer-on-a-budget)
- [20 Free Game Trailer & Store Page Tools for Indie Devs (2026)](https://gamineai.com/resources/20-free-game-trailer-store-page-tools-indie-devs-2026-edition)
- [How to Hook the Audience and How Quickly to Do It — Derek Lieu](https://www.derek-lieu.com/blog/2022/10/24/how-to-hook-the-audience-and-how-quickly-to-do-it)
- [How Long Should a Game Trailer Be? (2026 Steam Guidelines)](https://indiegametrailers.com/2024/08/30/how-long-should-a-game-trailer-be/)
- [Best OBS Settings for Recording Gameplay in 2026](https://www.fragclips.com/blog/best-obs-settings-for-recording-gaming)
- [How to Announce Your Indie Game (Without Messing It Up)](https://presskit.gg/field-guides/how-to-announce-indie-game)
- [How to use Twitter to market your game](https://howtomarketagame.com/2021/02/08/how-to-use-twitter-to-market-your-game/)
