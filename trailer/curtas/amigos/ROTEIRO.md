# Trailerzinho 0.9.25 · "Quem é esse no ranking?" (v2, 29/10/2026)

Conceito escolhido pelo Miguel: "Quem é esse no ranking?" com um toque do "Snorlax recebeu um desafio". Um herói (o
Pikachu), uma situação (quem é o 1º do ranking?), um desfecho (ele desafia, perde de 0 × 1 e o Snorlax se cobre e volta
a dormir). A explicação só vem depois do desfecho.

**v2 (refinos aprovados do rascunho):** abre no gancho (o Snorlax dormindo e o 1º plim em 1,2 s); o ranking e o perfil
viram um "ENQUANTO ISSO..." de 2 compassos (4,8 s) com a interface ampliada (nada abaixo de ~56 px, só a linha do
ranking e os botões que importam); cobertor de retalhos em pixel art colado no contorno do Snorlax, que abre um olho
bravo antes; o sinal de bravo à vista (o estouro da bolha varre a pilha de avisos); a cama enche o terço de baixo do
quarto e uma estrela cadente mexe o céu antes do plim; explicação em 3 frases curtas; gritos do Pikachu e do Snorlax.

**Tempo: 100 BPM, 4/4, compasso = 2,4 s, 14 compassos = 33,6 s + 0,6 s de rabo (34,2 s).** Música própria:
`scripts/musica/pecas/livre-amigos.mjs`, composta já nesta ordem (sem mapa): funk em Fá, motivo do Pikachu
"pi-ka-CHUUU" no pulso elétrico, assinatura = o PLIM do aviso de desafio (`plim` em `scripts/musica/curtas.mjs`; o BOING
da barriga é o `barriga` do EP 1). Sobe um tom (Sol) na 3ª frase da explicação.

| C | Tempo | Cena | Música |
|---|---|---|---|
| 0 | 0,0 | O gancho: o Snorlax dormindo na cama, à noite; estrela cadente; 1º aviso "te chamou pro Duelo" cai no topo: PLIM (1,2 s), a bolha do nariz cresce | groove leve (Si♭), ronco no 1, plim no 8 |
| 1 | 2,4 | ENQUANTO ISSO...: o ranking do dia de perto (1º zzz · Clube do Ronco, 2º Pikachu VOCÊ). O Pikachu (de costas) "?", toca no "zzz" (6), a gaveta do perfil sobe (7): Campeão do Dia, o Snorlax dormindo no retrato. "!" e o grito dele (11) | volta no tempo (deslize), groove inteiro, motivo do Pikachu; o grito responde o motivo |
| 2 | 4,8 | Toca **Adicionar amigo** (2) → "Amigos"; aparece **Desafiar** (4) e ele toca 4 vezes (8, 11, 13, 14), cada convite sobe e vai | toque, metais "ta-dá", um "envia" por convite, virada de caixa |
| 3 | 7,2 | De volta no quarto: ronca; plim, plim-plim (os avisos empilham, a bolha cresce a cada um) | plim × ronco, cada plim um degrau acima |
| 4 | 9,6 | Plim plim plim cada vez mais rápido; a bolha ESTOURA (12), a pilha voa pros lados, ele acorda de pé, bravo (sinal grande); toca **Entrar** (14) | plins subindo + rufo; prato e silêncio no estouro com o grito do Snorlax; toque e metais |
| 5 | 12,0 | O Duelo na partida nova (quadra de perto, barra de 4 botões, 0 × 0). O Pikachu conduz e chuta; a barriga devolve: BOING | groove de partida, motivo atacando, chute (6), BOING (10) |
| 6 | 14,4 | Grito do Pikachu, carrega o choque e chuta (bola elétrica); BOING mais forte e a bola sobe por cima dele | grito no 0, zap no chute, BOING grave |
| 7 | 16,8 | A câmera segue a bola pela quadra inteira até o outro gol: rede, tremida, 0 × 1 | a bola viajando, rede, torcida, metais "uón-uón-uóóón" |
| 8 | 19,2 | De volta no gol: o Snorlax já dorme ali. FIM DE JOGO 0 × 1, a mão toca **Revanche?** | groove leve, ronco, toque, motivo perguntando |
| 9 | 21,6 | PLIM: o aviso no topo, a câmera chega no Snorlax (placar e barra saem); ele abre um olho bravo (1) e puxa o cobertor por cima da cabeça (4); o Pikachu murcha (6) | plim, tuba "fom", breque, ronco |
| 10 | 24,0 | Explicação 1: "Toque no **nome**" + a linha do ranking, a mão toca no nome | groove inteiro, motivo com metais em terças |
| 11 | 26,4 | Explicação 2: "Peça **amizade**" + Adicionar amigo → Amigos | Si♭, pergunta e resposta, Ré7 e virada |
| 12 | 28,8 | Explicação 3: "Desafie pro **Duelo**" + Desafiar, o convite sobe | sobe um tom (Sol), SOC-CER-MON com palmas |
| 13 | 31,2 | Tela final: NOVO NA 0.9.25, logo (piscada SOC-CER-MON), Temos que chutar!, soccermon.com; Pikachu pulando, Snorlax dormindo | acorde de Sol, fim no PLIM (12) |

Embaixo da explicação (C10–12) o Pikachu pula e o Snorlax dorme o tempo todo.

**Gritos** (`som/`, de `public/assets/cries/latest`): Pikachu em C1.11 (4,068 s, volume 0,8) e C6.0 (14,4 s, 0,7);
Snorlax em C4.12 (11,4 s, 0,75), dentro do silêncio do estouro. Se o andamento mudar, refaça os `data-start` com `C.T`.

**Mixagem conferida (29/10):** final em −14,4 LUFS e −1,5 dBTP (o `finalizar.sh` agora limita em −3 dBFS: com −1 o AAC
dava +0,8 dBTP). Os gritos ficam ~2–3 dB acima da cama (Pikachu) e ~5 dB no silêncio (Snorlax); plins e ronco no
nível da música. Freezedetect limpo.

Regras do Miguel seguidas: gancho nos 2 primeiros segundos; uma coisa por vez; cada ideia ≥ 2 s; texto na tela só o das
telas do jogo, o "ENQUANTO ISSO..." e a explicação (2–5 palavras) depois do desfecho; sem emoji; nada parado (a câmera
de fora respira 3% por compasso); sem tela branca (flashes ≤ 0,8 e 0,3 s).

## Render

```bash
cd trailer/curtas/amigos && HF=$(ls ~/.npm/_npx/*/node_modules/.bin/hyperframes | head -1)
~/Projects/soccermon/scripts/pesado.sh $HF render . -o render/amigos-v4.mp4 -q looks -w 2 --quiet
cd .. && ~/Projects/soccermon/scripts/pesado.sh ./finalizar.sh amigos/render/amigos-v4.mp4 ~/Vídeos/soccermon-postar/trailer-0925
```

## O que ficou cru

- A partida nova está desenhada (quadra de perto + barra de 4 botões), não gravada do jogo.
- O olho aberto do Snorlax é um sobrepixel de 3x3 no Sleep (o sprite não tem olho aberto); lê bem de perto, só.
- O céu do C0 ainda ocupa a metade de cima (estrelas, lua, estrela cadente e os Z mexem; o aviso cai em 1,2 s).
