import { AGENCY, MAX_FX_PIECES } from '../../engine/agency';
import { TACTIC_MODS } from '../../engine/effective';
import { LINKS } from '../../engine/links';
import { ICON_CHANCE, ICONS, SPECIAL_BONUS } from '../../engine/specials';
import type { Tactic } from '../../engine/state';
import { dict, fmt, type Lang, linkText, pct, typeName, type Vars } from '../../i18n';
import type { HelpDictBlock } from '../../i18n/pt/help';
import { FEEDBACK_URL } from '../links';
import { maxFillText, maxFxText, maxStatusVerb, maxTimingText } from '../max-levels';

/**
 * Ajuda montada no idioma do jogo. Os textos ficam em src/i18n/{pt,en}/help.ts; os números vêm direto do
 * motor (sinergias, táticas, golpe máximo), então a Ajuda não fica desatualizada quando eles mudam.
 *
 * Formato: `p` = parágrafo; `list` = lista (string, ou [termo, explicação]). `**negrito**` funciona.
 */
export type HelpBlock =
    | { p: string }
    | { list: (string | [string, string])[] }
    | { link: { href: string; label: string } };

export interface HelpSection {
    id: string;
    title: string;
    /** Sprite (id da espécie) que ilustra a seção. */
    sprite: number;
    blocks: HelpBlock[];
}

export interface FaqEntry {
    q: string;
    a: HelpBlock[];
}

/** Ordem das seções e o sprite de cada uma. */
const SECTION_SPRITES = {
    posicoes: 95,
    cartas: 6,
    tipos: 9,
    sinergias: 150,
    partida: 26,
    golpes: 129,
    status: 39,
    golpeMax: 130,
    evolucao: 4,
} as const;

const TACTICS: Tactic[] = ['balanced', 'offensive', 'defensive', 'counter'];

function dynamicList(kind: Extract<HelpDictBlock, { dyn: string }>['dyn'], lang: Lang): [string, string][] {
    const d = dict(lang);
    const g = d.help.gen;
    switch (kind) {
        case 'links':
            return LINKS.map((l): [string, string] => {
                const text = linkText(l.id, lang);
                return [
                    fmt(g.linkTerm, { name: text.name, pct: pct(l.bonus) }),
                    fmt(g.linkLine, { desc: text.desc, combo: text.combo }),
                ];
            });
        case 'tactics':
            return TACTICS.map((t): [string, string] => {
                const mods = TACTIC_MODS[t];
                const attrs = Object.entries(mods.attrs)
                    .map(([k, f]) => `${d.common.attr[k as keyof typeof d.common.attr]} ${pct(f)}`)
                    .join(', ');
                const drain =
                    mods.drain === 1 ? '' : fmt(mods.drain > 1 ? g.drainMore : g.drainLess, { pct: pct(mods.drain) });
                return [d.common.tactic[t], fmt(g.tacticLine, { feel: g.tacticFeel[t], attrs, drain })];
            });
        case 'maxLevels':
            return ([1, 2, 3] as const).map((lv): [string, string] => [
                fmt(d.match.agency.maxLevelShort, { n: lv }),
                fmt(g.maxRow[lv - 1], { pw: pct(AGENCY.maxLevelShot[lv].power) }),
            ]);
        case 'maxTypes':
            return Object.keys(MAX_FX_PIECES).map((type): [string, string] => [
                typeName(type, lang),
                fmt(g.maxTypeLine, { st: maxStatusVerb(type, lang), fx: maxFxText(type, lang).name }),
            ]);
    }
}

function buildBlock(b: HelpDictBlock, vars: Vars, lang: Lang): HelpBlock {
    if ('p' in b) return { p: fmt(b.p, vars) };
    if ('link' in b) return { link: { href: FEEDBACK_URL, label: b.link } };
    if ('dyn' in b) return { list: dynamicList(b.dyn, lang) };
    return {
        list: b.list.map((i) =>
            typeof i === 'string' ? fmt(i, vars) : ([fmt(i[0], vars), fmt(i[1], vars)] as [string, string]),
        ),
    };
}

function varsFor(lang: Lang): Vars {
    const d = dict(lang);
    return {
        bonus: SPECIAL_BONUS,
        iconCount: Object.keys(ICONS).length,
        iconOdds: Math.round(1 / ICON_CHANCE),
        maxWho: d.match.agency.levels.who,
        maxFill: maxFillText(lang),
        maxTiming: maxTimingText(lang),
    };
}

const cache = new Map<Lang, { sections: HelpSection[]; faq: FaqEntry[] }>();

function build(lang: Lang) {
    let built = cache.get(lang);
    if (!built) {
        const vars = varsFor(lang);
        const h = dict(lang).help;
        built = {
            sections: (Object.keys(SECTION_SPRITES) as (keyof typeof SECTION_SPRITES)[]).map((id) => ({
                id,
                title: h.sections[id].title,
                sprite: SECTION_SPRITES[id],
                blocks: h.sections[id].blocks.map((b) => buildBlock(b, vars, lang)),
            })),
            faq: h.faq.map((f) => ({ q: f.q, a: f.a.map((b) => buildBlock(b, vars, lang)) })),
        };
        cache.set(lang, built);
    }
    return built;
}

/** Seções da Ajuda no idioma pedido. */
export const helpSections = (lang: Lang): HelpSection[] => build(lang).sections;

/** Perguntas frequentes no idioma pedido. */
export const faqEntries = (lang: Lang): FaqEntry[] => build(lang).faq;

/** Texto puro de um bloco (pra busca). */
export function blockText(b: HelpBlock): string {
    if ('p' in b) return b.p;
    if ('list' in b) return b.list.map((i) => (typeof i === 'string' ? i : i.join(' '))).join(' ');
    return b.link.label;
}

/** Normaliza pra busca: minúsculas, sem acento, sem **. */
export function normalize(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\*\*/g, '');
}
