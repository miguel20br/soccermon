---
name: soccermon-titulos
description: Como criar título por código pros gametesters e amigos do Miguel (ex.: "GOAT" do Davi, dourado). Use quando ele pedir um título personalizado pra alguém, mandar nome e título de gametester, ou quiser um visual especial de título.
---

# Títulos por código

Títulos aparecem embaixo do nome do treinador (Perfil, lista de títulos, Hall da Fama, card de compartilhar). Os
de missão ficam em `src/store/missions.ts`; os de **código** em `src/store/title-codes.ts`.

## Criar um

1. Gere um código difícil de chutar, em MAIÚSCULAS, guarde no scratchpad (nunca no repo — o repo é público):
   ```bash
   CODE="NOME-TITULO-$(openssl rand -hex 2 | tr a-f A-F)"
   node -e "console.log(require('crypto').createHash('sha256').update(process.argv[1]).digest('hex'))" "$CODE"
   ```
2. Em `CODE_TITLES`: `'<hash>': '<id>'` com um comentário de quem é e a data (`// Davi, 1º gametester (17/10/2026)`).
3. Em `CUSTOM_TITLES`: `<id>: { pt, en, look? }`.
   - `look: 'shine'`: dourado com brilho passando (o "GOAT" do Davi).
   - `look: 'holo'`: holográfico, **só o do Miguel** ("Criador do Soccermon"). Não use em mais ninguém.
   - Visual novo: classe `title-<look>` em `src/ui/profile/profile.css`, respeitando "reduzir movimento" (as duas
     regras: `prefers-reduced-motion` e `:root[data-reduce-motion="true"]`).
4. Confira que resgata: um `.mts` no scratchpad que importa `redeemCode` de `src/store/title-codes.ts` e testa o
   código em minúsculas com espaços. **Não ponha o código de verdade em teste** (repo público).
5. Print headless do Perfil com o título (skill `soccermon-teste-navegador`): Perfil → Meu clube → "Resgatar código".
6. Commit e, quando o Miguel autorizar, sobe (é deploy). Entregue o código a ele no chat, com o caminho:
   Perfil → Meu clube → Resgatar código (maiúscula ou minúscula tanto faz).

Vários códigos podem dar o mesmo título (ex.: `gametester` pra vários testers).
