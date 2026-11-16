# Soccermon News #1 (pauta 21, sex 20/11 19h)

Telejornal de verdade (v3, aprovado pelo Miguel em 14/11): o Alakazam apresenta, o Meowth é o repórter ao vivo da
Rota e um jogador do Pallet FC é o convidado do estúdio. As falas entram numa caixa de diálogo no estilo dos jogos de
Pokémon (nome de quem fala, texto letra por letra, 3 a 3,5 s cada); a manchete fica parada em cima durante cada
matéria. Sem voz. ~65 s.

**Regras do News** (Miguel, 14/11):
- abre com o apresentador se apresentando e a escalada de 3 matérias principais, "e mais";
- notícia boba não entra (conserto pequeno, como os sprites que deixaram de ficar borrados: o ideal é ninguém ter visto
  o bug). Semana fraca de novidade ganha quadro: bastidores do Vestiário do Pallet FC, um jogador deles no estúdio;
- cada matéria diz o que mudou em palavras que quem nunca jogou entende e explica o termo do jogo na primeira vez;
  a piada sai da notícia.

A v1 e a v2 (35 s, sem falas) foram reprovadas: "frenético", "vago, infos jogadas". Na v3 (86 s) o Miguel não
gostou do Psyduck repetindo a fala do episódio (o callback em si agradou), achou estranho o "Que moedas?" e a
escalada parecia notícia dada rápido: na v4 ela vira sumário com cartelas.

## Formato fixo (Miguel, 15/11, a partir da v8)

- **Dupla de âncoras de terno azul-marinho:** Raichu (gravata vermelha, gola −1) e Machoke (gravata dourada). Os
  ternos são pintados no tronco do próprio sprite, sem redesenhar o corpo (`teste-gravata/gravata.mjs`,
  `teste-machoke/terno.mjs` no worktree `news1`). Testes reprovados: Alakazam, Pikachu provisório, Machamp de 4
  braços, Golduck ("horroroso") e terno cinza no Machoke ("da cor da pele").
- **Retrato PMD com expressão** ao lado da caixa de fala; **blip suave** por personagem (as vozes de antes eram
  "super agressivas").
- **Bordões:** abre com "Boa noite, Kanto!" e fecha com "Temos que chutar!".
- **Blocos com nome fixo na manchete, nessa ordem:** PLANTÃO, AO VIVO, VESTIÁRIO, VEM AÍ, NOTA PÉ.
- **Gancho:** a manchete mais absurda antes da vinheta, paga mais tarde no programa.
- A informação vem inteira antes da piada. Tarja que comenta a cena, no máximo 1 ou 2 por edição.
- **Caixa de fala:** até 2 linhas, ≥2,7 s cheia. Só 2 transições de cartinha por vídeo. ~60 s.

## Roteiro (v8, aprovado em 15/11)

**Gancho:** o Voltorb no banco, de colete, piscando. Manchete PLANTÃO · VOLTORB VIRA RESERVA. Depois, a vinheta.

**Abertura** (selo 0.9.51 + 0.9.52)
- **Raichu:** Boa noite, Kanto! Eu sou o Raichu…
- **Machoke:** …e eu sou o Machoke. Este é o Soccermon News!
- **Raichu:** Hoje: as novidades da semana, e mais.

**Escalada:** cartelas de 1,5 s.
- 1 · RECOMPENSA NOVA NA COPA DO DIA
- 2 · AO VIVO DA ROTA ÍNDIGO
- 3 · A DATA DO TIME ULTIMATE
- E MAIS: O TÉCNICO DO PALLET FC NO ESTÚDIO

**PLANTÃO**
- **Raichu** (telão, depois VT): Na Copa do Dia e na Relâmpago, a recompensa da vitória mudou.
- **Machoke** (troféus 4/10): Em 4 de cada 10 vitórias, uma das opções é um Patrocínio…
- **Raichu** (barras +4, 0×1 PERDENDO): …um bônus forte que vale pro time inteiro.
- **Magikarp** (sonora): A gente perdia. A charanga tocou e o time ficou mais forte.

**AO VIVO**
- **Raichu** (tela dividida): Agora, ao vivo da Rota Índigo, nosso repórter Meowth. Boa noite, Meowth.
- O Meowth fica 1 s parado, com a tarja ATRASO NO SINAL. **Meowth:** Boa noite, Raichu!
- **Meowth** (com a partida rolando atrás): Aqui na Rota, cada jogo vencido agora paga ₽3 pra gastar no Mercado.
- **Meowth:** Três vitórias, ₽9. Pay Day!

**VESTIÁRIO**
- **Machoke** (clipe do ep. 2): No Vestiário do Pallet FC, uma bola explodiu no treino.
- O Raichu reage sem graça (o Pikachu é a pré-evolução dele).
- **Raichu:** Psyduck, o que vocês fizeram com o Voltorb?
- **Psyduck:** Agora ele é reserva. Corte pro banco com a tarja VOLTORB · RESERVA.

**VEM AÍ**
- **Raichu** (calendário): A partir de agora, sai atualização nova toda semana.
- **Machoke** (27/11 vira Time Ultimate): E na sexta que vem, dia 27, abre o Time Ultimate…
- **Raichu** (pacote, Mewtwo 93): …o modo novo em que você abre pacotes e monta o time da temporada.

**NOTA PÉ**
- **Machoke:** E o Voltorb pediu pra avisar: ele tá bem.
- **Raichu:** Muito obrigado pela companhia, e boa noite!
- **Todos:** Temos que chutar! (o Meowth e o Psyduck no telão)
- Tela final.

Fora desta edição: sprites nítidos (conserto), barra de golpe, a bola amassando e Seus duelos. A 0.9.53 não sobe
antes de 20/11 (Miguel, 15/11).

## Legenda do post

**TikTok**
> Estreia do Soccermon News 📺⚽ Raichu e Machoke trazem as novidades do jogo de futsal com os Pokémon de Kanto. Qual você vai testar primeiro? Soccermon News #1. Joga grátis: soccermon.com/tt
> #pokemon #futsal #soccermon #meowth #psyduck

**Instagram (Reels)**
> Estreia do Soccermon News 📺⚽ Raichu e Machoke trazem as novidades do jogo de futsal com os Pokémon de Kanto. Qual você vai testar primeiro? Soccermon News #1. Joga grátis: soccermon.com/ig (link na bio)
> Fan game sem fins lucrativos. Música original: Soccermon.
> #pokemon #futsal #soccermon #meowth

**YouTube Shorts**
> Título: O Voltorb virou reserva | Soccermon News #1 #shorts
> Descrição: Qual novidade você vai testar primeiro? Joga grátis: soccermon.com/yt
> Fan game sem fins lucrativos. Música original: Soccermon.

**Comentário com o link** (TikTok, depois de postar): joga grátis no navegador: soccermon.com
