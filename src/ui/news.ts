import type { Lang } from '../i18n/lang';
import { utNow } from '../store/ultimate/clock';

/**
 * Notícias: os cartões grandes do topo das Novidades (docs/planos/noticias.md), como o feed do lobby do Fortnite.
 * Lista declarativa, a mais nova primeiro. Pra cada versão: acrescente um cartão aqui (id único e pra sempre, que é
 * ele que o save guarda como visto), com a arte de `NewsArt` e o destino de `NewsTo`. Fica leve de propósito: o botão
 * da barra de cima lê esta lista pra acender o pontinho; a arte e o carrossel só baixam ao abrir (NewsFeed.tsx).
 */
export type NewsArt = 'daily' | 'max' | 'bench' | 'ultimate';
/** Pra onde o botão leva: `cup` = o Estádio (o JOGAR da copa); destino fechado, o botão some. */
export type NewsTo = 'daily' | 'cup' | 'ultimate';

export interface NewsCard {
    id: string;
    /** Primeiro dia no feed (AAAA-MM-DD, Brasília). */
    date: string;
    /** Último dia no feed (inclusive). */
    until: string;
    title: Record<Lang, string>;
    text: Record<Lang, string>;
    art: NewsArt;
    to?: NewsTo;
    /** Antes disso o cartão mostra a contagem no lugar do botão (Time Ultimate). */
    opensAt?: number;
}

/** Estreia do Time Ultimate (o mesmo instante de `ULTIMATE_OPENS_AT`, ui/ultimate/flag.ts; teste em news.test.ts). */
const UT_AT = Date.UTC(2026, 10, 27, 3);

export const NEWS: NewsCard[] = [
    {
        id: 'ultimate-2711',
        date: '2026-11-09',
        until: '2026-12-31',
        title: { pt: 'Time Ultimate · 27/11', en: 'Team Ultimate · Nov 27' },
        text: {
            pt: 'Abra pacotes e monte o time da temporada',
            en: 'Open packs and build your season squad',
        },
        art: 'ultimate',
        to: 'ultimate',
        opensAt: UT_AT,
    },
    {
        id: 'copa-do-dia',
        date: '2026-11-09',
        until: '2026-12-10',
        title: { pt: 'Copa do Dia', en: 'Daily Cup' },
        text: {
            pt: 'A mesma copa pra todo mundo hoje, agora em destaque no JOGAR',
            en: 'The same cup for everyone today, now up front on PLAY',
        },
        art: 'daily',
        to: 'daily',
    },
    {
        id: 'max-rival-lento',
        date: '2026-11-09',
        until: '2026-12-10',
        title: { pt: 'Golpe máximo do rival', en: "Rival's max move" },
        text: {
            pt: 'O golpe máximo do rival também chega em câmera lenta',
            en: "The rival's max move now plays in slow motion too",
        },
        art: 'max',
        to: 'cup',
    },
    {
        id: 'banco-vaga-vazia',
        date: '2026-11-09',
        until: '2026-12-10',
        title: { pt: 'Vaga vazia no banco', en: 'Empty bench slot' },
        text: {
            pt: 'Copa longa: quem sai do banco deixa a vaga, e o próximo reforço entra nela',
            en: 'Long Cup: whoever leaves the bench frees the slot for the next signing',
        },
        art: 'bench',
        to: 'cup',
    },
    /* Ligue quando a branch entrar (e troque a data):
    {
        id: 'meus-pacotes',
        date: '2026-11-27',
        until: '2026-12-31',
        title: { pt: 'Meus pacotes', en: 'My packs' },
        text: { pt: 'Os pacotes que você ganhou ficam guardados até você abrir', en: 'Packs you earn wait until you open them' },
        art: 'ultimate',
        to: 'ultimate',
    },
    {
        id: 'rota-nova',
        date: '2026-12-01',
        until: '2027-01-15',
        title: { pt: 'Rota nova', en: 'New Route' },
        text: { pt: 'A Copa longa ganhou um caminho novo até a Liga Índigo', en: 'The Long Cup has a new path to the Indigo League' },
        art: 'daily',
        to: 'cup',
    },
    */
];

/** Meia-noite (ou o fim do dia) de Brasília de um AAAA-MM-DD. */
const day = (d: string, end = false) => Date.parse(`${d}T${end ? '23:59:59.999' : '00:00:00'}-03:00`);

/** Os cartões no ar agora, na ordem da lista. */
export const activeNews = (now = utNow(), list = NEWS) =>
    list.filter((c) => day(c.date) <= now && now <= day(c.until, true));

/** Cartões no ar que este save ainda não viu (`Profile.newsSeen`; sem o campo = nenhum visto). */
export const unseenNews = (seen: readonly string[] | undefined, now = utNow(), list = NEWS) =>
    activeNews(now, list).filter((c) => !seen?.includes(c.id));

/** O visto que fica no save: o que já tinha mais os novos (ids curtos, poucos por versão: a lista só cresce). */
export const withSeen = (seen: readonly string[] | undefined, ids: readonly string[]) => [
    ...new Set([...(seen ?? []), ...ids]),
];
