---
name: soccermon-teste-navegador
description: Como testar o Soccermon no navegador sem janela (Playwright headless) — fluxo da copa, telas no celular e desktop, save antigo, prints pra conferir visual. Use antes de lançar, depois de qualquer mudança visual, pra reproduzir bug de tela, ou quando precisar ver como algo ficou.
---

# Teste no navegador (sempre headless)

**Nunca abra janela visível**: rouba o foco do Miguel. Playwright com `headless: true`. O Claude in Chrome é só
pras contas dele (TikTok etc.), e só depois de perguntar qual navegador.

## Primeiro: o CI já faz a fumaça

Todo push em qualquer branch roda no GitHub a copa curta (draft → 1ª partida → resultado) e prints de páginas a
390x844 e 1440x900, contra o build com modo fumaça (`scripts/smoke/fumaca.mjs`, fluxo em
`docs/planos/esteira.md`). Prints: `gh run download <id> -n fumaca-prints`. Página a mais nos prints: linha
`Fumaça: /?demo=album /?lab=quadras|.seletor` na mensagem de um commit. **Local, só o que o CI não cobre**
(trilha rápida: print 390 e 1440 da tela mexida; completa: copa inteira, save antigo, Duelo, 320 e deitado), sempre
por `scripts/pesado.sh` (fila `flock /tmp/soccermon-heavy.lock`). O mesmo roteiro roda local:
`SOCCERMON_SMOKE=1 npm run build:vite`, `npx vite preview --config vite/config.prod.mjs --port <p> --strictPort` e
`node scripts/smoke/fumaca.mjs copa|paginas http://localhost:<p> <pasta> 390x844 [url...]`.

## Ligar o jogo

```bash
npx vite --config vite/config.dev.mjs --port 8096 --strictPort   # em background (run_in_background)
```

- **Use sempre `--config vite/config.dev.mjs`**: sem ele a Home quebra com `__APP_VERSION__ is not defined`.
- Em worktree, o `node_modules` pode ser symlink pro de outro checkout.
- Pare o servidor no fim (TaskStop). `pkill -f vite` dentro do mesmo comando mata o próprio shell (exit 144): não use.
- Playwright: `require('/home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright')`.
- Um navegador por vez (memória de 7,5 GB).

## Atalhos

| URL | O que abre |
|---|---|
| `?demo=mt` | tela de recompensa com MT (pacote fechado) |
| `?demo=penaltis`, `?demo=ditto`, `?demo=evolucao`, `?demo=campeao` | cenas prontas |
| `?demo=escanteio` | time de grandalhões com escanteio seu e disputa no alto logo no começo (`&defesa=1`: uma espalmada que vira escanteio) |
| `?cards=1` | galeria de cartas (mudança visual de carta: mostrar aqui antes) |
| `?lab=golpes` / `?lab=posicoes` / `&revisao=1` | laboratórios e ferramentas de revisão do Miguel |
| `?demo=crash` | aviso de erro |
| `?vel=16` | quadra 16x mais rápida (até 64), por cima da velocidade escolhida |

Esses atalhos valem no dev, nas **prévias da Vercel** e no CI (modo fumaça, `__SMOKE__`); em produção não existem.

`localStorage.setItem('soccermon-packs-opened','10')` deixa o pacote no modo rápido.

## Tamanhos obrigatórios

320x568, 390x844, deitado 844x390 e desktop 1440x900 (ou 1280). Sem rolagem pro lado:
`document.documentElement.scrollWidth <= innerWidth`.

## Roteiro de fumaça antes de lançar

1. Home → pular boas-vindas → "Nova copa" → formação → draft inteiro (capitão, vagas, banco).
2. Escalação → partida em 8x → **no intervalo, uma troca** (quem entrou tem que estar em quadra no 2º tempo, a faixa
   "Substituição na próxima saída de bola" some, o botão volta) → resultado.
3. Recompensa: abrir pacote, escolher, ensinar MT se vier → próxima partida (VERSUS com o treinador).
4. Carta completa (tocar numa vaga): posições, "Evolução" com barra.
5. Save antigo: Configurações → "Restaurar backup" (input de arquivo, `setInputFiles`) com
   `scripts/fixtures/backup-v6-pt.json` ou `backup-v6-en.json` (save v6 com Hall da Fama e missões antigas): tem que
   virar o save atual sozinho, liberar os treinadores das missões já cumpridas e abrir Perfil e Hall sem erro.
6. Junte `pageerror`, `console.error` e respostas 404 e mostre deduplicado.

Bom delegar o roteiro inteiro a um agente em background e só ler o relatório. Prints no scratchpad; olhe os
relevantes com Read antes de dizer que ficou bom.

## Mesma partida em todo navegador (determinismo)

`npm run determinismo` (ou `-- firefox webkit` pra escolher) empacota `src/engine/determinism.ts` com o Vite, roda
5 partidas fixas (uma com ordens, uma nos pênaltis) no Node e no Chromium, Firefox e WebKit headless e compara os
hashes; sai com erro se algum diferir. Os hashes esperados ficam em `src/engine/determinism.test.ts` (roda no
`npm test`, junto com o teste que barra `Math.sin/cos/atan2/exp/log/pow/hypot/random`, `**`, `localeCompare` e
`Date.now` no motor: use `src/engine/dmath.ts`). Mudou o motor de propósito: atualize os hashes e suba
`ENGINE_VERSION`.

- Navegadores: `node /home/bartolomeu/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/cli.js install firefox webkit`.
- **WebKit no Omarchy/Arch** falta `libicu74`, `libxml2.so.2` e `libflite1` (o Playwright pede `sudo apt`). Sem sudo:
  baixe os `.deb` do Ubuntu 24.04 (`archive.ubuntu.com/ubuntu/pool/...`), extraia com
  `bsdtar -xOf x.deb data.tar.zst | bsdtar -x -C <pasta>` e copie `usr/lib/x86_64-linux-gnu/*` pra
  `~/.cache/ms-playwright/webkit-<versão>/minibrowser-wpe/sys/lib/` (o `LD_LIBRARY_PATH` de fora não vale: o
  wrapper do MiniBrowser sobrescreve).
- O WebKit do Playwright no Linux não é o Safari do iPhone, mas depois do `dmath.ts` só sobra conta exata do IEEE.
