import { MOVES } from '../engine/data';
import {
    BOOST_TO_ATTR,
    DRAIN,
    DRAWBACK,
    moveProfile,
    OHKO,
    SECONDARY_PICK,
    STATUS_DURATION,
    selfBoostsOf,
    MOVE_TUNING as T,
} from '../engine/moves';
import type { Lang } from './lang';

/**
 * Texto do golpe gerado pelos números do motor (status, reforço, cura, preço, nocaute, secundário), para os golpes
 * sem explicação própria (MOVE_EXPLAIN). Se um número mudar no motor, o texto muda junto. Golpe sem nada além do
 * chute/rajada comum: undefined (a tela usa o texto do tipo de golpe).
 */
const L = {
    pt: {
        attr: {
            pace: 'velocidade',
            dribble: 'drible',
            shooting: 'chute',
            passing: 'passe',
            tackling: 'desarme',
            strength: 'força',
            positioning: 'leitura',
        } as Record<string, string>,
        and: ' e ',
        status: {
            par: 'Paralisa o rival mais perto: fica lento por {t} s.',
            slp: 'Faz o rival mais perto dormir: fica parado {t} s.',
            psn: 'Envenena o rival mais perto: o fôlego escorre por {t} s.',
            confusion: 'Confunde o rival mais perto: corre torto e erra passe por {t} s.',
        } as Record<string, string>,
        groundImmune: ' Terra é imune.',
        grassImmune: ' Planta é imune.',
        acc: ' Acerta {n}%.',
        buff: (attrs: string, many: boolean, pct: number, t: number) =>
            `Reforço: ${attrs} ${many ? 'sobem' : 'sobe'} ${pct}% por ${t} s.`,
        rest: 'Dorme {t} s e acorda com o fôlego cheio.',
        heal: 'Recupera {n}% do fôlego.',
        ohko: 'Nocaute: acerta {n}%. O carrinho que acerta deixa o rival {t} s no chão.',
        faint: 'Explode: derruba e empurra todo mundo a {r} m, até companheiro. Quem usou fica {t} s no chão, sem fôlego. Com a bola, o chute sai junto.',
        recoil: ' Quem usa perde {n}% do fôlego.',
        crash: ' Se errar, cai e perde {n}% do fôlego.',
        rampage: ' Depois, {n}% de chance de ficar confuso por {t} s.',
        drain: ' Suga o fôlego do alvo.',
        sec: {
            brn: ' Pode queimar.',
            frz: ' Pode congelar.',
            par: ' Pode paralisar.',
            psn: ' Pode envenenar.',
            tox: ' Pode envenenar.',
            confusion: ' Pode confundir.',
            flinch: ' Pode fazer o rival hesitar.',
        } as Record<string, string>,
        pick: ' Pode queimar, congelar ou paralisar.',
        lower: ' Pode baixar {attrs} do rival.',
    },
    en: {
        attr: {
            pace: 'Pace',
            dribble: 'Dribbling',
            shooting: 'Shooting',
            passing: 'Passing',
            tackling: 'Defending',
            strength: 'Physical',
            positioning: 'Positioning',
        } as Record<string, string>,
        and: ' and ',
        status: {
            par: 'Paralyzes the nearest rival: it slows down for {t} s.',
            slp: 'Puts the nearest rival to sleep: it stands still for {t} s.',
            psn: 'Poisons the nearest rival: its stamina drains for {t} s.',
            confusion: 'Confuses the nearest rival: it runs wobbly and misplaces passes for {t} s.',
        } as Record<string, string>,
        groundImmune: ' Ground types are immune.',
        grassImmune: ' Grass types are immune.',
        acc: ' {n}% accuracy.',
        buff: (attrs: string, _many: boolean, pct: number, t: number) => `Boost: ${attrs} +${pct}% for ${t} s.`,
        rest: 'Sleeps for {t} s and wakes up with full stamina.',
        heal: 'Restores {n}% of its stamina.',
        ohko: 'One-hit KO: {n}% accuracy. A slide tackle that lands leaves the rival on the ground for {t} s.',
        faint: 'Explodes: knocks down and pushes everyone within {r} m, teammates too. The user stays down for {t} s, out of stamina. With the ball, the shot goes off too.',
        recoil: ' The user loses {n}% of its stamina.',
        crash: ' If it misses, it falls and loses {n}% of its stamina.',
        rampage: ' Afterwards, {n}% chance of becoming confused for {t} s.',
        drain: ' Drains the target’s stamina.',
        sec: {
            brn: ' May burn.',
            frz: ' May freeze.',
            par: ' May paralyze.',
            psn: ' May poison.',
            tox: ' May poison.',
            confusion: ' May confuse.',
            flinch: ' May make the rival flinch.',
        } as Record<string, string>,
        pick: ' May burn, freeze or paralyze.',
        lower: " May lower the rival's {attrs}.",
    },
};

const num = (n: number, lang: Lang) => (lang === 'pt' ? String(n).replace('.', ',') : String(n));
const pct = (f: number) => Math.round(f * 100);
const fill = (s: string, v: Record<string, string | number>, lang: Lang) =>
    s.replace(/\{(\w+)\}/g, (_, k) => (typeof v[k] === 'number' ? num(v[k] as number, lang) : String(v[k])));

function attrList(boosts: Partial<Record<string, number>>, lang: Lang): string[] {
    const out: string[] = [];
    for (const stat of Object.keys(boosts))
        for (const a of BOOST_TO_ATTR[stat] ?? []) if (!out.includes(a)) out.push(a);
    return out.map((a) => L[lang].attr[a] ?? a);
}
const joinList = (xs: string[], lang: Lang) =>
    xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')}${L[lang].and}${xs[xs.length - 1]}`;

/** O texto gerado do golpe, ou undefined quando o texto do tipo de golpe já diz tudo. `kindText`: esse texto. */
export function generatedMoveText(id: string, lang: Lang, kindText: string): string | undefined {
    const d = MOVES[id];
    if (!d) return undefined;
    const p = moveProfile(id);
    const t = L[lang];
    if (p.kind === 'status' && p.status) {
        let s = fill(t.status[p.status] ?? '', { t: STATUS_DURATION[p.status] }, lang);
        if (d.type === 'Electric' && p.status === 'par') s += t.groundImmune;
        if (id.endsWith('powder') || id === 'spore') s += t.grassImmune;
        if (d.accuracy < 100) s += fill(t.acc, { n: d.accuracy }, lang);
        return s;
    }
    if (p.kind === 'buff') {
        const boosts = selfBoostsOf(id);
        const attrs = attrList(boosts, lang);
        if (!attrs.length) return undefined;
        const stages = Math.max(1, ...Object.values(boosts).map((b) => b ?? 1));
        return t.buff(joinList(attrs, lang), attrs.length > 1, pct(T.buffStep * stages), T.buffTime);
    }
    if (p.kind === 'heal') {
        if (id === 'rest') return fill(t.rest, { t: STATUS_DURATION.slp }, lang);
        return fill(t.heal, { n: pct(T.healBase + T.healPower * p.strength) }, lang);
    }
    if (p.kind !== 'strike' && p.kind !== 'blast') return undefined;
    if (OHKO.has(id)) return fill(t.ohko, { n: d.accuracy, t: T.ohkoStun }, lang);
    if (DRAWBACK[id] === 'faint') return fill(t.faint, { r: T.blastRadius[id] ?? 3, t: T.faintStun }, lang);
    let extra = '';
    if (DRAWBACK[id] === 'recoil') extra += fill(t.recoil, { n: pct(T.recoilEnergy) }, lang);
    if (DRAWBACK[id] === 'crash') extra += fill(t.crash, { n: pct(T.crashEnergy) }, lang);
    if (DRAWBACK[id] === 'rampage')
        extra += fill(t.rampage, { n: pct(T.rampageChance), t: STATUS_DURATION.confusion }, lang);
    if (DRAIN[id]) extra += t.drain;
    const sec = d.secondary;
    if (SECONDARY_PICK[id]) extra += t.pick;
    else if (sec?.status && t.sec[sec.status]) extra += t.sec[sec.status];
    else if (sec?.volatile && t.sec[sec.volatile]) extra += t.sec[sec.volatile];
    else if (sec?.boosts) extra += fill(t.lower, { attrs: joinList(attrList(sec.boosts, lang), lang) }, lang);
    return extra ? `${kindText}.${extra}` : undefined;
}
