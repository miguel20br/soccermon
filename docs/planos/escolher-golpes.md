---
description: Escolher os golpes do Pokémon (0.9.54, item 8): como funciona atrás de bandeira, números do antes e depois e recomendação pro Miguel.
---

# Escolher os golpes (0.9.54, item 8)

> Pronto atrás de bandeira, **não sobe sozinho**: muda o resultado das partidas, então o Miguel decide o equilíbrio
> (e o `ENGINE_VERSION`) depois de ver os números abaixo.

## Como funciona

- **Bandeira:** `?lab=golpes-escolher` (só dev e prévias, `__SMOKE__`; produção ignora). Fica na aba até fechar
  (`src/ui/escolher-golpes-lab.ts`).
- **Onde:** ficha do Pokémon (`CardModal`), seção "Escolher golpes", **só na escalação antes de travar o time**
  (`run.status === 'lineup'` e sem `lockedTeam`). Toque numa vaga, depois no golpe que entra; a transição é de 250 ms.
  A ficha aberta de dentro da escalação ou do banco usa o mesmo caminho.
- **Regra** (`src/engine/choose-moves.ts`): o mesmo número de vagas de hoje; os candidatos são o learnset da espécie
  (que já inclui o que as MTs ensinam) mais o que ela já leva; sem repetido. **A assinatura sempre fica** (travada na
  tela e recusada no motor): a carta não perde a cara e os golpes máximos/bicuda dependem dela.
- **Salvo em** `PokemonInstance.moves`; o campo novo opcional `picked` guarda o que foi escolhido (nem padrão, nem
  MT) para sobreviver à evolução (`movesAfterEvolution` trata como o `taught`: fica se a forma nova aprende).
  Escolhido **não ganha** o bônus de golpe treinado da MT.
- **Migração:** nenhuma precisa: `picked` é opcional e saves antigos ficam como estão (teste "save antigo").
  O Duelo valida `moves` pelo learnset, que já aceita qualquer golpe da espécie.
- **IA rival:** continua automática (movesets padrão e MT do ginásio).
- Learnset da Gen 1 não tem nível: "até o nível dela" vale como o learnset inteiro (o jogo roda no nível 50).

## Números (n=400 partidas por linha, mesmas sementes, `scripts/balance/escolher-golpes.ts`)

Times sorteados pelo draft da IA (dificuldade 1), tática equilibrada. "power" = assinatura + os 3 golpes de maior
força x precisão; "random" = 3 golpes ao acaso do learnset.

| A | B | A vence | Empate | Gols/jogo (A x B) | Favorito vence |
|---|---|---|---|---|---|
| padrão (hoje) | padrão | 50,7% | 20,3% | 6,86 (3,47 x 3,38) | 58,4% |
| power | padrão | 44,8% | 18,5% | 7,47 (3,56 x 3,91) | 57,4% |
| random | padrão | 46,8% | 16,5% | 7,38 (3,58 x 3,80) | 58,3% |
| power | power (os dois) | 49,0% | 16,8% | 7,24 (3,62 x 3,62) | 59,3% |
| random | random (os dois) | 50,7% | 17,5% | 7,26 (3,63 x 3,63) | 59,2% |

O que isso diz:

- **Escolher só pela força piora o time** (-5,9 pontos de vitória contra o padrão): o padrão equilibra tipos, dano e
  utilidade, e o "mais forte" larga isso. Quem só olha o número do golpe perde, o que é bom sinal contra exploit.
- **Gols/jogo sobe uns 0,4 a 0,6** (6,86 para 7,2-7,5), dentro da meta de 5-7 mais perto do teto. Diversão > realismo,
  então não é problema, mas é efeito real de abrir o moveset (mais golpes de dano, menos utilidade).
- **O favorito continua vencendo ~57-59%** (dentro dos 60-65% de meta, igual a hoje): escolher não vira o jogo.
- **Obrigatórios:** na política "power", 25 golpes de 164 concentram as escolhas, e três são quase universais:
  Double-Edge (94% de quem aprende), Skull Bash (98%), Hyper Beam (99%), mais Self-Destruct/Explosion (95%/89%).
  Como "power" perde pro padrão, não é obrigatório para ganhar, mas é a escolha óbvia de quem olha só o poder.
  **Não testei** uma política esperta (tipo por posição, utilidade): o número real de um jogador bom fica entre
  "power" e o padrão, ou acima dele.

Ressalvas: o simulador escolhe uma política fixa pro time inteiro, joga na equilibrada e não conhece as MTs; jogador
de verdade pesa tipo, posição e golpe máximo. Peça pro Miguel jogar umas partidas na prévia.

## Recomendação

1. **Só fora da partida** (como está): escolher na escalação, travado depois do "jogar". Sem troca ao vivo.
2. **Limite barato, se ele quiser conter o efeito:** tirar Hyper Beam, Skull Bash, Sky Attack, Explosion e
   Self-Destruct da lista de escolha (continuam por MT e no padrão). Isso corta os "obrigatórios" sem tocar no resto.
3. **Custo opcional:** trocar um golpe custa uma moeda da Rota/Mercado (no draft rápido, grátis). Não implementei.
4. Se subir: `ENGINE_VERSION` +1 e republicar a `liga` (resultado muda), e tirar a bandeira. Sem mudança de save.

## Como reproduzir

```bash
scripts/pesado.sh npx tsx scripts/balance/escolher-golpes.ts 400
scripts/pesado.sh npx vitest run src/engine/choose-moves.test.ts
```
