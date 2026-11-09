import { weeklyEventType } from '../engine/specials';
import { typeName } from '../i18n';
import type { Lang } from '../i18n/lang';
import { utNow } from '../store/ultimate/clock';

/**
 * Notícias: os cartões grandes do topo das Novidades (docs/planos/noticias.md), como o feed do lobby do Fortnite.
 * Lista declarativa, a mais nova primeiro. Pra cada versão: acrescente um cartão aqui (id único e pra sempre, que é
 * ele que o save guarda como visto), com a arte de `NewsArt` e o destino de `NewsTo`. Fica leve de propósito: o botão
 * da barra de cima lê esta lista pra acender o pontinho; a arte e o carrossel só baixam ao abrir (NewsFeed.tsx).
 */
export type NewsArt = 'daily' | 'max' | 'bench' | 'ultimate' | 'packs' | 'rota' | 'golpedex' | 'evento';
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
    /** O tipo em evento (arte `evento`). */
    type?: string;
}

/** Estreia do Time Ultimate (o mesmo instante de `ULTIMATE_OPENS_AT`, ui/ultimate/flag.ts; teste em news.test.ts). */
const UT_AT = Date.UTC(2026, 10, 27, 3);

/**
 * Só as notícias principais (Miguel, 09/11: "não enche linguiça"); o resto fica nas Notas da versão. O evento da
 * semana entra na frente sozinho (`weekCard`), com o mesmo tipo do letreiro do Estádio.
 */
export const NEWS: NewsCard[] = [
    {
        id: 'ultimate-2711',
        date: '2026-11-09',
        until: '2026-12-31',
        title: { pt: 'Time Ultimate · 27/11', en: 'Team Ultimate · Nov 27' },
        text: {
            pt: 'Meus pacotes guarda o que você ganha, e no Pokémon Picks você escolhe 1 de 3',
            en: 'My Packs keeps what you win, and in Pokémon Picks you choose 1 of 3',
        },
        art: 'packs',
        to: 'ultimate',
        cta: { pt: 'Ver meus pacotes', en: 'See My Packs' },
        opensAt: UT_AT,
    },
    {
        id: 'rota-nova',
        date: '2026-11-09',
        until: '2027-01-15',
        title: { pt: 'Rota nova', en: 'New Road' },
        text: {
            pt: 'Mapa mais largo, a Zona Safari e o Cassino no caminho da Copa longa',
            en: 'A wider map, the Safari Zone and the Game Corner on the Long Cup path',
        },
        art: 'rota',
        to: 'rota',
        cta: { pt: 'Ver a Rota', en: 'See the Road' },
    },
];

/**
 * Os próximos cartões, prontos com arte e destino, esperando a branch deles entrar: pra ligar, passe o cartão pra
 * `NEWS` com a data do lançamento. Nas prévias, `?noticias=prox` mostra eles no feed (pra ver a arte antes).
 */
export const NEXT_NEWS: NewsCard[] = [];

const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * O evento da semana (`weeklyEventType`, a mesma regra do letreiro e do draft): segunda a domingo, id por semana (o
 * pontinho acende a cada evento novo).
 */
export function weekCard(now = utNow()): NewsCard {
    const d = new Date(now);
    const type = weeklyEventType(d);
    const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
    const [dd, mm] = [String(sun.getDate()).padStart(2, '0'), String(sun.getMonth() + 1).padStart(2, '0')];
    return {
        id: `evento-${ymd(mon)}`,
        date: ymd(mon),
        until: ymd(sun),
        title: { pt: `Semana do tipo ${typeName(type, 'pt')}`, en: `${typeName(type, 'en')}-type week` },
        text: {
            pt: `Cartas Evento de ${typeName(type, 'pt')} podem sair no draft, até domingo (${dd}/${mm})`,
            en: `${typeName(type, 'en')} Event cards can turn up in the draft, until Sunday (${mm}/${dd})`,
        },
        art: 'evento',
        type,
        to: 'estadio',
        cta: { pt: 'Jogar uma copa', en: 'Play a cup' },
    };
}

/** Meia-noite (ou o fim do dia) de Brasília de um AAAA-MM-DD. */
const day = (d: string, end = false) => Date.parse(`${d}T${end ? '23:59:59.999' : '00:00:00'}-03:00`);

/** Os cartões no ar agora, na ordem da lista (a de verdade começa pelo evento da semana). */
export const activeNews = (now = utNow(), list = NEWS) => [
    ...(list === NEWS ? [weekCard(now)] : []),
    ...list.filter((c) => day(c.date) <= now && now <= day(c.until, true)),
];

/** Cartões no ar que este save ainda não viu (`Profile.newsSeen`; sem o campo = nenhum visto). */
export const unseenNews = (seen: readonly string[] | undefined, now = utNow(), list = NEWS) =>
    activeNews(now, list).filter((c) => !seen?.includes(c.id));

/** O visto que fica no save: o que já tinha mais os novos (ids curtos, poucos por versão: a lista só cresce). */
export const withSeen = (seen: readonly string[] | undefined, ids: readonly string[]) => [
    ...new Set([...(seen ?? []), ...ids]),
];
