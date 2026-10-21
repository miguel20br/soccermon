---
name: soccermon-marca
description: Checklist de padronização da marca do Soccermon (logo, cor, fonte, ícone, kit da transmissão, movimento e o método de escrita do Miguel). Use antes de mexer em qualquer visual, ícone, texto de interface ou asset (tela nova, botão, selo, legenda de vídeo, post, arte, favicon), e pra revisar se algo destoa.
---

# Marca do Soccermon: checklist

O guia completo é `docs/marca/brand-guide.md` (página visual: `docs/marca/index.html`). Leia a seção do que vai
mexer. Aqui fica o que conferir sempre.

## Antes de começar

- Tela ou peça nova usa o **kit da transmissão** (`src/ui/broadcast-kit.css`): `.bc-screenhead` com `.bc-tag`,
  `.bc-surface` + `.bc-stripe`, `.bc-seg`, `.bc-tabs`, `.bc-thumbbar`. Nada de inventar painel novo.
- Visual de carta só pela galeria `?cards=1`, com o ok do Miguel antes de espalhar.
- Asset de divulgação (vídeo, logo, imagem, post): leia também `.claude/skills/soccermon-assets/SKILL.md`.

## Logo

- [ ] Sempre o arquivo: `public/assets/ui/logo.svg` (horizontal), `simbolo.svg`, `icone.svg`, `favicon.svg`.
      Nunca escreva SOCCERMON em fonte no lugar do logo.
- [ ] Proporção 1441 x 300 (`height: auto`), respiro de metade da altura das letras, mínimo 120 px de largura
      (abaixo disso, o símbolo, mínimo 24 px).
- [ ] Sem degradê, sem glow, sem sombra macia, sem recolorir. Fundo claro: versão de uma cor
      (`trailer/arte/logo/final/logo-*-mono-azul.svg`).
- [ ] Mudou o logo? `python3 trailer/arte/logo/final/logo.py && node trailer/arte/logo/final/publicar.mjs` e
      `CHROME_PATH=/usr/bin/chromium node docs/marketing/arte/render.mjs`.

## Cor e forma

- [ ] Só tokens: `--bg`, `--panel`, `--panel-2`, `--line`, `--text`, `--muted`, `--yellow`, `--red`, `--blue`,
      `--green`, `--bc-ink*`. Hex solto só se for cor de tipo (`TYPE_COLOR`), de metal/raridade (`rarity.ts`) ou do
      logo.
- [ ] Dourado é destaque (etiqueta, seleção); vermelho é a ação principal; um por tela.
- [ ] Contraste da tabela do guia: branco sobre verde não; texto pequeno no vermelho vai em `--red-dark`.
- [ ] Sombra dura (sem blur), raios 4/6/8/10, borda de baixo preta no placar.

## Fonte

- [ ] Galmuri14 pra placar e título de tela; Galmuri11 pra texto; Bold pra botão, rótulo e etiqueta (10 px caixa
      alta). Texto corrido ≥ 12 px.
- [ ] Símbolo novo num texto: rode `npx vitest run scripts/fonts.test.ts`; se faltar, `npm run fonts`.

## Ícones

- [ ] Ícone de interface (botão, seta, estado, rótulo) = `HudIcon` (`src/ui/components/MatchHud.tsx`): grade 24, só
      contorno, traço 2.4, ponta e junta redondas, `currentColor`. Falta um? Acrescente no mapa `ICONS`; nunca um
      SVG solto com outro traço. Tamanho muda por `className`, o traço não (abaixo de 14 px vai a 3).
- [ ] Nada de caractere como ícone: `× ▲ ▼ ★ ✓ ✗ ↻ → ➜ ✦` sozinhos num botão ou marcador viram `HudIcon`.
      Pontuação dentro da frase pode (`·`, `…`, "A → B", `×2`).
- [ ] **Nenhum emoji na interface.** Só no texto de Compartilhar e nos posts.
- [ ] Ilustração de menu (`MenuIcon`, troféu, insígnia) só em cartão de menu e prêmio.
- [ ] Sprite em múltiplo inteiro com `pixelated` (item: 30/60/90); reduzido, `image-rendering: auto`.
- [ ] Depois de mexer: `node docs/marca/montar.mjs` atualiza a galeria de ícones do guia.

## Movimento

- [ ] **Nada teleporta:** toda troca de tela, entrada, saída e mudança de estado tem transição (200–300 ms); nada pula
      de posição. Use o que já existe (`src/ui/view-transition.ts`, `tab-slide.ts`, `exit-motion.ts`) e confira com
      `npm run teleporte`. Backlog em `docs/planos/nada-teleporta.md`.
- [ ] `--ease-out` pra tudo, `--ease-pop` só no pop de jogo. Anime `transform`/`opacity`.
- [ ] Testou com **Reduzir movimento** ligado (Configurações › Acessibilidade, ou `data-reduce-motion="true"`) e com
      `prefers-reduced-motion`. Loop infinito só em decoração leve.

## Texto (o método do Miguel)

- [ ] Curto e direto. No jogo, até ~12 palavras por texto. Legenda de vídeo: 2 a 5 palavras, caixa alta, a feature
      dita ("EVOLUÇÕES NO MEIO DO JOGO", "MULTIPLAYER ONLINE", "COPA RANKEADA").
- [ ] Sem ironia, sem piada empilhada, sem tricolon ("Monte. Escale. Evolua."), sem "não é X, é Y", sem dois-pontos
      dramático nem frase de efeito (recusada em 21/10: "Em Kanto, ginásio virou quadra: …", "cara de IA").
- [ ] Nomes do cânone ficam: ginásio, líder, insígnia (nunca "quadra" no lugar de ginásio).
- [ ] Interface = rótulo curto (nome + desenho + ícone, +/− em 2–3 palavras: "Pewter → Ferrolho (3 fixos)"); frase só
      onde é explicação. Não explique o óbvio nem repita regra. Mecânica nova aparece explicada numa linha, na hora.
- [ ] Fala de personagem soa como o personagem (o Brock fala como Brock); a regra vai no rótulo, não na fala.
- [ ] Humor de fã só em momento pontual (abertura do vídeo, tagline, faixas da torcida, posts), de preferência
      paródia de coisa real: "ABAIXA QUE É HYPER BEAM", "Sua insígnia é minha!", "Confia no professor!".
- [ ] Jargão Pokémon pode (PP, super efetivo, insígnia, MT); golpe com o nome oficial em inglês.
- [ ] Frase escrita pelo Miguel fica como está: só gramática ou tamanho, e avise o que mudou.
- [ ] PT e EN (`src/i18n/`). Rode `python3 -I .claude/skills/soccermon-marca/copy_ia.py <arquivo>` (legendas:
      `--legenda <arquivo com uma por linha>`) e leia em voz alta.

## Proibido

- Marca da Nintendo em destaque (logo oficial do Pokémon, Pokébola como símbolo, fonte Pokémon Solid, parecer
  oficial). O rodapé com o aviso de direitos fica.
- Dinheiro de qualquer tipo (doação, anúncio, loja).

## Antes de dizer que está pronto

- [ ] Print headless a 320, 390, 844x390 e 1440 do que mudou, olhando o print (ícone no lugar, nada cortado).
- [ ] Nenhum caractere-ícone novo: `rg -n "['\">][×▲▼★✓✗↻➜✦]['\"<]" src/ui src/i18n`.
