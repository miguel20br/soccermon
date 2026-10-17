---
name: soccermon-teste-navegador
description: Como testar o Soccermon no navegador sem janela (Playwright headless) — fluxo da copa, telas no celular e desktop, save antigo, prints pra conferir visual. Use antes de lançar, depois de qualquer mudança visual, pra reproduzir bug de tela, ou quando precisar ver como algo ficou.
---

# Teste no navegador (sempre headless)

**Nunca abra janela visível**: rouba o foco do Miguel. Playwright com `headless: true`. O Claude in Chrome é só
pras contas dele (TikTok etc.), e só depois de perguntar qual navegador.

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
| `?cards=1` | galeria de cartas (mudança visual de carta: mostrar aqui antes) |
| `?lab=golpes` / `?lab=posicoes` / `&revisao=1` | laboratórios e ferramentas de revisão do Miguel |
| `?demo=crash` | aviso de erro |

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
