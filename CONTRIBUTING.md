# Contribuindo com o Soccermon

Valeu por querer ajudar! O Soccermon é um fan game feito por fãs, no tempo livre. Toda ajuda conta: jogar e
contar o que achou já é contribuir.

## Jeitos de ajudar

- **Bugs**: abra uma issue com o modelo "Bug". Diga o que fez, o que esperava e o que aconteceu. Print, tamanho
  da tela e navegador ajudam muito. Se der, use **Compartilhar** no fim da copa e cole o código do desafio
  (a seed): com ele dá para repetir a mesma copa.
- **Ideias e balanceamento**: use o modelo "Ideia". Golpe fraco demais, Pokémon forte demais, formação que
  sempre ganha: conte o que viu, de preferência com números (placar, estatísticas da copa).
- **Código**: veja abaixo. Para mudanças grandes (modo novo, regra nova de partida), abra uma issue antes para
  conversar: o jogo segue uma direção de design e é chato ver um PR bom ficar parado.

## Direção do jogo

- **Diversão vem antes de realismo**: golpes e atributos têm que aparecer em campo, partidas com ritmo e viradas.
- **Nada automático no time do jogador**: substituição, tática e escalação são escolhas dele.
- **Carta = campo**: o número que a carta mostra é o que vale na partida (`src/engine/modifiers.ts`).
- Mudanças de posição, de fórmula de atributo e de equilíbrio passam pelo mantenedor, com números de antes e
  depois (`npm run calibrate`).

## Rodando e testando

```bash
npm install
npm run dev     # http://localhost:8080
npm test        # Vitest (motor)
npm run lint    # Biome
npm run build   # tsc + Vite
```

O motor (`src/engine`) é determinístico: a mesma seed com as mesmas ordens dá exatamente a mesma partida.
Não use `Math.random()` nem `Date` dentro dele; use o `Rng` do estado. Mudou algo que afeta o resultado das
partidas? Rode `npm run calibrate -- --n 400` e cole os números no PR.

## Pull requests

1. Faça um fork e uma branch a partir da `main`.
2. Mantenha o estilo do código: TypeScript estrito, comentários e textos do jogo em português, sem emoji na
   interface (use ícones desenhados).
3. `npm run lint`, `npm test` e `npm run build` precisam passar (o GitHub roda os três em todo PR).
4. Explique o que mudou e por quê; para mudanças visuais, mande print no celular e no computador.

Ao contribuir, você concorda que seu código entra sob a licença do projeto, [AGPL-3.0-or-later](LICENSE).
Não envie sprites, sons ou textos copiados de jogos oficiais além do que já está nos créditos.
