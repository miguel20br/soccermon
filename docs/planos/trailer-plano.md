# Plano do trailer de lançamento (15/10/2026, revisado com o Miguel)

Baseado em [trailer-pesquisa.md](trailer-pesquisa.md) (o Miguel chegou nas mesmas conclusões) e no roteiro de
[divulgacao-trailer.md](divulgacao-trailer.md). Textos e estrutura aprovados pelo Miguel; o visual (título,
abertura) passa por ele em rascunho antes do final.

## Resumo

- **Duração:** ~33 s.
- **4 vídeos:** português e inglês, cada um em **16:9** (1920×1080, X e LinkedIn desktop) e **9:16**
  (1080×1920, celular/Reels).
- **Sem narração.** Texto curto na tela, **música de verdade** (ver "Música"), gritos e efeitos do jogo.
- **Gameplay real** do Soccermon, gravado quadro a quadro de partidas escolhidas a dedo.
- **Stack:** motor do jogo (caça de seeds) → Chromium headless (captura com tempo virtual) → HyperFrames
  (composição e render) → ffmpeg (versões).

## Storyboard

| # | Tempo (s) | Cena | Texto PT | Texto EN (proposta) | Áudio |
|---|---|---|---|---|---|
| 0 | 0,0–4,0 | **Abertura:** dois Pokémon se encarando (retratos PMD "determinado", entrando pelos lados, closes alternados) → close na bola no centro da quadra → **apito** | — | — | silêncio tenso, apito, a música entra no corte |
| 1 | 4,0–6,5 | **Gancho** (testar 3 versões no rascunho): evolução no meio da partida / golpe virando gol / a abertura emendando direto no lance | — | — | grito do Pokémon |
| 2 | 6,5–9,5 | Draft: 3 cartas viram, uma voa pra vaga | **Escolha seu time entre os 151 Pokémon de Kanto** | Pick your team from all 151 Kanto Pokémon | batida |
| 3 | 9,5–12,5 | VERSUS na diagonal | **Monte seu time e enfrente batalhas** | Build your squad and take on battles | impacto no corte |
| 4 | 12,5–16,5 | Partida: tabela, drible, chute, gol | **Modo futsal 5x5** | 5v5 indoor soccer | ritmo cheio |
| 5 | 16,5–19,5 | Montagem de golpes (Flamethrower, Thunderbolt, Hydro Pump, Psychic) | **Mais de 100 movimentos** | 100+ moves | efeitos dos golpes |
| 6 | 19,5–22,0 | Ditto se transforma + combo Gênese (Mew + Mewtwo) | — | — | — |
| 7 | 22,0–25,0 | Painel do time, tática, substituição | **Seja o técnico do seu próprio time** | Be the manager of your own team | respiro na batida |
| 8 | 25,0–28,5 | Pênalti decisivo → campeão com troféu | **E conquiste o estrelato** | And rise to stardom | subida até o clímax |
| 9 | 28,5–33,0 | **Final:** um Pokémon voa em direção à tela e "forma" o título SOCCERMON | **Beta aberta · Jogue grátis no navegador** + site | Open beta · Play free in your browser + site | acorde final |

Os cortes caem na batida da música escolhida (ajustar os tempos ao BPM dela).

## Abertura faroeste (decidida 15/10/2026)

Cena 0 do storyboard, ~4 s, sem texto, em faixa de cinema (barras pretas em cima e embaixo):

| Plano | Duração | O quê |
|---|---|---|
| 0a | ~0,9 s | Close extremo nos **olhos do Pikachu** (retrato PMD "determinado", ampliado em pixel nítido), silêncio tenso |
| 0b | ~0,9 s | Close extremo nos **olhos do Mewtwo**, espelhado pra encarar o Pikachu |
| 0c | ~0,6 s | Corte seco pra **bola** parada no centro da quadra |
| 0d | ~1,2 s | **Zoom out** da bola até mostrar a quadra inteira com os dois times posicionados (quadro real do jogo no tick 0) |
| 0e | — | **Apito** e corte pro gancho; a música entra aqui |

## Logo e tagline (decididos 15/10/2026)

- **Logo: "I · Evolução"** (`trailer/arte/logo/hibridos.py`, função `evolucao`): SOCCERMON no meio de uma
  evolução, com os raios da tela de evolução atrás; "SOCC" em silhueta branca, "ERMON" dourado com volume, e o O é
  uma **carta holográfica com a bola**. Letras construídas por código (sem fonte de terceiros).
- **Tagline:** **"Temos que chutar!"** (PT) / **"Gotta kick 'em all!"** (EN), paródia do bordão do desenho.
- Arquivos: `i-evolucao-pt.svg`, `i-evolucao-en.svg` (render: `node trailer/arte/logo/render-svg.mjs`).
- Frases soltas pros posts/cenas: "O Snorlax fecha o gol", "O Ditto joga em todas as posições", "Até o Magikarp
  pode ser titular", "Pikachu, eu escolho você… de pivô".

## Música (decidida 15/10/2026)

- **"Pokémon Red/Blue/Yellow - Trainer Battle Remix (5500 subs special)", por Bliitzit** (YouTube). Arquivo local em
  `trailer/musica/` (fora do git). ~178 BPM (batida 0,337 s, compasso 1,348 s); 1º ataque forte em 2,3 s.
- **Abertura em silêncio:** olhos do Pikachu → olhos do Mewtwo, só tensão (vento, sem música). A música começa do
  **segundo 0:00** junto com o **zoom out da bola**; o ataque forte de 2,3 s marca o apito/primeira jogada, e daí os
  cortes caem nos compassos.
- Crédito no fim do vídeo e nos posts: "Música: Trainer Battle Remix por Bliitzit".

## Título (cartela final e abertura)

O Miguel achou que a fonte do logo precisa mudar (15/10): o logo novo sai da skill `logo-design`
(kaankiziltug/logo-design-skill, instalada em ~/.claude/skills): briefing, 3 conceitos, testes em 16 px, escolha dele. Proposta pro trailer:
- **A bola de futsal no lugar do primeiro "O"** de SOCCERMON, girando quando o título se forma.
- **Formação:** o Pokémon voa do fundo em direção à câmera, crescendo; quando "passa" pela tela, um clarão e as
  letras se encaixam uma a uma (efeito pixel, sem brilho genérico de template).
- Embaixo, "Beta aberta" num selo menor e o endereço do site.
- Mostrar 2 ou 3 variações em quadros parados antes de animar.

## Música

O Miguel quer uma música de verdade (sem monetizar nada). Ponto prático, não jurídico: X, LinkedIn e Instagram
detectam música com direitos autorais e podem **silenciar ou derrubar o post** automaticamente, mesmo sem
dinheiro envolvido. Isso mataria o post de lançamento. Opções:
1. **Faixa royalty-free de verdade** (YouTube Audio Library, Pixabay Music, Kevin MacLeod/Incompetech com
   crédito): segura nas redes. Recomendado.
2. **Faixa gerada por IA** com licença clara.
3. **Uma música específica que o Miguel escolher**: dá pra usar, sabendo do risco de silenciamento.

Cortes sincronizados com a batida: o Claude analisa o BPM e os picos da faixa (ffmpeg/análise de áudio) e
encaixa os cortes.

## Versão 9:16

Composição própria (não é corte do 16:9, senão a quadra perde as laterais): quadra no meio da tela, texto em
cima e embaixo, retratos da abertura empilhados (um em cima, outro embaixo, se encarando).

## Inglês

O jogo hoje é só em português. No trailer em inglês, a interface e a narração que aparecem nas cenas ficam em
português; dá pra (a) aceitar, (b) priorizar cenas com pouco texto de interface na versão EN, ou (c) colocar um
"Currently in Portuguese" pequeno na cartela final.

## Passo a passo

1. **Ferramentas:** pasta `trailer/` no repo (composição, scripts; quadros e vídeos gerados no `.gitignore`),
   atalho só de dev `?demo=trailer&cena=N` e script de captura quadro a quadro com `game.step` (validado).
2. **Caça de lances:** centenas de partidas headless pontuando evolução cedo, gol de golpe, Ditto, combo e
   pênalti decisivo. Miniaturas pro Miguel escolher.
3. **Gravação** das cenas em 1080p (16:9) e no enquadramento do 9:16.
4. **Abertura e título:** quadros parados das variações pro Miguel escolher, depois animação.
5. **Música:** Miguel escolhe a faixa; o Claude marca BPM e picos e ajusta os tempos do storyboard.
6. **Montagem** no HyperFrames (uma composição por formato, textos por idioma como variáveis) e **rascunho**.
   Miguel assiste e pede ajustes.
7. **Final:** revisão dos 4 críticos (design, leitura no celular, ritmo, marca/fatos), render dos 4 vídeos,
   capa e textos dos posts. O endereço do site entra quando o domínio estiver comprado.

## Riscos e planos B

| Risco | Plano B |
|---|---|
| ~~Phaser não respeita o tempo virtual~~ **Resolvido (15/10):** o tempo virtual do Chromium não controla o Phaser, mas pausar o loop (`game.loop.sleep()`) e chamar `game.step(t, 1000/30)` avança exatamente 1/30 s por quadro (testado: 60 quadros = 39,7 ticks, esperado ~40; 3,2 s reais). Exposto só no dev como `window.__soccermonGame` | — |
| Render pesado no celular | Rascunho aqui com 1 worker; final no PC |
| Lance raro não aparece na caça | Montar o cenário direto, como os `?demo=` |
| Música silenciada pelas redes | Trocar por royalty-free (a montagem segue igual) |

## Decidido com o Miguel (15/10/2026)

1. **Música:** uma de Pokémon (sugestão: tema de batalha de Líder de Ginásio ou do Campeão, Gen 1); o Miguel
   manda o arquivo. Se a rede silenciar, troca a faixa e re-renderiza.
2. **Quem voa pra formar o título:** Charizard (o rastro de fogo acende as letras).
3. **Abertura:** Pikachu × Mewtwo (retratos "determinado").
4. **Inglês:** textos da tabela, com "5v5 indoor soccer" no lugar de "futsal".
5. **Interface em português no trailer EN:** fica assim; traduzir o jogo vem depois.

## Estilo dos clipes (decidido 15/10/2026)

- **Sem os nomes** em cima dos Pokémon (padrão do `trailer-capture`; `--nomes` mantém). Setinhas e letreiros
  de golpe ficam.
- **Versão "uau" de todos os clipes na edição**, não no jogo: câmera lenta de verdade nos picos (gravar o trecho
  com `--vel 0.25`, sem frame duplicado), zoom de impacto, tremida, flash branco no corte, rampa de velocidade
  (rápido → lento no golpe → rápido) e batidas de som nos impactos.
- O Transformar do Ditto ganhou animação própria no jogo (gelatina, piscadas, anel roxo), já no ar.

## Clipes gravados (galeria do celular: Filmes/Soccermon-trailer)

1. Gancho: Charmander evolui e marca (`evolucao`/`trailer222`, 380–398 s, modo página por causa da tela de
   evolução; tem duas evoluções seguidas)
2. Charizard com Fire Blast (`golpe`/`trailer315`, 5–13 s)
3. Mewtwo com Psychic (`golpe`/`trailer397`, 15–23 s)
4. Charizard com Flamethrower (`golpe`/`trailer26`, 126–134 s)
5. Pikachu marca depois de 6 passes (`jogada`/`trailer294`, 2–13 s)
6. Ditto vira Mewtwo + combo Gênese (`ditto`/`trailer315`, 0–9 s)
7. Pênaltis 6x5, última cobrança (`penaltis`/`trailer7`, 412 s até o fim)

## Caça de lances (feito)

`scripts/trailer-hunt.ts` simula a 1ª partida de N copas com o time de cada cena (`src/ui/trailer-scenes.ts`)
e pontua os lances; `?demo=trailer&cena=<cena>&seed=<seed>` abre a mesma partida no navegador (paridade
testada: `ditto`/`trailer9` deu 7x0 nas duas pontas). Gol de golpe é raro (chute com golpe ~2% dos chutes):
precisa de muitas seeds.
