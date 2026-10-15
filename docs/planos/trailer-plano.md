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
| 4 | 12,5–16,5 | Partida: tabela, drible, chute, gol | **Modo futsal 5x5** | 5v5 futsal mode | ritmo cheio |
| 5 | 16,5–19,5 | Montagem de golpes (Flamethrower, Thunderbolt, Hydro Pump, Psychic) | **Mais de 100 movimentos** | 100+ moves | efeitos dos golpes |
| 6 | 19,5–22,0 | Ditto se transforma + combo Gênese (Mew + Mewtwo) | — | — | — |
| 7 | 22,0–25,0 | Painel do time, tática, substituição | **Seja o técnico do seu próprio time** | Be the manager of your own team | respiro na batida |
| 8 | 25,0–28,5 | Pênalti decisivo → campeão com troféu | **E conquiste o estrelato** | And rise to stardom | subida até o clímax |
| 9 | 28,5–33,0 | **Final:** um Pokémon voa em direção à tela e "forma" o título SOCCERMON | **Beta aberta · Jogue grátis no navegador** + site | Open beta · Play free in your browser + site | acorde final |

Os cortes caem na batida da música escolhida (ajustar os tempos ao BPM dela).

## Título (cartela final e abertura)

O logo de hoje (fonte pixel Galmuri em amarelo com sombra azul) é a base. Proposta pro trailer:
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
   atalho só de dev `?demo=trailer&cena=N` e script de captura com tempo virtual. Primeiro risco a validar: o
   Phaser respeitar o tempo virtual (plano B: gravar em câmera lenta e acelerar no ffmpeg).
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
| Phaser não respeita o tempo virtual | Gravar em câmera lenta (0,25×) e acelerar no ffmpeg |
| Render pesado no celular | Rascunho aqui com 1 worker; final no PC |
| Lance raro não aparece na caça | Montar o cenário direto, como os `?demo=` |
| Música silenciada pelas redes | Trocar por royalty-free (a montagem segue igual) |

## Pra decidir

1. **Música:** qual faixa (ou royalty-free)?
2. **Quem voa pra formar o título:** Charizard, Dragonite, Mew ou outro?
3. **Quem se encara na abertura:** Pikachu × Mewtwo, Charmander × Squirtle, ou outra dupla?
4. **Textos em inglês** da tabela: ok ou ajusta?
5. **Interface em português no trailer EN:** (a), (b) ou (c)?
