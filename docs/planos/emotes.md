# Emotes do Duelo, versão Clash Royale (0.8.7)

Pedido do Miguel (relatório da 0.8.6): "deixar os emotes bem mais legais, inspirados no Clash Royale".

**Recomendação: opção A, o seu capitão com cara de emoção** (retrato do PMDCollab + frase curta + o grito dele no
tom do emote). Já está prototipada na branch `emotes` e dá pra ver sem sala em `?lab=emotes`. A opção B (o capitão
em quadra fazendo pose) entra depois como enfeite do "Vamooo!", e a C (coleção de emotes) entra junto com a
Coleção/medalhas.

## O que tem hoje (0.8.6)

`src/ui/duel/Emotes.tsx`: 6 ícones SVG desenhados (palmas, bola em chamas, gota, Snorlax dormindo, aperto de mão,
braçadeira gritando). O emote aparece num balão branco pequeno (ícone 28 px + texto) embaixo do placar, do lado de
quem mandou. Só o "Grito do capitão" faz som (o cry do capitão). Limite de 1 emote a cada 3 s (o grito a cada 10 s),
conferido no envio **e no recebimento** (`emoteAllowed` em `src/net/duel-state.ts`), e botão de silenciar o rival na
própria barra. Funciona, mas é pequeno, parado e sem personagem: não dá aquela vontade de mandar.

## Como o Clash Royale faz

- **Personagem com expressão, não ícone.** O Rei rindo ("he he he he"), chorando, bravo, joinha. O emote é o
  personagem fazendo uma careta animada, com **voz/som próprio**. O "Rei rindo" virou meme justamente porque é a
  cara de alguém, não um símbolo ([AFKGaming](https://afkgaming.com/gaming/general/clash-royale-king-laughing-meme-explained)).
- **Pacote inicial pequeno:** 10 no começo, 4 do Rei e 6 de balão com texto ("Thank You", "Good Luck", "Wow",
  "Oops", "Well Played", "Good Game") ([Sportskeeda](https://sportskeeda.com/esports/emotes-clash-royale-types-ways-unlock)).
  O resto vem da loja, de eventos e do passe; o jogador monta um **deck de emotes** que aparece primeiro na batalha
  ([RoyaleAPI, Q4 2022](https://royaleapi.com/blog/2022-q4-update)).
- **Aparece grande, perto da torre de quem mandou**, por uns 2 segundos, e some sozinho. O rival sabe na hora de
  quem é.
- **Silenciar:** a Supercell resistiu ("emoção forte é o jogo") e acabou cedendo em 2016: um toque silencia o rival
  pelo resto da partida ([TouchArcade jun/2016](https://toucharcade.com/2016/06/14/supercell-doubles-down-on-never-muting-emotes-in-clash-royale),
  [TouchArcade set/2016](https://toucharcade.com/2016/09/19/clash-royale-update-adds-emote-mutenew-tournaments-cards-and-more/)).
  Já temos isso.
- **Spam:** depois de vários seguidos o botão trava uns segundos (o Rocket League faz igual com o "Chat disabled for
  3 seconds"). Já temos isso, mais rígido (3 s entre cada).

O que importa pra gente: **cara de personagem + som + tamanho**. Coleção e loja ficam pra depois (e sem dinheiro,
nunca).

## O que o Pokémon já dá pronto

- **Retratos com emoção do PMD Sprite Collab** (mesma fonte dos sprites de campo e dos retratos da faixa de gol;
  CC BY-NC 4.0, crédito por Pokémon em `CREDITS-PORTRAITS.md`, que o script já gera). Emoções: Normal, Happy, Pain,
  Angry, Worried, Sad, Crying, Shouting, Teary-Eyed, Determined, Joyous, Inspired, Surprised, Dizzy, Sigh, Stunned
  (+ Special0..3 em poucos). Cobertura nos 151 (pelo `tracker.json` do repo): Normal 151, Happy 120, Surprised 118,
  Inspired 117, Angry 116, Joyous 113, Sigh 111, Shouting 111, Crying 110. **41 espécies não têm todas** (Machamp,
  Gengar, Starmie, as aves lendárias…): caem numa emoção parecida (Joyous → Happy, Angry → Shouting → Determined) ou
  no rosto normal, e o jeito de mexer + a frase seguram o emote.
- **Animações do PMD** já estão no atlas de campo (`scripts/build-pmd-atlas.ts`: Idle, Walk, Attack, Shoot, **Hop**,
  Hurt, **Charge**, Swing, **Pose**, Trip). Não precisa baixar nada pra opção B.
- **Gritos (cries)** de todos os 151 já estão em `public/assets/cries/` (`playCry`). Tocar o mesmo cry mais agudo ou
  mais grave (`playbackRate` sem `preservesPitch`) dá a "voz" de cada emote de graça, igual ao "he he he" do Rei.

## Opções

| | O que é | Esforço | Risco |
|---|---|---|---|
| **A. Capitão com cara** (recomendo) | Retrato do **seu capitão** com a emoção do emote (80 px no celular, 112 no desktop), moldura na cor do time, frase num balão inclinado, entra com pop e mexe (pula, treme, murcha ou balança). Toca o cry dele no tom do emote. A gaveta mostra os 8 com a cara do seu capitão. | ½ dia (feito) | baixo: só tela; ~1,35 MB de PNGs no repo, ~16 retratos de 1–2 KB por partida, sob demanda |
| **B. Capitão em quadra** | O sprite do capitão faz Pose/Hop/Charge na quadra (Phaser) com um balão em cima dele. | 2–3 dias | médio: o capitão pode estar no banco, longe da câmera ou no meio de um lance; balão andando é ruim de ler em 8x; mexe no `MatchScene` |
| **C. Coleção de emotes** | A + emotes que se ganham (Dizzy, Teary-Eyed, Stunned, Pain, Special0, versão shiny) por missão, título ou campanha, e um deck de 8 escolhido no Perfil. | 2 dias depois da A | baixo; precisa do save (lista de emotes ganhos) e de tela no Perfil |

## A, prototipada (branch `emotes`)

- **8 emotes** numa gaveta 4 x 2 (como o deck do Clash Royale), os de festa em cima e os de lamento embaixo:

  | Emote | Frase PT / EN | Cara (1ª que tiver) | Mexe | Tom do cry |
  |---|---|---|---|---|
  | `boa` | Boa! / Nice! | Happy, Joyous | pula | 1,15x |
  | `golaco` | Golaço! / Golazo! | Joyous, Happy | pula | 1,25x |
  | `gg` | GG | Inspired, Happy | balança | 1,05x |
  | `grito` | Vamooo! / Let's gooo! | Shouting, Angry, Determined | treme | 1x, mais alto |
  | `ops` | Ops / Oops | Surprised | balança | 1,3x |
  | `zzz` | Zzz | Sigh | murcha | 0,75x |
  | `choro` (novo) | Nãão! / Noooo! | Crying | murcha | 0,8x |
  | `bravo` (novo) | Grrr! | Angry, Shouting, Determined | treme | 0,9x |

  Sem emoji: são os retratos. O ícone de silenciar continua SVG.
- **Onde aparece:** embaixo do placar, colado no lado de quem mandou (você de um lado, o rival do outro, cada um na
  cor do seu time), por 2,6 s, com pop de entrada e encolhida na saída. Tampa um pedaço do topo da quadra por esse
  tempo. Com "reduzir movimento" fica parado.
- **Som:** todo emote toca o cry do capitão de quem mandou, no tom da tabela, no volume dos gritos (Configurações). O
  "Vamooo!" sai 50% mais alto (antes só ele tinha som).
- **Anti-spam e silenciar:** sem mudança (1 a cada 3 s, o "Vamooo!" a cada 10 s, conferido também no recebimento;
  silenciar na gaveta). Emote desconhecido (de versão diferente) continua descartado.
- **Peso:** `npm run assets:portraits` agora também baixa Joyous, Surprised, Sigh, Inspired, Shouting, Crying e
  Angry (`scripts/fetch-portraits.ts`): +796 arquivos, ~1,35 MB no repo, `public/assets/portraits` foi de 0,6 para
  1,9 MB. Nada disso entra no primeiro acesso: a partida do Duelo pré-carrega só os 16 rostos dos dois capitães.
- **Celular:** gaveta 4 x 2 com a frase embaixo de cada rosto, silenciar na ponta. **Desktop:** os 8 numa linha na
  barra de baixo, sem a frase (fica no `title`).
- **`?lab=emotes`** (público, como o `?lab=golpes`): placar de mentira, o rival manda um emote a cada 3,5 s, e dá pra
  escolher o capitão de cada lado (pra ver quem cai no rosto normal).

## Decisões pro Miguel (recomendação primeiro)

1. **Opção A como está?** Recomendo sim; B e C depois.
2. **Os 8 e as frases.** Recomendo os da tabela. Trocar algum? ("Zzz" com cara de suspiro; "GG" com olho brilhando.)
3. **Som em todo emote** (cry do capitão no tom), ou só no "Vamooo!" como antes? Recomendo em todos, como no Clash
   Royale; quem não quiser baixa o volume dos gritos ou silencia o rival.
4. **Tamanho:** 80 px no celular e 112 no desktop, tampando o topo da quadra por 2,6 s. Recomendo assim; dá pra
   descer pra 64 px se atrapalhar o lance.
5. **Capitão que evolui na partida:** hoje o rosto é o da escalação (o Charmander continua Charmander depois de virar
   Charmeleon). Recomendo trocar pro evoluído numa próxima (precisa ler a evolução da partida na tela).
6. **Silenciar tocando no emote do rival** (como no Clash Royale), além do botão da gaveta? Recomendo sim, numa
   próxima, é pequeno.
7. **B como enfeite do "Vamooo!":** o capitão em quadra dá o Hop/Pose quando você grita. Recomendo depois de ver a A no
   ar.
8. **C (coleção):** emotes ganhos por missão/título e deck de 8 no Perfil, junto com as medalhas. Recomendo na leva da
   Coleção.
9. **Emotes no Copa:** o capitão rival (líder de ginásio) reagindo a gol com a mesma peça ("rival que reage", que você
   já aprovou). Recomendo junto com o rival que reage.

## Fontes

- [Sportskeeda: emotes do Clash Royale, tipos e como ganhar](https://sportskeeda.com/esports/emotes-clash-royale-types-ways-unlock)
- [AFKGaming: o meme do Rei rindo](https://afkgaming.com/gaming/general/clash-royale-king-laughing-meme-explained)
- [RoyaleAPI: atualização Q4 2022 (gerenciar emotes, deck primeiro na batalha)](https://royaleapi.com/blog/2022-q4-update)
- [TouchArcade: Supercell não vai silenciar emotes (jun/2016)](https://toucharcade.com/2016/06/14/supercell-doubles-down-on-never-muting-emotes-in-clash-royale)
- [TouchArcade: atualização com o silenciar (set/2016)](https://toucharcade.com/2016/09/19/clash-royale-update-adds-emote-mutenew-tournaments-cards-and-more/)
- [PMDCollab/SpriteCollab](https://github.com/PMDCollab/SpriteCollab) (retratos e `tracker.json`, CC BY-NC 4.0)
