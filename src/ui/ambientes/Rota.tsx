import { type CSSProperties, memo, type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { GROUP_START, regionOfRow } from '../../engine/cup-map';
import { useT } from '../../i18n/react';
import { resumeScreenOf, useGame } from '../../store/game-store';
import { currentNode, isLong } from '../../store/long-cup';
import { KANTO_BADGES } from '../../store/missions';
import { KantoBadge } from '../components/BadgeCase';
import { HudIcon } from '../components/MatchHud';
import { ConfirmSheet } from '../kit/Sheet';
import { reduceMotionOn } from '../settings-sync';
import { uiZoom } from '../ui-zoom';
import { ClockCtx, useSceneClock } from './clock';
import { FieldSprite } from './FieldSprite';
import { avatarMon, routeTeam } from './metas';
import { useTalkOnce } from './Room';
import { type Blockers, type Threats, useWild, WildZone, type ZoneDef } from './WildZone';
import type { Pt, Wild } from './wild';

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
/** O pedaço do desenho que aparece: sem a borda de mar de fora (o mapa ocupa mais a tela). */
const X0 = 1;
const Y0 = 1;
const W = KANTO[0].length - 2;
const H = KANTO.length - 2;
const VIEWBOX = `${X0} ${Y0} ${W} ${H}`;
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
const pct = (p: P): CSSProperties => ({ left: `${((p[0] - X0) / W) * 100}%`, top: `${((p[1] - Y0) / H) * 100}%` });
/** Casa do desenho num ponto de 0 a 1 do mapa visível (as zonas dos Pokémon ambiente). */
const tileAt = (x: number, y: number) => KANTO[Math.floor(Y0 + y * H)]?.[Math.floor(X0 + x * W)] ?? '~';
/** Ponto do caminho (casas) em 0 a 1 do mapa visível. */
const norm = (p: P): Pt => ({ x: (p[0] - X0) / W, y: (p[1] - Y0) / H });
const pts = (line: P[]) => line.map((p) => c(p).join(',')).join(' ');

/** Onde o time parou: a região da casa atual do mapa, o Planalto na fase de grupos, ou Pallet sem Rota aberta. */
function stopOf(run: ReturnType<typeof useGame.getState>['run']): Stop {
    if (!run || !isLong(run) || ['eliminated', 'champion'].includes(run.status)) return 'start';
    if (run.stage >= GROUP_START) return 'planalto';
    const node = currentNode(run);
    return node ? regionOfRow(node.row).id : 'start';
}

/** O chão do mapa: terra, beira-mar, montanha e floresta, uma casa por vez (o mar é o fundo da tela, animado). */
const Land = memo(() => (
    <svg className="rt-land" viewBox={VIEWBOX} shapeRendering="crispEdges" aria-hidden>
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
));

/** Andando em casas do mapa por segundo, convertido pra alturas do mapa visível. */
const tiles = (n: number) => n / H;
/** z-index pela linha do pé, igual ao do time (quem está mais embaixo passa na frente). */
const zRow = (y: number) => 10 + Math.round((Y0 + y * H) * 2);
const zonesOf = (scale: number): Record<string, ZoneDef> => ({
    grass: { ok: (x, y) => ['.', ','].includes(tileAt(x, y)), speed: tiles(1.3), scale, z: zRow },
    water: { ok: (x, y) => tileAt(x, y) === '~', speed: tiles(0.8), scale, z: zRow },
    // no céu: por cima das nuvens (z 60), embaixo da plaquinha de onde o time está (z 65)
    sky: { ok: () => true, speed: tiles(2.6), fly: true, scale, z: () => 62 },
});
/**
 * Na Rota, a UI é o que fica por cima do mapa (título, fala, botão, a plaquinha de onde o time está); as cidades e
 * as insígnias, quem anda contorna (quem voa passa por cima).
 */
const ROUTE: Blockers = {
    ui: '.rt-head, .rt-talk, .rt-go, .rt-here',
    props: '.rt-gym, .rt-city, .rt-plateau',
};
/** Quem atravessa o mar de fundo, devagar (um por abertura). */
const SWIMMERS = [131, 130, 87, 73, 117, 72];
/** Altura da faixa de mar livre que o nadador precisa (px, sprite 2x com folga). */
const LANE = 64;

/**
 * Onde o nadador do fundo passa: no meio da maior faixa de mar aberto entre o título, o mapa, a fala e o botão (de
 * ponta a ponta da tela), pra não sair de trás de um deles pela metade. `null` = nenhuma faixa cabe (some).
 */
function useSwimLane(ui: RefObject<HTMLDivElement | null>, again: unknown): number | null {
    const [lane, setLane] = useState<number | null>(null);
    // biome-ignore lint/correctness/useExhaustiveDependencies: `again` muda o que está na tela (a confirmação no lugar do botão)
    useEffect(() => {
        const el = ui.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const find = () => {
            const box = el.getBoundingClientRect();
            const spans = [...el.children, ...document.querySelectorAll('.amb-top > *')]
                .map((e) => e.getBoundingClientRect())
                .filter((r) => r.height > 0)
                .map((r) => [r.top - box.top, r.bottom - box.top] as const)
                .sort((a, b) => a[0] - b[0]);
            let best: number | null = null;
            let gap = LANE - 1;
            let end = 0;
            for (const [top, bottom] of [...spans, [box.height, box.height] as const]) {
                if (top - end > gap) {
                    gap = top - end;
                    best = (top + end) / 2;
                }
                end = Math.max(end, bottom);
            }
            // medido em px da tela; o `top` é px do CSS (zoom da tela grande)
            setLane(best === null ? null : best / uiZoom());
        };
        find();
        const ro = new ResizeObserver(find);
        ro.observe(el);
        return () => ro.disconnect();
    }, [ui, again]);
    return lane;
}

/**
 * Rota Índigo: o mapa de Kanto com as 8 insígnias nas cidades dos ginásios (acesas as que você já tem), o caminho da
 * Rota até o Planalto e o seu time parado onde a copa parou. Quando a aba aparece, o time anda da parada anterior
 * até a atual. Embaixo, quem fala naquele trecho e o botão de começar ou continuar.
 */
export function Rota({
    active,
    enter,
    wild,
    entering,
}: {
    active: boolean;
    enter: (action: () => void) => void;
    wild: Wild[];
    entering: boolean;
}) {
    const { t, d } = useT();
    const clock = useSceneClock(active);
    const [swimmer] = useState(() => SWIMMERS[Math.floor(Math.random() * SWIMMERS.length)]);
    const run = useGame((s) => s.run);
    const newRun = useGame((s) => s.newRun);
    const go = useGame((s) => s.go);
    const clubName = useGame((s) => s.profile.clubName || 'Pallet FC');
    const done = useGame((s) => s.profile.missionsDone);
    const records = useGame((s) => s.records);
    const avatar = useGame((s) => s.profile.avatar);
    const [confirm, setConfirm] = useState(false);
    const ui = useRef<HTMLDivElement>(null);
    const lane = useSwimLane(ui, confirm);
    const stop = stopOf(run);
    const longOn = stop !== 'start' || (!!run && isLong(run) && !['eliminated', 'champion'].includes(run.status));
    const otherCup = !!run && !isLong(run) && !['eliminated', 'champion'].includes(run.status);

    // o time: os 3 primeiros da escalação (o capitão na frente) na Rota aberta; senão o seu avatar sozinho em Pallet
    const team = useMemo(() => routeTeam(run, longOn, avatarMon(avatar)), [longOn, run, avatar]);

    // a caminhada: na 1ª vez que a aba aparece, da parada anterior até a atual (reduzir movimento: já parado lá)
    const target = ARC[STOP_AT[stop]];
    const from = ARC[STOP_AT[STOPS[Math.max(0, STOPS.indexOf(stop) - 1)]]];
    const [s, setS] = useState(from);
    const [walking, setWalking] = useState(false);
    const walked = useRef(false);
    // sprite em 2x só com casa grande (desktop); no celular, em pé ou deitado, 1x pra não cobrir as cidades
    const worldRef = useRef<HTMLDivElement>(null);
    const [big, setBig] = useState(false);
    useEffect(() => {
        const el = worldRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(() => setBig(el.clientHeight / H >= 24));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    useEffect(() => {
        if (!active || walked.current) return;
        if (reduceMotionOn() || from === target) {
            walked.current = true;
            setS(target);
            return;
        }
        const ms = Math.min(2600, Math.max(700, (target - from) * 170));
        // espera o deslize da aba terminar antes de sair andando; anda no relógio da cena (pausa com a aba)
        let el = -320;
        setWalking(true);
        const off = clock.sub((_t, dt) => {
            el += dt;
            if (el < 0) return;
            const k = Math.min(1, el / ms);
            setS(from + (target - from) * k);
            if (k < 1) return;
            walked.current = true;
            setWalking(false);
            off();
        });
        return off;
    }, [active, from, target, clock]);

    const lead = along(s);
    const scale = big ? 2 : 1;
    // o time passando espanta os selvagens do caminho; entrar na Rota espanta todo mundo
    const threats: Threats = useRef<Record<string, Pt[] | undefined>>({});
    const near = team.map((_, i) => norm(along(s - i * 2).p));
    threats.current = entering
        ? { grass: [{ ...norm(lead.p), r: 9 }], water: [{ ...norm(lead.p), r: 9 }] }
        : { grass: near, water: near };
    const w = useWild(clock, wild, zonesOf(scale), threats, ROUTE);
    const talk = useTalkOnce('falaRota', active);
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
        <ClockCtx.Provider value={clock}>
            <div className="amb-scene rt-scene" aria-hidden>
                <div className="amb-layer rt-sea" style={{ '--depth': 0.6 } as CSSProperties}>
                    {lane !== null && (
                        // o pé do sprite fica no ponto: meio sprite abaixo do meio da faixa
                        <span className="rt-swim" style={{ top: lane + LANE / 3 }}>
                            <FieldSprite id={swimmer} anim="Walk" dir={2} scale={2} play={active} />
                        </span>
                    )}
                </div>
            </div>
            <div ref={ui} className="amb-ui rt-ui">
                <header className="rt-head">
                    <h2>
                        <span className="rt-title">{t('home.longCup.title')}</span>
                        {/* NOVO até a 1ª Rota (o mesmo selo da Home de lista) */}
                        {!records.longCups && !longOn && (
                            <span className="bc-tag rota-new">{t('profile.news.badge')}</span>
                        )}
                    </h2>
                    <span className="rt-badges" title={t('profile.badges.title')}>
                        <KantoBadge leader="brock" earned={nBadges > 0} />
                        {t('profile.badges.count', { n: nBadges, total: KANTO_BADGES.length })}
                    </span>
                </header>
                <div className="rt-map amb-par" style={{ '--depth': 0.25 } as CSSProperties}>
                    <div
                        ref={worldRef}
                        className="rt-world"
                        style={
                            {
                                '--fx': `${norm(lead.p).x * 100}%`,
                                '--fy': `${norm(lead.p).y * 100}%`,
                            } as CSSProperties
                        }
                    >
                        <Land />
                        <svg className="rt-trail" viewBox={VIEWBOX} aria-hidden>
                            <polyline points={pts(TRAIL)} className="rt-path" />
                            <polyline points={pts(TRAIL.slice(0, STOP_AT[stop] + 1))} className="rt-done" />
                            {stop !== 'planalto' && (
                                <polyline
                                    points={pts(
                                        TRAIL.slice(STOP_AT[stop], STOP_AT[STOPS[STOPS.indexOf(stop) + 1]] + 1),
                                    )}
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
                        {CITIES.flatMap((city, i) =>
                            city.gym ? (
                                <span
                                    key={city.gym}
                                    className={`rt-gym${got(city.gym) ? ' got' : ''}`}
                                    style={
                                        {
                                            ...pct([city.at[0] + 1.25, city.at[1] - 0.15]),
                                            '--d': `${-i * 0.53}s`,
                                        } as CSSProperties
                                    }
                                    title={d.profile.badges.names[city.gym]}
                                >
                                    <KantoBadge leader={city.gym} earned={got(city.gym)} />
                                </span>
                            ) : (
                                []
                            ),
                        )}
                        <WildZone wild={w} zone="water" />
                        <WildZone wild={w} zone="grass" />
                        {/* nuvem e sombra separadas: a sombra fica no chão (embaixo do time), a nuvem no alto */}
                        <i className="rt-shade k1" />
                        <i className="rt-shade k2" />
                        <i className="rt-shade k3" />
                        <i className="rt-cloud k1" />
                        <i className="rt-cloud k2" />
                        <i className="rt-cloud k3" />
                        <WildZone wild={w} zone="sky" />
                        {team.map((mon, i) => {
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
                                        id={mon.id}
                                        shiny={mon.shiny}
                                        anim={still ? 'Idle' : 'Walk'}
                                        dir={still ? 0 : at.dir}
                                        scale={scale}
                                        play={active}
                                        className="rt-mon"
                                    />
                                </span>
                            );
                        })}
                        {where && (
                            <span className="rt-here bc-tag" style={pct([lead.p[0], lead.p[1] - (big ? 3 : 2)])}>
                                {where}
                            </span>
                        )}
                    </div>
                </div>
                {talk && (
                    <div className="rt-talk">
                        <span className="rt-talk-face">
                            <img
                                className="pixel"
                                src={`assets/trainers/${WHO[stop]}.png`}
                                alt=""
                                width="80"
                                height="80"
                            />
                        </span>
                        <p>
                            <b>{story.who}</b> {story.text}
                        </p>
                    </div>
                )}
                <button
                    type="button"
                    className="btn big cup-go rt-go cb cb-gold"
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
                <ConfirmSheet
                    open={confirm}
                    onClose={() => setConfirm(false)}
                    title={t('home.newTitle')}
                    text={t('home.newText', { team: run?.teamName ?? '' })}
                    confirm={t('home.confirmYes')}
                    onConfirm={begin}
                />
            </div>
        </ClockCtx.Provider>
    );
}
