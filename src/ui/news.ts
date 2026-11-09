import type { Lang } from '../i18n/lang';
import { utNow } from '../store/ultimate/clock';

/**
 * Notícias: os cartões grandes do topo das Novidades (docs/planos/noticias.md), como o feed do lobby do Fortnite.
 * Lista declarativa, a mais nova primeiro. Pra cada versão: acrescente um cartão aqui (id único e pra sempre, que é
 * ele que o save guarda como visto), com a arte de `NewsArt` e o destino de `NewsTo`. Fica leve de propósito: o botão
 * da barra de cima lê esta lista pra acender o pontinho; a arte e o carrossel só baixam ao abrir (NewsFeed.tsx).
 */
export type NewsArt = 'daily' | 'max' | 'bench' | 'ultimate' | 'packs' | 'rota' | 'golpedex';
/**
 * Pra onde o botão leva: `daily` = a Copa do Dia; `estadio`/`rota` = a Home naquela aba (a Rota é a Copa longa);
 * `golpedex` = a Coleção na Golpedex; `ultimate` = o Time Ultimate (fechado, o botão some e fica a contagem).
 */
export type NewsTo = 'daily' | 'estadio' | 'rota' | 'golpedex' | 'ultimate';

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
    /** O rótulo do botão, dizendo aonde ele leva ("Jogar a Copa do Dia", nunca só "Jogar" se houver dúvida). */
    cta?: Record<Lang, string>;
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
        cta: { pt: 'Jogar', en: 'Play' },
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
        cta: { pt: 'Jogar a Copa do Dia', en: 'Play the Daily Cup' },
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
        to: 'estadio',
        cta: { pt: 'Ver na copa', en: 'See it in a cup' },
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
        to: 'rota',
        cta: { pt: 'Jogar a Copa longa', en: 'Play the Long Cup' },
    },
];

/**
 * Os próximos cartões, prontos com arte e destino, esperando a branch deles entrar: pra ligar, passe o cartão pra
 * `NEWS` com a data do lançamento. Nas prévias, `?noticias=prox` mostra eles no feed (pra ver a arte antes).
 */
export const NEXT_NEWS: NewsCard[] = [
    {
        id: 'meus-pacotes',
        date: '2026-11-27',
        until: '2026-12-31',
        title: { pt: 'Meus pacotes e Picks', en: 'My packs and Picks' },
        text: {
            pt: 'Pacotes guardados até você abrir, e o Pokémon Picks: escolha 1 de 3',
            en: 'Packs wait until you open them, and Pokémon Picks: choose 1 of 3',
        },
        art: 'packs',
        to: 'ultimate',
        cta: { pt: 'Ver meus pacotes', en: 'See my packs' },
        opensAt: UT_AT,
    },
    {
        id: 'rota-nova',
        date: '2026-12-01',
        until: '2027-01-15',
        title: { pt: 'Rota nova', en: 'New Route' },
        text: {
            pt: 'Mapa mais largo, a Zona Safari e o Cassino no caminho da Copa longa',
            en: 'A wider map, the Safari Zone and the Game Corner on the Long Cup path',
        },
        art: 'rota',
        to: 'rota',
        cta: { pt: 'Ver a Rota', en: 'See the Route' },
    },
    {
        id: 'golpedex-especiais',
        date: '2026-12-01',
        until: '2027-01-15',
        title: { pt: 'Golpedex: especiais e bicudas', en: 'Movedex: specials and punts' },
        text: {
            pt: 'Os golpes especiais e as bicudas do goleiro agora estão na Golpedex',
            en: "Special moves and the keeper's punts are now in the Movedex",
        },
        art: 'golpedex',
        to: 'golpedex',
        cta: { pt: 'Abrir a Golpedex', en: 'Open the Movedex' },
    },
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
