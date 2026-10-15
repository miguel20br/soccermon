import { CLUBS } from '../../engine/cup';
import { BENCH_SIZE, DRAFT_PICKS } from '../../engine/draft';
import { TACTIC_MODS } from '../../engine/effective';
import { FORMATIONS } from '../../engine/formations';
import { ITEMS } from '../../engine/items';
import { LINKS } from '../../engine/links';
import { ICON_CHANCE, ICONS, SPECIAL_BONUS } from '../../engine/specials';
import type { Tactic } from '../../engine/state';
import { TM_REWARD_CHANCE } from '../../engine/tm';
import {
    clubName,
    dict,
    fmt,
    formationText,
    itemDesc,
    itemName,
    type Lang,
    linkText,
    pct,
    typeName,
    type Vars,
} from '../../i18n';
import type { HelpDictBlock } from '../../i18n/pt/help';
import { START_REROLLS } from '../../store/game-store';
import { FEEDBACK_URL } from '../links';

/**
 * Ajuda montada no idioma do jogo. Os textos ficam em src/i18n/{pt,en}/help.ts; os números vêm direto do
 * motor (formações, itens, sinergias, táticas, clubes), então a Ajuda não fica desatualizada quando eles mudam.
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
    basico: 25,
    draft: 133,
    formacoes: 68,
    posicoes: 95,
    cartas: 6,
    tipos: 9,
    golpes: 129,
    golpesJogos: 18,
    status: 39,
    habilidades: 94,
    itens: 143,
    sinergias: 150,
    partida: 26,
    evolucao: 4,
    copa: 149,
    recompensas: 52,
    recordes: 151,
    pokedex: 137,
    conta: 132,
} as const;

const TACTICS: Tactic[] = ['balanced', 'offensive', 'defensive', 'counter'];

function dynamicList(kind: Extract<HelpDictBlock, { dyn: string }>['dyn'], lang: Lang): [string, string][] {
    const d = dict(lang);
    const g = d.help.gen;
    switch (kind) {
        case 'formations':
            return Object.values(FORMATIONS).map((f): [string, string] => {
                const text = formationText(f.id, lang);
                return [
                    text.name,
                    fmt(g.formationLine, {
                        positions: f.slots
                            .slice(1)
                            .map((s) => d.common.pos[s])
                            .join(', '),
                        description: text.description,
                    }),
                ];
            });
        case 'items':
            return Object.values(ITEMS)
                .filter((i) => i.kind !== 'type')
                .map((i): [string, string] => [itemName(i.id), itemDesc(i.id, lang)]);
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
        case 'gyms':
            return CLUBS.filter((c) => c.city !== 'Indigo Plateau').map((c): [string, string] => [
                clubName(c.name, lang),
                fmt(g.gymLine, {
                    types: c.types.map((t) => typeName(t, lang)).join('/'),
                    formation: formationText(c.formation, lang).name,
                    tactic: d.common.tactic[c.tactic],
                }),
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
    const league = CLUBS.find((c) => c.city === 'Indigo Plateau');
    return {
        stages: d.common.stage.join(' → '),
        picks: DRAFT_PICKS,
        bench: BENCH_SIZE,
        rerolls: START_REROLLS,
        bonus: SPECIAL_BONUS,
        iconCount: Object.keys(ICONS).length,
        iconOdds: Math.round(1 / ICON_CHANCE),
        tmOdds: Math.round(TM_REWARD_CHANCE * 100),
        league: league ? clubName(league.name, lang) : clubName('Liga Índigo', lang),
        typeItems: Object.values(ITEMS)
            .filter((i) => i.kind === 'type')
            .map((i) => itemName(i.id))
            .join(', '),
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
