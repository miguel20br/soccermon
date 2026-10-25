import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { GROUP_START, regionOfRow } from '../../engine/cup-map';
import { useT } from '../../i18n/react';
import { resumeScreenOf, useGame } from '../../store/game-store';
import { currentNode, isLong } from '../../store/long-cup';
import { KANTO_BADGES } from '../../store/missions';
import { KantoBadge } from '../components/BadgeCase';
import { HudIcon } from '../components/MatchHud';
import { reduceMotionOn } from '../settings-sync';
import { FieldSprite } from './FieldSprite';

/**
 * Kanto em pixel art, no traço do mapa da cidade do FireRed (26 x 18 casas): `~` mar, `.` grama, `,` grama escura,
 * `^` montanha, `T` floresta. Desenho nosso, simplificado (as rotas são as que importam pra copa).
 */
const KANTO = [
    '~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~^^^.,......~~~~.,...~~~~',
    '~^^^^.....^^^.~~.......~~~',
    '~^^^^....^^^^^.........~~~',
    '~^^^^....^^^^.......^^.~~~',
    '~^^^^TTT.............^^.~~',
    '~^^^.TTT...,,........^^.~~',
    '~^^^.TTT...,,..........~~~',
    '~^^^...................~~~',
    '~~.....................~~~',
    '~~.......,,............~~~',
    '~~~......,,............~~~',
    '~~~~....................~~',
    '~~~~~........~~~~.......~~',
    '~~~~~~~~~~.............~~~',
    '~~~~~~~~~~~.......~~~~~~~~',
    '~~~~~...~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~',
];
const W = KANTO[0].length;
const H = KANTO.length;
const LAND_FILL: Record<string, string> = { '.': '#6fbf5a', ',': '#5aa84c', '^': '#94704c', T: '#2f7a3f' };
const isSea = (x: number, y: number) => (KANTO[y]?.[x] ?? '~') === '~';

type P = [number, number];
/** Cidades (canto da casa) e o líder do ginásio de cada uma. */
const CITIES: { id: string; at: P; gym?: (typeof KANTO_BADGES)[number] }[] = [
    { id: 'pallet', at: [6, 13] },
    { id: 'viridian', at: [6, 9], gym: 'giovanni' },
    { id: 'pewter', at: [6, 4], gym: 'brock' },
    { id: 'cerulean', at: [15, 4], gym: 'misty' },
    { id: 'saffron', at: [15, 8], gym: 'sabrina' },
    { id: 'celadon', at: [11, 8], gym: 'erika' },
    { id: 'lavender', at: [20, 8] },
    { id: 'vermilion', at: [15, 12], gym: 'ltsurge' },
    { id: 'fuchsia', at: [12, 15], gym: 'koga' },
    { id: 'cinnabar', at: [6, 16], gym: 'blaine' },
];
/** Estradas (centro das casas). As de mar ficam tracejadas. */
const ROADS: P[][] = [
    [
        [6, 13],
        [6, 4],
        [15, 4],
        [15, 12],
        [20, 12],
        [20, 4],
        [15, 4],
    ],
    [
        [6, 9],
        [2, 9],
        [2, 2],
    ],
    [
        [6, 8],
        [20, 8],
        [20, 14],
        [12, 14],
        [12, 15],
    ],
    [
        [8, 8],
        [8, 14],
        [12, 14],
    ],
];
const SEA_ROADS: P[][] = [
    [
        [6, 13],
        [6, 16],
        [12, 16],
        [12, 15],
    ],
];

/** O caminho da Rota Índigo no mapa e onde fica cada parada (índice do ponto). */
const TRAIL: P[] = [
    [6, 13],
    [6, 11],
    [6, 9],
    [6, 6],
    [6, 4],
    [10.5, 4],
    [15, 4],
    [15, 8],
    [11, 8],
    [6, 8],
    [6, 9],
    [2, 9],
    [2, 6],
    [2, 2],
];
const STOPS = ['start', 'rota1', 'floresta', 'mtmoon', 'cerulean', 'vitoria', 'planalto'] as const;
type Stop = (typeof STOPS)[number];
const STOP_AT: Record<Stop, number> = {
    start: 0,
    rota1: 1,
    floresta: 3,
    mtmoon: 5,
    cerulean: 6,
    vitoria: 12,
    planalto: 13,
};
/** Quem fala em cada parada (sprite em assets/trainers), o mesmo da história do mapa da copa. */
const WHO: Record<Stop, string> = {
    start: 'oak',
    rota1: 'oak',
    floresta: 'blue',
    mtmoon: 'brock',
    cerulean: 'misty',
    vitoria: 'blue',
    planalto: 'lance',
};

const c = (p: P): P => [p[0] + 0.5, p[1] + 0.5];
const seg = (a: P, b: P) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const ARC: number[] = [0];
for (let i = 1; i < TRAIL.length; i++) ARC.push(ARC[i - 1] + seg(TRAIL[i - 1], TRAIL[i]));
/** Ponto e direção (PMD: 0 frente, 2 direita, 4 costas, 6 esquerda) a `s` casas do começo do caminho. */
function along(s: number): { p: P; dir: number } {
    const k = Math.max(0, Math.min(s, ARC[ARC.length - 1]));
    let i = 1;
    while (i < ARC.length - 1 && ARC[i] < k) i++;
    const [a, b] = [TRAIL[i - 1], TRAIL[i]];
    const f = (k - ARC[i - 1]) / Math.max(1e-6, ARC[i] - ARC[i - 1]);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 6) : dy > 0 ? 0 : 4;
    return { p: c([a[0] + dx * f, a[1] + dy * f]), dir };
}
const pct = (p: P): CSSProperties => ({ left: `${(p[0] / W) * 100}%`, top: `${(p[1] / H) * 100}%` });
const pts = (line: P[]) => line.map((p) => c(p).join(',')).join(' ');

/** Onde o time parou: a região da casa atual do mapa, o Planalto na fase de grupos, ou Pallet sem Rota aberta. */
function stopOf(run: ReturnType<typeof useGame.getState>['run']): Stop {
    if (!run || !isLong(run) || ['eliminated', 'champion'].includes(run.status)) return 'start';
    if (run.stage >= GROUP_START) return 'planalto';
    const node = currentNode(run);
    return node ? regionOfRow(node.row).id : 'start';
}

/** O chão do mapa: terra, beira-mar, montanha e floresta, uma casa por vez (o mar é o fundo da tela, animado). */
const Land = () => (
    <svg className="rt-land" viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges" aria-hidden>
        {KANTO.flatMap((row, y) =>
            [...row].flatMap((ch, x) => {
                const key = `${x}-${y}`;
                if (ch === '~') {
                    const shore = !isSea(x - 1, y) || !isSea(x + 1, y) || !isSea(x, y - 1) || !isSea(x, y + 1);
                    return shore ? [<rect key={key} x={x} y={y} width="1" height="1" className="rt-foam" />] : [];
                }
                const out = [<rect key={key} x={x} y={y} width="1" height="1" fill={LAND_FILL[ch]} />];
                if (ch === '^')
                    out.push(
                        <polygon
                            key={`${key}m`}
                            points={`${x + 0.1},${y + 0.9} ${x + 0.5},${y + 0.15} ${x + 0.9},${y + 0.9}`}
                            fill="#b89068"
                        />,
                        <polygon
                            key={`${key}s`}
                            points={`${x + 0.5},${y + 0.15} ${x + 0.9},${y + 0.9} ${x + 0.5},${y + 0.9}`}
                            fill="#7a5a3c"
                        />,
                    );
                if (ch === 'T')
                    out.push(
                        <rect key={`${key}t`} x={x + 0.2} y={y + 0.15} width="0.6" height="0.5" fill="#46a050" />,
                        <rect key={`${key}k`} x={x + 0.42} y={y + 0.65} width="0.16" height="0.25" fill="#5a3c22" />,
                    );
                if (isSea(x, y - 1))
                    out.push(<rect key={`${key}n`} x={x} y={y} width="1" height="0.12" className="rt-coast" />);
                if (isSea(x, y + 1))
                    out.push(<rect key={`${key}b`} x={x} y={y + 0.88} width="1" height="0.12" className="rt-coast" />);
                if (isSea(x - 1, y))
                    out.push(<rect key={`${key}w`} x={x} y={y} width="0.12" height="1" className="rt-coast" />);
                if (isSea(x + 1, y))
                    out.push(<rect key={`${key}e`} x={x + 0.88} y={y} width="0.12" height="1" className="rt-coast" />);
                return out;
            }),
        )}
        {ROADS.map((r) => (
            <polyline key={pts(r)} points={pts(r)} className="rt-road" />
        ))}
        {SEA_ROADS.map((r) => (
            <polyline key={pts(r)} points={pts(r)} className="rt-road sea" />
        ))}
    </svg>
);

/**
 * Rota Índigo: o mapa de Kanto com as 8 insígnias nas cidades dos ginásios (acesas as que você já tem), o caminho da
 * Rota até o Planalto e o seu time parado onde a copa parou. Quando a aba aparece, o time anda da parada anterior
 * até a atual. Embaixo, quem fala naquele trecho e o botão de começar ou continuar.
 */
export function Rota({ active, enter }: { active: boolean; enter: (action: () => void) => void }) {
    const { t, d } = useT();
    const run = useGame((s) => s.run);
    const newRun = useGame((s) => s.newRun);
    const go = useGame((s) => s.go);
    const clubName = useGame((s) => s.profile.clubName || 'Pallet FC');
    const done = useGame((s) => s.profile.missionsDone);
    const avatar = useGame((s) => s.profile.avatar);
    const [confirm, setConfirm] = useState(false);
    const stop = stopOf(run);
    const longOn = stop !== 'start' || (!!run && isLong(run) && !['eliminated', 'champion'].includes(run.status));
    const otherCup = !!run && !isLong(run) && !['eliminated', 'champion'].includes(run.status);

    // o time: os 3 primeiros da escalação (o capitão na frente) na Rota aberta; senão o seu avatar sozinho em Pallet
    const team = useMemo(() => {
        if (longOn && run) {
            const byUid = new Map(run.picks.map((p) => [p.uid, p]));
            const cap = run.picks.find((p) => p.uid === run.captainUid);
            const rest = run.lineup.flatMap((u) => (u === run.captainUid ? [] : (byUid.get(u) ?? [])));
            return [cap, ...rest].flatMap((p) => (p ? [p.speciesId] : [])).slice(0, 3);
        }
        return [avatar.kind === 'pokemon' ? avatar.speciesId : 25];
    }, [longOn, run, avatar]);

    // a caminhada: na 1ª vez que a aba aparece, da parada anterior até a atual (reduzir movimento: já parado lá)
    const target = ARC[STOP_AT[stop]];
    const from = ARC[STOP_AT[STOPS[Math.max(0, STOPS.indexOf(stop) - 1)]]];
    const [s, setS] = useState(from);
    const [walking, setWalking] = useState(false);
    const walked = useRef(false);
    // sprite em 2x no mapa grande; no mapa pequeno (320 px, deitado estreito) em 1x, pra não cobrir as cidades
    const mapRef = useRef<HTMLDivElement>(null);
    const [big, setBig] = useState(true);
    useEffect(() => {
        const el = mapRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(() => setBig(el.clientWidth >= 340));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    useEffect(() => {
        if (!active || walked.current) return;
        walked.current = true;
        if (reduceMotionOn() || from === target) {
            setS(target);
            return;
        }
        const ms = Math.min(2600, Math.max(700, (target - from) * 170));
        const t0 = performance.now();
        let raf = 0;
        setWalking(true);
        const tick = (now: number) => {
            const k = Math.min(1, (now - t0) / ms);
            setS(from + (target - from) * k);
            if (k < 1) raf = requestAnimationFrame(tick);
            else setWalking(false);
        };
        // espera o deslize da aba terminar antes de sair andando
        const wait = window.setTimeout(() => (raf = requestAnimationFrame(tick)), 320);
        return () => {
            window.clearTimeout(wait);
            cancelAnimationFrame(raf);
        };
    }, [active, from, target]);

    const lead = along(s);
    const story = d.longCup.story[stop === 'start' ? 'rota1' : stop];
    const where = stop === 'start' ? '' : d.longCup.region[stop];
    const got = (id: string) => done.includes(id);
    const nBadges = KANTO_BADGES.filter(got).length;
    const begin = () => {
        if (otherCup && !confirm) {
            setConfirm(true);
            return;
        }
        enter(() => newRun(clubName, undefined, undefined, 'longa'));
    };

    return (
        <>
            <div className="amb-scene rt-scene" aria-hidden>
                <div className="amb-layer rt-sea" style={{ '--depth': 0.6 } as CSSProperties}>
                    <span className="rt-swim">
                        <FieldSprite id={131} anim="Walk" dir={2} scale={2} play={active} />
                    </span>
                </div>
            </div>
            <div className="amb-ui rt-ui">
                <header className="rt-head">
                    <h2>{t('home.longCup.title')}</h2>
                    <span className="rt-badges" title={t('profile.badges.title')}>
                        <KantoBadge leader="brock" earned={nBadges > 0} />
                        {t('profile.badges.count', { n: nBadges, total: KANTO_BADGES.length })}
                    </span>
                </header>
                <div
                    ref={mapRef}
                    className="rt-map amb-par"
                    style={
                        {
                            '--depth': 0.25,
                            '--fx': `${(lead.p[0] / W) * 100}%`,
                            '--fy': `${(lead.p[1] / H) * 100}%`,
                        } as CSSProperties
                    }
                >
                    <Land />
                    <svg className="rt-trail" viewBox={`0 0 ${W} ${H}`} aria-hidden>
                        <polyline points={pts(TRAIL)} className="rt-path" />
                        <polyline points={pts(TRAIL.slice(0, STOP_AT[stop] + 1))} className="rt-done" />
                        {stop !== 'planalto' && (
                            <polyline
                                points={pts(TRAIL.slice(STOP_AT[stop], STOP_AT[STOPS[STOPS.indexOf(stop) + 1]] + 1))}
                                className="rt-next"
                            />
                        )}
                    </svg>
                    {CITIES.map((city) => (
                        <i
                            key={city.id}
                            className={`rt-city${city.id === 'pallet' ? ' home' : ''}`}
                            style={pct(c(city.at))}
                        />
                    ))}
                    <i className="rt-plateau" style={pct(c([2, 2]))} />
                    {CITIES.flatMap((city) =>
                        city.gym ? (
                            <span
                                key={city.gym}
                                className={`rt-gym${got(city.gym) ? ' got' : ''}`}
                                style={pct([city.at[0] + 1.25, city.at[1] - 0.15])}
                                title={d.profile.badges.names[city.gym]}
                            >
                                <KantoBadge leader={city.gym} earned={got(city.gym)} />
                            </span>
                        ) : (
                            []
                        ),
                    )}
                    <i className="rt-cloud k1" />
                    <i className="rt-cloud k2" />
                    <i className="rt-cloud k3" />
                    {team.map((id, i) => {
                        const at = along(s - i * 2);
                        const still = !walking;
                        return (
                            <span
                                // biome-ignore lint/suspicious/noArrayIndexKey: a fila do time não muda de ordem
                                key={i}
                                className="rt-walker"
                                style={{ ...pct(at.p), zIndex: 10 + Math.round(at.p[1] * 2) - i }}
                            >
                                <FieldSprite
                                    id={id}
                                    anim={still ? 'Idle' : 'Walk'}
                                    dir={still ? 0 : at.dir}
                                    scale={big ? 2 : 1}
                                    play={active}
                                    className="rt-mon"
                                />
                            </span>
                        );
                    })}
                    {where && (
                        <span className="rt-here bc-tag" style={pct([lead.p[0], lead.p[1] - 3])}>
                            {where}
                        </span>
                    )}
                </div>
                <div className="rt-talk">
                    <span className="rt-talk-face">
                        <img className="pixel" src={`assets/trainers/${WHO[stop]}.png`} alt="" width="80" height="80" />
                    </span>
                    <p>
                        <b>{story.who}</b> {story.text}
                    </p>
                </div>
                {confirm ? (
                    <div className="confirm-new es-confirm bc-surface">
                        <p>{t('home.confirmNew', { team: run?.teamName ?? '' })}</p>
                        <div className="row" style={{ justifyContent: 'center' }}>
                            <button type="button" className="btn primary" onClick={begin}>
                                {t('home.confirmYes')}
                            </button>
                            <button type="button" className="btn ghost" onClick={() => setConfirm(false)}>
                                {t('common.ui.cancel')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        className="btn big cup-go rt-go primary"
                        onClick={longOn && run ? () => go(resumeScreenOf(run.status)) : begin}
                    >
                        <span className="cup-go-txt">
                            <b>
                                {longOn
                                    ? where
                                        ? t('home.amb.rotaGo', { where })
                                        : t('home.resume')
                                    : t('home.longCup.go')}
                            </b>
                            <small>{t('home.longCup.tag')}</small>
                        </span>
                        <HudIcon kind="next" />
                    </button>
                )}
            </div>
        </>
    );
}
