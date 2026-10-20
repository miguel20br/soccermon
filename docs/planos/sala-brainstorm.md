# Sala de troféus: brainstorm do que implementar (20/10/2026)

Onde estamos: o Miguel não gostou do quarto FireRed desenhado por código (o traço é o maior problema) nem do 3D,
mas a **direção do F** (quarto de noite, holofote nas vitrines, troféu grande no centro com o cartão do lado, o
Pokémon andando) já agrada mais. Quer: **cenário**, **visual moderno**, **vivo**, **tudo numa tela**, e um jeito melhor
de **mostrar as informações**. Nada de código antes das decisões do fim.

## 1. O traço (sem 3D e sem "arte de programador")

| | Opção | Como fica | Custo | Combina com |
|---|---|---|---|---|
| a | **Tileset de interior estilo DS/BW de fan game** (ex.: [Pokemon DS Style Interior Tileset](https://el-espriteador.itch.io/interiords), US$ 3; ou os pacotes BW da [PokéCommunity](https://www.pokecommunity.com/threads/rmxp-black-and-white-package.258840/), de graça com crédito) | o quarto de um jogo Pokémon de DS, mais detalhado que o GBA | US$ 0 a 3 | os sprites Black/White animados que o jogo já usa (avatar, cartas) |
| b | **[Modern Interiors (LimeZu)](https://limezu.itch.io/moderninteriors)**: o pacote de interiores em pixel mais usado em indie moderno (centenas de móveis, troféus, TVs, plantas, luminárias) | moderno e caprichado, "pixel art de 2024" | a partir de ~US$ 1,50, crédito obrigatório | o visual moderno que o Miguel pediu |
| c | Desenhar nós mesmos (como o A) | o que já não agradou | 0 | (descartar) |
| d | Usar o 3D do F só pra gerar a imagem (render 2D) | continua com cara de 3D | 0 | (descartar: ele não quer 3D) |

Dinheiro: o Soccermon nunca **ganha** dinheiro; **gastar** uns dólares num pacote de arte é outra coisa (decisão dele).
Os dois pacotes permitem uso grátis/não comercial com crédito; o crédito vai no CREDITS.md.

## 2. A luz (o que agradou no F, em 2D)

O **Phaser 4 já está no jogo** (quadra) e tem **luz dinâmica 2D**, inclusive
[cone de luz](https://cdn.jsdelivr.net/npm/phaser@4.2.0/docs/Phaser%204%20Cone%20Lights/Phaser%204%20Cone%20Lights.md):

- **Noite azulada** por cima de tudo, e as luzes "abrindo" o quarto: **holofote em cone** sobre cada vitrine, **abajur**
  quente, **brilho da TV** que muda com a imagem, **luar** pela janela.
- **Dia e noite pelo relógio** do aparelho (de dia, janela clara e luz suave; de noite, os holofotes).
- **Brilho que passa** nos troféus de metal (um reflexo correndo de vez em quando), **poeira** flutuando na luz.
- Reduzir movimento: luz parada, sem poeira nem reflexo.

## 3. O que tem no quarto (cada coisa é um dado que já existe)

| Objeto | Mostra | Dado |
|---|---|---|
| **Vitrines com holofote** | taças da Copa por metal, com o número gravado | `hall` |
| **Vitrine grande do centro** | a taça da Liga (silhueta até abrir; depois a da temporada) | Liga |
| **Mural de polaroids** | uma foto de cada título: o elenco campeão (o card 9:16 que já existe, em miniatura) | `hall`, `share-card` |
| **TV** | passa o **gol da copa de verdade** (o replay guardado) sem som | `StageResult.replay`, Melhores momentos |
| **Quadro de cortiça** | medalhões da Copa do Dia e o calendário da semana | `daily` |
| **Cinturões** | pendurados na parede (10/50/100 vitórias no Duelo) | `duels` |
| **Quadro de broches** | as 20 medalhas, metal = degrau | medalhas |
| **Diploma** | Platina da Gen 1 (emoldurado quando sai) | missão `platina` |
| **Estante de livros** | os álbuns (Gen 1 aberto, Gen 2 "em breve") | Álbum |
| **Vitrine de cartas** | as 3 cartas da vitrine, de pé | `cardShowcase` |
| **Bandeira e faixa** | escudo e a frase da torcida | clube |
| **PC** | os números da carreira (abre como o PC do Bill) | `career`, `records` |
| **Pacote na mesa** | aparece quando tem recompensa pra abrir (abre ali) | `run.status === 'reward'` |
| **Bola autografada** | a do MVP da última final | `matchDigest` |

## 4. Vida

- **O seu Pokémon mora ali:** o do avatar passeia sozinho (anda, para, olha os troféus), **dorme no tapete à noite**,
  **pula de alegria** quando chega troféu novo, e **anda até o que você toca**.
- **O capitão do último título aparece** de vez em quando (visita), ou fica na TV.
- **Troféu novo chega com momento próprio:** a vitrine acende, o troféu desce, a plaquinha soma +1.
- **Amigo visitando:** no perfil do amigo, a sala dele (só olhar), com um botão de reação.

## 5. Como mostrar a informação (o "modo destaque", estilo galeria do Smash)

Hoje: listas e abas embaixo do quarto. Proposta: **tudo numa tela**, o quarto é o menu.

- **Tocar num objeto:** o quarto escurece em volta, o objeto vem pro centro **grande** (2D: aproxima com um zoom suave e
  um brilho girando atrás), e um **cartão** aparece do lado: nome, quantos, como ganhar, e o **histórico** (datas, o
  time, o placar). Setas `‹ ›` passam pro próximo da mesma vitrine. Tocar fora volta.
- **Cada móvel abre do jeito dele:** o PC abre uma "janela de PC" com os números; o quadro de broches vira a grade das
  20 medalhas (tocar num broche: o degrau e quanto falta); as polaroids viram um álbum que folheia (o Hall da Fama).
- **Sem abas embaixo.** Um **resumo pequeno no topo** (nível da sala, títulos, medalhas) e, se quiser ver tudo em lista,
  um botão "Lista" que abre a mesma informação num painel.

## 6. Progressão e personalização (depois)

- **A sala sobe de nível** com os títulos: quarto em Pallet → sede do clube → vestiário do estádio, cada um com outro
  cenário (e uma animação de mudança).
- **Decorações liberadas por missão/medalha:** papel de parede, piso, tapete, pôster do líder de ginásio vencido.
- **Arrumar:** escolher o que vai na vitrine principal (mais tarde: arrastar móveis).
- **Foto da sala** pra compartilhar (9:16, como o card do título).

## 7. Pacote recomendado pra primeira versão

**Traço b (Modern Interiors)** ou **a (DS/BW)** + **luz do Phaser (noite com holofotes, dia/noite)** + os objetos da
seção 3 que já têm dado (vitrines, polaroids, TV com o gol, cortiça, cinturões, broches, diploma, estante, PC) + **o
Pokémon vivo** + **modo destaque** (tudo numa tela, sem abas). Personalização e visita ficam pra depois.

Esforço: médio-alto (a sala vira uma cena do Phaser como a quadra). Antes do código: um **quarto de teste** no
`?lab=sala` com o pacote escolhido, pro Miguel aprovar o traço.

## 8. Decisões pro Miguel

1. **Traço:** b, Modern Interiors (moderno, ~US$ 1,50) **(recomendado: foi o "visual moderno" que você pediu)** / a,
   estilo DS/BW de fan game (mais Pokémon, US$ 0–3) / ver os dois no quarto de teste.
2. **Luz de noite com holofotes** e dia/noite pelo relógio **(recomendado)** / sempre noite / sempre dia.
3. **Tudo numa tela** (o quarto é o menu, modo destaque, sem abas embaixo) **(recomendado)** / quarto + abas como hoje.
4. **Pokémon vivo:** o do avatar passeando, dormindo e reagindo **(recomendado)** / só parado / o capitão do último título.
5. **TV com o gol da copa de verdade** (o replay) **(recomendado)** / foto do time.
6. **Hall da Fama em polaroids** na parede **(recomendado)** / a lista de hoje.
7. **Primeira versão** com o pacote da seção 7, personalização e visita depois **(recomendado)** / tudo de uma vez.

## Fontes

- [Pokemon DS Style Interior Tileset (itch.io)](https://el-espriteador.itch.io/interiords)
- [RMXP Black and White package (PokéCommunity)](https://www.pokecommunity.com/threads/rmxp-black-and-white-package.258840/)
- [Modern Interiors, LimeZu (itch.io)](https://limezu.itch.io/moderninteriors) e a
  [versão grátis](https://limezu.itch.io/moderninteriors/devlog/244045/free-version-overview-18042021-update)
- [Phaser 4: Cone Lights](https://cdn.jsdelivr.net/npm/phaser@4.2.0/docs/Phaser%204%20Cone%20Lights/Phaser%204%20Cone%20Lights.md)
- [Unity: 2D Lighting (referência de clima)](https://learn.unity.com/tutorial/add-2d-lighting)
- [SmashWiki: Trophy](https://www.ssbwiki.com/Trophy) (galeria com o troféu girando e o texto)
