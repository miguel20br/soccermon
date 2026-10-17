---
name: soccermon-pesquisa
description: Como começar uma feature grande do Soccermon (modo novo, escanteio, multiplayer, modo história, sistema novo de cartas…) — pesquisa ampla de referências, proposta com opções e lista de decisões pro Miguel antes de qualquer código. Use quando ele pedir algo novo e grande, disser "vamos fazer a 0.X", "pesquisa", "brainstorm", ou trouxer uma ideia ainda solta.
---

# Feature grande: pesquisa → proposta → decisões → código

O Miguel gosta de **pesquisa ampla de referências antes de planejar** (repos do GitHub, jogos parecidos, libs,
assets, regras reais, game design) e de decidir junto. Não comece a codar feature grande sem a proposta aprovada.

## 1. Pesquisa (em paralelo, em background)

Dispare 1 agente por frente independente (ex.: "regras e jogos de referência" e "parte técnica"), cada um:
- só leitura do repo + web; **não mexe em código**;
- escreve UM doc em `docs/planos/<feature>.md` (ou uma seção nova num doc existente), em PT-BR informal no estilo
  dos outros planos;
- lê o código que a feature toca pra ancorar a proposta (arquivos e funções reais);
- cobre: regras/dados reais, como 5–10 jogos de referência fazem (o que o jogador decide, o que deixa divertido ou
  chato), repos/libs open source, limites (Supabase grátis, Vercel, sem dinheiro nenhum, motor determinístico);
- termina com **2–3 opções** (do simples ao rico) com esforço e risco, **uma recomendação** e a **lista de decisões**
  (perguntas curtas, recomendação primeiro), e as fontes com link.

## 2. Proposta pro Miguel

Resuma no chat (começando com "Miguel,"): o que a pesquisa achou de mais útil, as opções numa tabela, sua
recomendação e as perguntas. Ele costuma responder em lista numerada ("1, ...; 2, ..."). Registre as decisões no
doc, numa seção "Decidido com o Miguel (data)".

## 3. Construção

- Quebre em etapas pequenas e testáveis; mudanças no motor sobem `ENGINE_VERSION` e passam pela skill
  `soccermon-balanceamento` (antes/depois + ok dele).
- Trabalho paralelo em worktrees (ver "Regras de desenvolvimento" no `CLAUDE.md`).
- Visual: conferir headless (skill `soccermon-teste-navegador`).
- Fechou a versão: skill `soccermon-lancamento`.

## Regras de design que valem pra qualquer feature

Diversão > realismo; nada automático no time do jogador (substituição, tática, escalação são dele); eventos
grandes têm momento e animação próprios; sem emoji na interface; carta = campo; tudo também em inglês
(`src/i18n/`); celular primeiro (320/390 px e deitado).
