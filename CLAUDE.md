# Soccermon: contexto para o Claude

Este arquivo leva para qualquer aparelho (PC, celular, nuvem) o que o Claude precisa saber do projeto e do
Miguel, o dono. As preferências abaixo valem em toda sessão.

Planos para o futuro: [docs/planos/roadmap.md](docs/planos/roadmap.md). Cópia das memórias do Claude feitas
no PC (preferências e decisões, com o porquê de cada uma): [docs/memoria/](docs/memoria/). Ao aprender uma
preferência nova do Miguel em outro aparelho, registre aqui no CLAUDE.md para ela valer em todos.

## Como falar com o Miguel

- **Sempre comece cada resposta com "Miguel,"** (nome e vírgula). É o teste de sanidade dele: se a resposta não
  começar assim, é sinal de contexto degradado.
- Português do Brasil, informal. Ele é fã enorme de Pokémon: pode usar jargão (BST, learnset, cries, Gen 1, PMD)
  sem explicar. Nada de alerta jurídico alarmista: ele sabe que é fan game.
- Antes de planejar algo grande e novo, ele gosta de uma pesquisa ampla de referências (repos do GitHub, libs,
  assets, skills de game design).

## Regras de design (decididas com ele)

- **Diversão > realismo.** Muitos gols e passes não são problema. Não recalibre o motor para "ficar realista"
  sem ele pedir. Priorize golpes e atributos visíveis em campo, ritmo e viradas. Teste olhando o jogo, não só
  pela calibração.
- **Posições, fórmulas de atributo e equilíbrio: decidir junto.** Mostre antes/depois (tabela, exemplos de
  Pokémon, números do `npm run calibrate`) e só aplique depois do ok explícito dele, mesmo que esteja num plano
  aprovado.
- **Nada automático no time do jogador.** Substituição, tática e escalação são escolhas dele (a IA rival pode ser
  automática). Eventos grandes (evolução, troca) têm momento e animação próprios e gatilho exigente.
- **Cartas:** minimalistas, bronze/prata/ouro pela nota (≤64 / 65–74 / 75+, padrão FIFA), nota e atributos
  grandes, raridade só como acabamento. Edições especiais (Shiny, Destaque, Ícone, Evento) têm visual próprio.
  Mudança visual de carta: mostrar na galeria `?cards=1` antes de espalhar.
- **Sem emoji na interface do jogo** (golpes, menus, gráficos): use ícones desenhados (SVG ou Phaser). O texto
  de Compartilhar pode ter emoji.
- **Carta = campo:** `src/engine/modifiers.ts` é a regra única de bônus; carta, painel e motor usam a mesma.

## O projeto

Fan game de navegador **sem fins lucrativos** (AGPL-3.0): draft roguelike "escolha 1 de 3" com os 151 de Kanto
+ copa de futsal 5v5 simulada. No ar em https://soccermon.vercel.app. Repo: github.com/miguel20br/soccermon.

- Stack: Vite 8, React 19, TypeScript, Phaser 4, Zustand (save em IndexedDB), Vitest, Biome.
- Motor em `src/engine/` é **determinístico** (20 Hz, mesma seed + mesmas ordens = mesma partida): nada de
  `Math.random()` ou `Date` lá dentro; use o `Rng` do estado. Snapshots com `SNAP_STRIDE = 7`.
- Visão de longo prazo: **modo carreira** (temporadas, XP, evolução) e **modo jogável** (controlar um Pokémon ou
  o time, estilo FC). Preserve: controllers plugáveis (IA e humano emitem os mesmos Commands), tick fixo,
  BatchRunner + LiveRunner, MatchConfig paramétrico, PokemonInstance (não só espécie).
- Contas: login Google + save na nuvem via Supabase (projeto `vszcxacbcabohhdwxfpb`, integração da Vercel).
  Regras de acesso em `supabase/migrations/` (cada um só lê e escreve o próprio save). Sem as variáveis de
  ambiente o jogo roda 100% local.
- Atalhos de dev (`npm run dev`, porta 8080): `?demo=penaltis|ditto|evolucao|campeao`, `?cards=1`,
  `?lab=posicoes`. Público: `?lab=golpes` (com `&revisao=1` mostra a ferramenta de revisão ok/mudar).

## Rotina de trabalho

```bash
npm run lint     # Biome
npm test         # Vitest (~1 min; o teste de evolução é o mais lento)
npm run build    # tsc + Vite
npm run calibrate -- --n 400 [--formations|--tactics]   # equilíbrio headless
```

- **Deploy:** push na `main` publica sozinho em produção (Vercel ligada ao GitHub). O CI do GitHub roda lint,
  testes e build em todo push e PR.
- **Versão nova:** atualize `src/ui/patch-notes.ts` (aparece em Novidades no jogo), gere o `CHANGELOG.md` a
  partir dele, suba `version` no `package.json` e crie a tag `vX.Y.Z`. Commits em português, terminando com a
  linha `Co-Authored-By` do Claude.
- Antes de fechar uma mudança visual, confira no celular (320 e 390 px), deitado e no desktop.

## Estado atual (14/10/2026, v0.7.2)

No ar: contas e save na nuvem, evolução no meio da partida, substituição pelo técnico, painel ao tocar no
Pokémon, estatísticas da partida e da copa, 6 formações, tela de campeão, menus novos, golpes revisados com
animação própria, bônus de time recalculados a cada troca/evolução, página de privacidade e "Apagar minha
conta" (migração `20261014180000_apagar_conta.sql` já aplicada no banco).

### Pendente

0. **Botão oficial do Google (tira o "vszcxacbcabohhdwxfpb.supabase.co" da tela de login):** o código já existe
   (`src/cloud/google-button.ts`, login com `signInWithIdToken`), mas só liga com o Client ID da Web do Google.
   Falta: (a) colocar o Client ID (termina em `.apps.googleusercontent.com`; é público) como valor padrão de
   `GOOGLE_CLIENT_ID` em `src/cloud/google-button.ts` ou na variável `VITE_GOOGLE_CLIENT_ID` da Vercel;
   (b) no Google Cloud Console → Clients → esse client → **Authorized JavaScript origins**:
   `https://soccermon.vercel.app` e `http://localhost:8080`; (c) escopo `openid` em Data Access. No Supabase
   (Google provider) o mesmo Client ID precisa estar em "Client IDs" e "Skip Nonce Check" desligado. Sem o
   Client ID o jogo usa o login antigo por redirecionamento.
1. **Tela de consentimento OAuth do Google (Google Cloud Console):** passar de "Teste" para "Em produção",
   com nome Soccermon, logo e link de privacidade `https://soccermon.vercel.app/privacidade.html`. Em modo
   teste só os e-mails cadastrados conseguem entrar. Só o Miguel faz (no navegador).
2. **Tornar o repositório público** (decisão dele; é praticamente irreversível). Depois: descrição, site
   (`https://soccermon.vercel.app`) e tópicos no repo; decidir canal da comunidade (Discussions do GitHub ou
   Discord). O link "Código no GitHub" no rodapé do jogo dá 404 enquanto o repo for privado.
3. Ditto no painel da partida mostra a forma original, não a copiada (`PlayerInspect.tsx`).
4. Ideias combinadas para depois: melhores momentos/replay (os snapshots já existem), quadras temáticas e
   treinadores, modo carreira (0.8+).

### Riscos que ele já conhece

- Supabase gratuito pausa depois de 7 dias sem uso (o login cai até reativar no painel).
- Exposição pública aumenta o risco de pedido de retirada pela Nintendo: manter sem dinheiro nenhum (sem
  doações, sem anúncios).
- Segredos do banco ficam só no `.env.local` do PC (nunca commitar). Para rodar migração sem o PC, use o SQL
  Editor do painel do Supabase.
