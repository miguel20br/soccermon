import { type CSSProperties, useMemo, useState } from 'react';
import { AGENCY, MAX_FX_PIECES } from '../../engine/agency';
import { SPECIES, SPECIES_BY_ID } from '../../engine/data';
import { defaultMoveset } from '../../engine/moves';
import { MAX_SIGNATURE } from '../../engine/signature-moves';
import { type Dict, dict, fmt, type Lang, pct, typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { HudIcon } from '../components/MatchHud';
import { TypeIcon } from '../components/TypeIcon';
import { maxFillText, maxFxText, maxLevelText, maxPlan, maxTimingText } from '../max-levels';
import { TYPE_COLOR } from '../type-colors';
import { GdxIcon } from './GdxIcon';

/**
 * Golpedex › Especiais e Bicudas (pedido do Miguel, 09/11/2026): o golpe máximo do capitão (N1, N2, N3, por tipo e as
 * assinaturas) e a bicuda do goleiro capitão (N1 a N3, o counter, o duelo N3 x N3 e a espalmada). Textos de nível são os
 * da carta e da Ajuda (`max-levels.ts`); os números saem do `AGENCY` do motor. O save não guarda quais especiais saíram
 * em campo, então tudo aparece aberto. A prévia é CSS (sem Phaser): a carga com os anéis do tipo (1, 2 e 4 como no
 * `chargeFx` de max-show.ts), a bola e o estouro na chegada.
 */
export type MaxSection = 'especiais' | 'bicudas';

interface Entry {
    id: string;
    num: string;
    title: string;
    sub: string;
    type: string;
    sprite: number;
    /** Quem chuta no goleiro (bicudas): a bola chega antes da carga. */
    rival?: number;
    level: 1 | 2 | 3;
    gk?: boolean;
    /** Ícone da célula: o selo do tipo ou o sprite (assinatura). */
    mark: 'type' | 'sprite' | 'max' | 'bicuda';
    text: string;
    facts: [string, string][];
}

const LEVELS = [1, 2, 3] as const;
/** Goleiro e atacante das prévias da bicuda: só arte. */
const GK_ART = 143;
const SHOOTER_ART = 6;
const ART_BY_LEVEL = { 1: 25, 2: 68, 3: 150 } as const;

/** Cor do tipo; sem tipo (os níveis em geral, as bicudas), o dourado do golpe máximo. */
const tc = (type: string) => TYPE_COLOR[type] ?? 'var(--yellow)';
const dec = (n: number, lang: Lang) => n.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US');

/** Um Pokémon do tipo (o 1º tipo dele, senão qualquer um) pra prévia. */
function artFor(type: string): number {
    return (SPECIES.find((s) => s.types[0] === type) ?? SPECIES.find((s) => s.types.includes(type)) ?? SPECIES[24]).id;
}

function especiais(lang: Lang, d: Dict): { title: string; note?: string; rows: Entry[] }[] {
    const M = d.stats.lab.mx;
    const lv = d.match.agency.levels;
    const shot = AGENCY.maxLevelShot;
    const levelFacts = (n: 1 | 2 | 3): [string, string][] => {
        const s = shot[n];
        const out: [string, string][] = [
            [M.power, pct(s.power)],
            [M.bar, fmt(M.barValue, { n: n * AGENCY.maxLevelPts })],
        ];
        if (n >= 2) out.push([M.knock, fmt(M.knockValue, { r: dec(AGENCY.knockR, lang), s: AGENCY.knockStun })]);
        if (n === 3) {
            out.push(
                [M.aim, fmt(M.aimValue, { n: dec(AGENCY.maxPost, lang) })],
                [M.reach, fmt(M.reachValue, { n: Math.round(s.rivalReach * 100) })],
                [M.saveBlock, fmt(M.saveBlockValue, { n: dec(s.save, lang) })],
            );
        }
        out.push([M.when, M.whenValue], [M.who, lv.who]);
        return out;
    };
    const levels: Entry[] = LEVELS.map((n) => ({
        id: `lv${n}`,
        num: fmt(d.match.agency.maxLevelShort, { n }),
        title: fmt(d.match.agency.maxLevel, { n }),
        sub: fmt(M.levelSub, { pw: pct(shot[n].power) }),
        type: '',
        sprite: ART_BY_LEVEL[n],
        level: n,
        mark: 'max',
        text: fmt(d.help.gen.maxRow[n - 1], { pw: pct(shot[n].power) }).replace(/^./, (c) => c.toUpperCase()),
        facts: levelFacts(n),
    }));
    const rowsOf = (plan: ReturnType<typeof maxPlan>): [string, string][] =>
        LEVELS.map((n) => [fmt(d.match.agency.maxLevelShort, { n }), maxLevelText(plan, n, lang)]);
    const types: Entry[] = Object.keys(MAX_FX_PIECES).map((type) => {
        const plan = { move: null, type, fx: type, gk: false };
        return {
            id: `t-${type}`,
            num: typeName(type, lang),
            title: maxFxText(type, lang).name,
            sub: '',
            type,
            sprite: artFor(type),
            level: 3,
            mark: 'type',
            text: lv.stack,
            facts: [...rowsOf(plan), [M.users, fmt(M.usersValue, { t: typeName(type, lang) })]],
        };
    });
    const sigs: Entry[] = Object.entries(MAX_SIGNATURE).map(([id, fx]) => {
        const sp = SPECIES_BY_ID.get(Number(id));
        const plan = maxPlan(sp ? defaultMoveset(sp) : [], Number(id), false);
        return {
            id: `s-${fx}`,
            num: `#${String(id).padStart(3, '0')}`,
            title: maxFxText(fx, lang).name,
            sub: fmt(M.sigSub, { name: sp?.name ?? '' }),
            type: plan.type,
            sprite: Number(id),
            level: 3,
            mark: 'sprite',
            text: lv.stack,
            facts: rowsOf(plan),
        };
    });
    return [
        { title: M.levelsTitle, rows: levels },
        { title: M.typesTitle, note: M.typesNote, rows: types },
        { title: M.sigTitle, note: fmt(M.sigNote, { n: sigs.length }), rows: sigs },
    ];
}

function bicudas(lang: Lang, d: Dict): { title: string; note?: string; rows: Entry[] }[] {
    const B = d.stats.lab.bc;
    const M = d.stats.lab.mx;
    const gkRow = d.match.agency.levels.gkRow;
    const pass: [string, string] = [B.pass, fmt(B.passValue, { n: dec(1.3, lang) })];
    const armed: [string, string] = [B.armed, B.armedValue];
    const knock: [string, string] = [M.knock, fmt(M.knockValue, { r: dec(AGENCY.knockR, lang), s: AGENCY.knockStun })];
    const save: [string, string] = [B.save, B.saveValue];
    const base = { type: '', sprite: GK_ART, rival: SHOOTER_ART, gk: true, mark: 'bicuda' as const };
    const lvNum = (n: number) => fmt(d.match.agency.maxLevelShort, { n });
    const levels: Entry[] = [
        {
            ...base,
            id: 'b1',
            num: lvNum(1),
            title: fmt(B.levelTitle, { n: 1 }),
            sub: B.passSub,
            level: 1,
            text: gkRow[0],
            facts: [pass, save, armed],
        },
        {
            ...base,
            id: 'b2',
            num: lvNum(2),
            title: fmt(B.levelTitle, { n: 2 }),
            sub: B.knockSub,
            level: 2,
            text: `${gkRow[0]} ${gkRow[1]}`,
            facts: [pass, knock, save, armed],
        },
        {
            ...base,
            id: 'b3',
            num: lvNum(3),
            title: fmt(B.levelTitle, { n: 3 }),
            sub: B.goalSub,
            level: 3,
            text: B.n3,
            facts: [
                [M.power, pct(AGENCY.maxLevelShot[3].power)],
                [M.aim, fmt(M.aimValue, { n: dec(AGENCY.maxPost, lang) })],
                knock,
                [B.rivalGk, B.rivalGkValue],
                save,
                armed,
            ],
        },
    ];
    const P = AGENCY.maxParry;
    const S = AGENCY.showdown;
    const short = Object.entries(MAX_FX_PIECES)
        .filter(([, p]) => p.includes('shortParry'))
        .map(([t]) => typeName(t, lang));
    const more: Entry[] = [
        {
            ...base,
            id: 'counter',
            num: B.counterSub,
            title: B.counter,
            sub: `${lvNum(1)} · ${lvNum(2)} · ${lvNum(3)}`,
            level: 2,
            text: B.counterText,
            facts: [pass, [lvNum(3), B.goalSub], save],
        },
        {
            ...base,
            id: 'duel',
            num: B.duelSub,
            title: B.duel,
            sub: '',
            rival: 150,
            level: 3,
            text: B.duelText,
            facts: [
                [B.stop, fmt(B.stopValue, { s: dec(S.seconds, lang) })],
                [B.ball, fmt(B.ballValue, { v: S.speed })],
                [B.party, fmt(B.partyValue, { s: S.goal })],
                [B.offTouch, B.offTouchValue],
            ],
        },
        {
            ...base,
            id: 'parry',
            num: B.parrySub,
            title: B.parry,
            sub: `${lvNum(1)} · ${lvNum(2)} · ${lvNum(3)}`,
            level: 1,
            mark: 'max',
            text: B.parryText,
            facts: [
                [B.post, fmt(B.postValue, { n: Math.round(P.post * 100) })],
                [B.down, fmt(B.downValue, { s: P.gkLock })],
                [B.short, fmt(B.shortValue, { types: short.join(', ') })],
            ],
        },
    ];
    return [
        { title: B.listTitle, rows: levels },
        { title: B.moreTitle, rows: more },
    ];
}

/** Prévia em CSS: carga com os anéis do tipo, a bola saindo e o estouro na chegada (bicuda: a bola chega antes). */
function Preview({ e, run }: { e: Entry; run: number }) {
    const { d } = useT();
    const rings = e.level === 1 ? 1 : e.level === 2 ? 2 : 4;
    return (
        <div
            key={`${e.id}-${run}`}
            className={`mxd-stage lv${e.level}${e.gk ? ' gk' : ''}`}
            style={{ '--tc': tc(e.type) } as CSSProperties}
            role="img"
            aria-label={d.stats.lab.mx.previewAria}
        >
            <i className="mxd-goal" />
            {e.gk && e.rival && (
                <img className="pixel mxd-rival" src={`assets/cards/${e.rival}.gif`} alt="" width={56} height={56} />
            )}
            <span className="mxd-mon">
                {Array.from({ length: rings }, (_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: anéis fixos, só a ordem muda o atraso
                    <i key={i} className="mxd-ring" style={{ '--i': i } as CSSProperties} />
                ))}
                <img className="pixel" src={`assets/cards/${e.sprite}.gif`} alt="" width={72} height={72} />
            </span>
            {e.gk && <i className="mxd-in" />}
            <i className="mxd-ball" />
            <i className="mxd-hit" />
            {e.type && (
                <span className="mxd-seal">
                    <TypeIcon type={e.type} size={24} />
                </span>
            )}
            <b className="mxd-lv">{fmt(d.match.agency.maxLevelShort, { n: e.level })}</b>
        </div>
    );
}

export function MaxDex({ section }: { section: MaxSection }) {
    const { d, lang } = useT();
    const L = d.stats.lab;
    const groups = useMemo(() => (section === 'especiais' ? especiais(lang, d) : bicudas(lang, d)), [section, lang, d]);
    const all = groups.flatMap((g) => g.rows);
    const [current, setCurrent] = useState(all[0].id);
    const [sheet, setSheet] = useState(false);
    const [run, setRun] = useState(0);
    const e = all.find((r) => r.id === current) ?? all[0];
    const select = (r: Entry) => {
        setCurrent(r.id);
        setRun((n) => n + 1);
        setSheet(true);
    };

    return (
        <>
            <section className="panel gdx-progress mxd-intro">
                {section === 'especiais' ? (
                    <>
                        <p>
                            <b>{L.mx.intro}</b> {d.match.agency.levels.who}
                        </p>
                        <p className="muted gdx-note">{maxFillText(lang)}</p>
                        <p className="muted gdx-note">{maxTimingText(lang)}</p>
                    </>
                ) : (
                    <>
                        <p>
                            <b>{L.bc.intro}</b>
                        </p>
                        <p className="muted gdx-note">{L.bc.when}</p>
                        <p className="muted gdx-note">{maxTimingText(lang)}</p>
                    </>
                )}
            </section>

            <div className="gdx-layout">
                <button
                    type="button"
                    className={`gdx-backdrop${sheet ? ' open' : ''}`}
                    aria-label={d.common.ui.close}
                    tabIndex={-1}
                    onClick={() => setSheet(false)}
                />
                <aside className={`panel gdx-detail${sheet ? ' open' : ''}`} aria-label={L.mx.detailAria}>
                    <button
                        type="button"
                        className="btn ghost small gdx-close"
                        onClick={() => setSheet(false)}
                        aria-label={d.common.ui.close}
                    >
                        <GdxIcon kind="close" size={14} />
                    </button>
                    <Preview e={e} run={run} />
                    <div className="ml-info" key={e.id}>
                        <div className="ml-title">
                            {e.type ? (
                                <TypeIcon type={e.type} size={26} />
                            ) : (
                                <HudIcon kind={e.gk ? 'bicuda' : 'max'} className="mxd-title-icon" />
                            )}
                            <h2 style={{ color: tc(e.type) }}>{e.title}</h2>
                            {!e.title.includes(e.num) && <span className="ml-chip">{e.num}</span>}
                        </div>
                        {e.sub && <p className="gdx-seen">{e.sub}</p>}
                        <div className="gdx-controls">
                            <button type="button" className="btn small primary" onClick={() => setRun((n) => n + 1)}>
                                <GdxIcon kind="play" size={12} /> {L.replay}
                            </button>
                        </div>
                        <p className="mxd-text">{e.text}</p>
                        <dl className="ml-facts">
                            {e.facts.map(([k, v]) => (
                                <div key={k} className="mxd-fact">
                                    <dt>{k}</dt>
                                    <dd>{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </aside>

                <section className="panel gdx-browse">
                    {groups.map((g) => (
                        <div key={g.title} className="mxd-group">
                            <h3 className="bc-lbl">{g.title}</h3>
                            {g.note && <p className="muted gdx-note">{g.note}</p>}
                            <ul className="gdx-grid">
                                {g.rows.map((r) => (
                                    <li key={r.id}>
                                        <button
                                            type="button"
                                            className={`gdx-cell mxd-cell${r.id === e.id ? ' current' : ''}`}
                                            style={{ '--tc': tc(r.type) } as CSSProperties}
                                            onClick={() => select(r)}
                                        >
                                            <span className="gdx-num">{r.num}</span>
                                            {r.mark === 'type' ? (
                                                <TypeIcon type={r.type} size={20} />
                                            ) : r.mark === 'sprite' ? (
                                                <img
                                                    className="pixel mxd-mini"
                                                    src={`assets/cards/${r.sprite}.gif`}
                                                    alt=""
                                                    width={28}
                                                    height={28}
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <HudIcon kind={r.mark} className="mxd-icon" />
                                            )}
                                            <span className="gdx-name">
                                                {r.title}
                                                {r.sub && <small>{r.sub}</small>}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </section>
            </div>
        </>
    );
}

/** As entradas de cada parte, com os números do motor nos textos (testes). */
export const maxDexEntries = (section: MaxSection, lang: Lang) =>
    (section === 'especiais' ? especiais(lang, dict(lang)) : bicudas(lang, dict(lang))).flatMap((g) => g.rows);
