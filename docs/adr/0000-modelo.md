---
description: Modelo de ADR do Soccermon e as regras de uso (aceito não se edita).
status: modelo
data: 2026-10-21
---

# NNNN. Título curto da decisão

## Contexto

O problema, o que forçou a decidir agora e o que já foi descartado.

## Decisão

O que ficou decidido, em uma ou duas frases diretas.

## Consequências

O que passa a valer (bom e ruim), o que fica mais difícil e como conferir.

---

Regras:
- Numeração sequencial, nunca reaproveitada. Arquivo `NNNN-slug.md`, frontmatter com `description` (1 linha), `status` (`proposto`, `aceito` ou `substituído por NNNN`) e `data`.
- ADR aceito não se edita. Decisão nova vira ADR novo e só muda o `status` do velho.
- Vale ADR quando a decisão é cara de reverter e vai gerar "por que fizemos assim?". O resto fica no plano ou no commit.
