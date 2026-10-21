import { ABILITIES, MOVES } from '../engine/data';
import { ITEMS } from '../engine/items';
import type { AttrModifier, MoveModifier } from '../engine/modifiers';
import { DRAIN, type ExplainMoveId, MOVE_EXPLAIN, moveProfile } from '../engine/moves';
import { type CupMode, cupLength, isFinalStage, isLong } from '../store/long-cup';
import { en } from './en';
import { moveExplainEn } from './en/move-explain';
import { detectLang, type Lang } from './lang';
import { generatedMoveText } from './move-text';
import { type Dict, pt } from './pt';

export type { Lang } from './lang';
export type { Dict } from './pt';

const DICTS: Record<Lang, Dict> = { pt, en };

/** Caminhos "a.b.c" que levam a um texto do dicionário (com autocompletar e erro de digitação no tsc). */
type Leaves<T, P extends string = ''> = {
    [K in keyof T & (string | number)]: T[K] extends string
        ? `${P}${K}`
        : T[K] extends readonly unknown[]
          ? never
          : T[K] extends (...a: never[]) => unknown
            ? never
            : T[K] extends object
              ? Leaves<T[K], `${P}${K}.`>
              : never;
}[keyof T & (string | number)];

export type TKey = Leaves<Dict>;
export type Vars = Record<string, string | number>;

let current: Lang = detectLang();

/** Idioma em uso (acompanha `settings.lang` pelo settings-sync). */
export const getLang = (): Lang => current;
export function setLang(lang: Lang) {
    current = lang;
}

/** Dicionário do idioma (para listas, textos longos e estruturas: `dict().help.sections`). */
export const dict = (lang: Lang = current): Dict => DICTS[lang];

/** Troca `{nome}` pelos valores. */
export function fmt(text: string, vars?: Vars): string {
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

function lookup(lang: Lang, key: string): string {
    let node: unknown = DICTS[lang];
    for (const part of key.split('.')) node = (node as Record<string, unknown> | undefined)?.[part];
    if (typeof node === 'string') return node;
    if (lang !== 'pt') return lookup('pt', key);
    return key;
}

/** Texto traduzido, com `{nome}` trocado pelos valores. */
export function t(key: TKey, vars?: Vars, lang: Lang = current): string {
    return fmt(lookup(lang, key), vars);
}

/** Escolhe entre "um|vários" pelo número (1 = singular) e troca `{n}` e os outros valores. */
export function plural(forms: string, n: number, vars?: Vars): string {
    const [one, many = one] = forms.split('|');
    return fmt(n === 1 ? one : many, { n, ...vars });
}

/** Plural de uma chave do dicionário: `tn('common.count.goals', 2)` → "2 gols". */
export function tn(key: TKey, n: number, vars?: Vars, lang: Lang = current): string {
    return plural(lookup(lang, key), n, vars);
}

// ---------------------------------------------------------------------------------------------
// Nomes de dados do Pokémon. Em inglês, sempre os nomes oficiais dos jogos; em português, o que o
// jogo já mostrava (golpes, habilidades e itens seguem com o nome oficial em inglês).

export const moveName = (id: string): string => MOVES[id]?.name ?? id;
export const abilityName = (id: string): string => ABILITIES[id]?.name ?? id;
export const itemName = (id: string): string => ITEMS[id]?.name ?? id;

/** Descrição do item no idioma do jogo. */
export function itemDesc(id: string, lang: Lang = current): string {
    const d = DICTS[lang].common;
    const item = ITEMS[id];
    if (item?.kind === 'type' && item.type) return fmt(d.typeItemDesc, { type: typeName(item.type, lang) });
    return d.itemDesc[id] ?? item?.desc ?? '';
}

/** Descrição do golpe: em português a tradução dos dados (quando há), em inglês o texto oficial curto. */
export function moveDesc(id: string, lang: Lang = current): string {
    const m = MOVES[id];
    if (!m) return '';
    return lang === 'pt' ? (m.descPt ?? m.shortDesc) : m.shortDesc;
}

/**
 * O que o golpe faz no futsal: a explicação própria (MOVE_EXPLAIN do motor; inglês em src/i18n/en/move-explain.ts) ou o
 * texto gerado pelos números do motor (src/i18n/move-text.ts). Golpe comum: undefined e a tela usa o texto do tipo.
 */
export function moveExplain(id: string, lang: Lang = current): string | undefined {
    const pt = MOVE_EXPLAIN[id];
    if (!pt) return generatedMoveText(id, lang, DICTS[lang].stats.lab.kind[moveProfile(id).kind] ?? '');
    if (lang === 'pt') return pt;
    return moveExplainEn[id as ExplainMoveId] ?? pt;
}

/**
 * O que o golpe faz no futsal, sempre (nunca a regra de batalha dos jogos): a explicação própria do golpe ou,
 * sem ela, o texto do tipo de golpe da Golpedex (físico, especial, arrancada...).
 */
export function moveFutsal(id: string, lang: Lang = current): string {
    const own = moveExplain(id, lang);
    if (own) return own;
    const lab = DICTS[lang].stats.lab;
    const kind = lab.kind[moveProfile(id).kind] ?? '';
    return DRAIN[id] ? fmt(lab.drains, { kind }) : kind;
}

/** Descrição da habilidade (mesma regra dos golpes). */
export function abilityDesc(id: string, lang: Lang = current): string {
    const a = ABILITIES[id];
    if (!a) return '';
    if (lang === 'en' && id === 'imposter')
        return 'Transform: at kick-off, Ditto becomes a copy of the best Pokémon in its position on the court, from either team.';
    return lang === 'pt' ? (a.descPt ?? a.shortDesc) : a.shortDesc;
}

/** Tipo: "Fogo" / "Fire". */
export const typeName = (type: string, lang: Lang = current): string => DICTS[lang].common.type[type] ?? type;

/** Status pelo nome do motor ('par', 'brn'...) ou pelo código do snapshot (1..7). */
export function statusName(s: string | number, lang: Lang = current): string {
    const c = DICTS[lang].common;
    return (typeof s === 'number' ? c.statusCode[s] : c.status[s]) ?? String(s);
}

/** Fase da copa: "Semifinal" / "Semi-final". */
export const stageName = (stage: number, lang: Lang = current): string => DICTS[lang].common.stage[stage] ?? '';

/** Nome da partida da copa: a fase da rápida ("Semifinal") ou "Partida 3 de 8" / "Final" na Copa longa. */
export function cupStageName(run: { mode?: CupMode }, stage: number, lang: Lang = current): string {
    if (!isLong(run)) return stageName(stage, lang);
    const d = DICTS[lang].longCup;
    return isFinalStage({ ...run, stage }) ? d.final : fmt(d.step, { n: stage + 1, total: cupLength(run) });
}
/** Versão curta (placar da partida, gráficos): "Semi" na rápida, "3/8" na longa. */
export function cupStageShort(run: { mode?: CupMode }, stage: number, short: readonly string[]): string {
    if (!isLong(run)) return short[stage] ?? '';
    return isFinalStage({ ...run, stage }) ? (short.at(-1) ?? '') : `${stage + 1}/${cupLength(run)}`;
}

/** Nome do clube rival (o save guarda o nome em português do motor). */
export const clubName = (name: string, lang: Lang = current): string => DICTS[lang].common.club[name] ?? name;

/** Título da carta Ícone pela espécie (o save guarda o título em português). */
export const iconTitle = (speciesId: number, saved?: string, lang: Lang = current): string =>
    (lang === 'pt' ? saved : undefined) ?? DICTS[lang].common.icon[speciesId] ?? saved ?? '';

/** Formação: nome e descrição. */
export const formationText = (id: string, lang: Lang = current) =>
    DICTS[lang].common.formation[id] ?? { name: id, description: '' };

/** Sinergia de história: nome, descrição e combo. */
export const linkText = (id: string, lang: Lang = current) =>
    DICTS[lang].common.link[id] ?? { name: id, desc: '', combo: '' };

/** "+5%" / "−3%" (mesmo formato das linhas de bônus do motor). */
export const pct = (f: number) => `${f >= 1 ? '+' : '−'}${Math.round(Math.abs(f - 1) * 100)}%`;

/** Patrocínio: nome e efeito. */
export const sponsorText = (id: string, lang: Lang = current) =>
    DICTS[lang].shop.sponsor[id] ?? { name: id, short: id, desc: '' };

/** Linha de bônus da carta no idioma do jogo (em português é o próprio rótulo do motor). */
export function modLabel(m: AttrModifier, lang: Lang = current): string {
    if (m.source === 'patrocinio') {
        const d = DICTS[lang];
        const k = Array.isArray(m.attrs) ? m.attrs[0] : undefined;
        return fmt(d.shop.mod, {
            name: sponsorText(m.ref ?? '', lang).name,
            n: m.add ?? 0,
            what: k ? d.common.attr[k].toLowerCase() : d.shop.allAttrs,
        });
    }
    if (lang === 'pt') return m.label;
    const c = DICTS[lang].common;
    const f = m.factor ?? 1;
    switch (m.source) {
        case 'edicao':
            return fmt(c.mod.edition, { n: m.add ?? 0 });
        case 'evolucao':
            return fmt(c.mod.evolved, { n: m.add ?? 0 });
        case 'habilidade': {
            const k = Array.isArray(m.attrs) ? m.attrs[0] : undefined;
            return fmt(c.mod.ability, {
                name: abilityName(m.ref ?? ''),
                attr: k ? c.attr[k] : '',
                pct: pct(f),
            });
        }
        case 'item':
            return m.ref === 'choiceband' ? c.mod.choiceBand : m.label;
        case 'tipo':
            return c.mod.fairy;
        case 'capitao':
            return m.ref === 'self'
                ? c.mod.captain
                : fmt(m.ref === 'same' ? c.mod.captainSame : c.mod.captainAura, { pct: pct(f) });
        case 'sinergia':
            return fmt(c.mod.typeSynergy, { pct: pct(f) });
        case 'historia':
            return fmt(c.mod.storySynergy, { pct: pct(f) });
        case 'posicao':
            return fmt(c.mod.offPosition, { pct: pct(f) });
        default:
            return m.label;
    }
}

/** Linha de golpe fortalecido/travado no idioma do jogo. */
export function moveModLabel(m: MoveModifier, lang: Lang = current): string {
    if (lang === 'pt' || !m.ref) return m.label;
    const c = DICTS[lang].common;
    if (m.factor === 0) return c.mod.choiceLocked;
    const name = ITEMS[m.ref] ? itemName(m.ref) : abilityName(m.ref);
    return fmt(c.mod.moveBoost, { name, n: Math.round((m.factor - 1) * 100) });
}
