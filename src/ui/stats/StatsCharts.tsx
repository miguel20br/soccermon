import { type ReactNode, useState } from 'react';
import { FUTSAL_5 } from '../../engine/config';
import type { Leader, ShotOutcome, ShotPoint } from '../../engine/match-stats';
import { getLang, t, tn } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { clubColorHex, colorDistance, rivalColor } from '../../store/profile';

/**
 * Gráficos da tela de estatísticas (SVG puro). Seu time usa a cor do clube (Perfil); o rival fica sempre no
 * azul dos gráficos, ou no vermelho se o seu clube for azulado, independente da cor do uniforme dele (que às
 * vezes é quase igual à sua). Toda marca tem dica ao passar o mouse/tocar e a legenda diz quem é quem.
 */
const css = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
const CHART_AWAY = 0x3a8ee6;
const CHART_ALT = 0xe8423f;
/**
 * Duelo: as cores do placar (seu time, rival) e o seu lado. Os gráficos falam em time 0 (casa) e 1 (fora); no duelo o
 * convidado é o 1, então as cores trocam de lado com ele.
 * ponytail: estado de módulo, uma tela de resultado por vez; vira contexto se um dia houver duas.
 */
let duelColors: { mine: number; theirs: number; side: 0 | 1 } | null = null;
export function setChartColors(c: [number, number] | null, side: 0 | 1) {
    duelColors = c ? { mine: c[0], theirs: c[1], side } : null;
}
/** Cor do time 0 nos gráficos (na copa, a do clube). */
export const homeC = () => {
    if (duelColors) return css(duelColors.side === 0 ? duelColors.mine : duelColors.theirs);
    return css(clubColorHex(useGame.getState().profile.clubColor));
};
/** Cor do time 1 nos gráficos: o uniforme do rival na partida (o mesmo do placar); sem rival, azul ou vermelho. */
export const awayC = () => {
    if (duelColors) return css(duelColors.side === 0 ? duelColors.theirs : duelColors.mine);
    const { profile, run } = useGame.getState();
    const club = clubColorHex(profile.clubColor);
    const opp = run?.opponents[run.stage];
    if (opp?.color !== undefined) return css(rivalColor(club, opp.color));
    return css(colorDistance(club, CHART_AWAY) < 150 ? CHART_ALT : CHART_AWAY);
};
/** Título do destaque da partida (Melhor nota, Artilheiro...) no idioma do jogo. */
export const leaderTitle = (l: Leader) => (getLang() === 'pt' ? l.title : t(`stats.leader.${l.id}`));

/** Valor do destaque ("2 gols", "3 desarmes · 1 intercep.") no idioma do jogo. */
export function leaderValue(l: Leader): string {
    if (getLang() === 'pt') return l.value;
    const s = l.line.stats;
    switch (l.id) {
        case 'scorer':
            return tn('common.count.goals', s.goals);
        case 'runner':
            return t('stats.leaderValue.meters', { n: l.line.distance });
        case 'tackler':
            return t('stats.leaderValue.tackler', {
                tackles: tn('common.count.tackles', s.tacklesWon),
                n: s.interceptions,
            });
        case 'keeper':
            return tn('common.count.saves', s.saves);
        default:
            return l.value;
    }
}

const GRID = '#3a4680';
const TEXT = 'var(--text)';
const MUTED = 'var(--muted)';

export function TeamLegend({ names }: { names: [string, string] }) {
    return (
        <div className="st-legend">
            <span>
                <i style={{ background: homeC() }} />
                {names[0]}
            </span>
            <span>
                <i style={{ background: awayC() }} />
                {names[1]}
            </span>
        </div>
    );
}

/** Dica flutuante dentro do gráfico. */
function useTip() {
    const [tip, setTip] = useState<{ x: number; y: number; text: ReactNode } | null>(null);
    const node = tip ? (
        <div className="st-tip" style={{ left: `${tip.x}%`, top: `${tip.y}%` }}>
            {tip.text}
        </div>
    ) : null;
    return { tip: node, show: setTip, hide: () => setTip(null) };
}

/** Comparação lado a lado (chutes, passes…): barra dividida na proporção de cada time. */
export function CompareRows({
    rows,
}: {
    rows: { label: string; home: number; away: number; fmt?: (v: number) => string }[];
}) {
    return (
        <div className="st-compare">
            {rows.map((r) => {
                const total = r.home + r.away || 1;
                const fmt = r.fmt ?? ((v: number) => String(v));
                return (
                    <div key={r.label} className="st-compare-row">
                        <b>{fmt(r.home)}</b>
                        <span>{r.label}</span>
                        <b>{fmt(r.away)}</b>
                        <div className="st-split" title={`${r.label}: ${fmt(r.home)} x ${fmt(r.away)}`}>
                            <i style={{ width: `${(r.home / total) * 100}%`, background: homeC() }} />
                            <i style={{ width: `${(r.away / total) * 100}%`, background: awayC() }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const PERIOD_LABEL = ["0'", "5'", "10'", "15'", "20'", "25'", "30'", "35'"];

/** Perigo por período: colunas divergentes (seu time para cima, rival para baixo) e os gols de cada período. */
/** Bolinhas desenhadas marcando os gols do período (até 3; mais que isso vira "+n"). */
function GoalBalls({ n, cx, y }: { n: number; cx: number; y: number }) {
    if (n <= 0) return null;
    const m = Math.min(3, n);
    return (
        <g aria-hidden>
            {Array.from({ length: m }, (_, k) => (
                <circle
                    // biome-ignore lint/suspicious/noArrayIndexKey: bolinhas iguais, sem identidade
                    key={k}
                    cx={cx + (k - (m - 1) / 2) * 9}
                    cy={y}
                    r={3.5}
                    fill="#fff"
                    stroke="#141a33"
                    strokeWidth={1.2}
                />
            ))}
            {n > 3 && (
                <text x={cx + (m / 2) * 9 + 3} y={y + 3.5} fill={TEXT} fontSize={10}>
                    +{n - 3}
                </text>
            )}
        </g>
    );
}

export function DangerChart({
    data,
    names,
}: {
    data: { home: number; away: number; goals: [number, number] }[];
    names: [string, string];
}) {
    const { t } = useT();
    const { tip, show, hide } = useTip();
    const W = 560;
    const H = 220;
    const pad = { l: 8, r: 8, t: 26, b: 26 };
    const mid = pad.t + (H - pad.t - pad.b) / 2;
    const half = (H - pad.t - pad.b) / 2 - 6;
    const max = Math.max(0.3, ...data.flatMap((d) => [d.home, d.away]));
    const band = (W - pad.l - pad.r) / data.length;
    const bw = Math.min(24, band * 0.5);
    return (
        <div className="st-chart">
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('stats.chart.dangerAria')} onMouseLeave={hide}>
                <line x1={pad.l} x2={W - pad.r} y1={mid} y2={mid} stroke={GRID} strokeWidth={1} />
                {/* intervalo */}
                <line x1={W / 2} x2={W / 2} y1={pad.t - 10} y2={H - pad.b} stroke={GRID} strokeWidth={1} />
                <text x={W / 2} y={pad.t - 14} fill={MUTED} fontSize={10} textAnchor="middle">
                    {t('stats.chart.halfTime')}
                </text>
                {data.map((d, i) => {
                    const cx = pad.l + band * i + band / 2;
                    const hh = (d.home / max) * half;
                    const ah = (d.away / max) * half;
                    const r = Math.min(4, bw / 2);
                    return (
                        // biome-ignore lint/a11y/noStaticElementInteractions: dica do gráfico (a tabela de jogadores tem os números)
                        <g
                            key={PERIOD_LABEL[i]}
                            onMouseEnter={() =>
                                show({
                                    x: (cx / W) * 100,
                                    y: 6,
                                    text: (
                                        <>
                                            <b>
                                                {PERIOD_LABEL[i]}–{i === 7 ? "40'" : PERIOD_LABEL[i + 1]}
                                            </b>
                                            <br />
                                            {t('stats.chart.danger', {
                                                team: names[0],
                                                v: d.home.toFixed(2),
                                                n: d.goals[0],
                                            })}
                                            <br />
                                            {t('stats.chart.danger', {
                                                team: names[1],
                                                v: d.away.toFixed(2),
                                                n: d.goals[1],
                                            })}
                                        </>
                                    ),
                                })
                            }
                        >
                            <rect
                                x={cx - band / 2}
                                y={pad.t}
                                width={band}
                                height={H - pad.t - pad.b}
                                fill="transparent"
                            />
                            {hh > 0.5 && (
                                <path
                                    d={`M${cx - bw / 2},${mid - 1} V${mid - hh + r} q0,-${r} ${r},-${r} H${cx + bw / 2 - r} q${r},0 ${r},${r} V${mid - 1} Z`}
                                    fill={homeC()}
                                />
                            )}
                            {ah > 0.5 && (
                                <path
                                    d={`M${cx - bw / 2},${mid + 1} V${mid + ah - r} q0,${r} ${r},${r} H${cx + bw / 2 - r} q${r},0 ${r},-${r} V${mid + 1} Z`}
                                    fill={awayC()}
                                />
                            )}
                            <GoalBalls n={d.goals[0]} cx={cx} y={mid - hh - 8} />
                            <GoalBalls n={d.goals[1]} cx={cx} y={mid + ah + 9} />
                            <text x={cx} y={H - 8} fill={MUTED} fontSize={10} textAnchor="middle">
                                {PERIOD_LABEL[i]}
                            </text>
                        </g>
                    );
                })}
            </svg>
            {tip}
        </div>
    );
}

/** Posse por período: coluna 100% (seu time embaixo, rival em cima) com a sua porcentagem. */
export function PossessionChart({ data, names }: { data: { home: number; away: number }[]; names: [string, string] }) {
    const { t } = useT();
    const { tip, show, hide } = useTip();
    const W = 560;
    const H = 170;
    const pad = { l: 8, r: 8, t: 8, b: 24 };
    const band = (W - pad.l - pad.r) / data.length;
    const bw = Math.min(24, band * 0.5);
    const ph = H - pad.t - pad.b;
    return (
        <div className="st-chart">
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('stats.chart.possessionAria')} onMouseLeave={hide}>
                <line x1={pad.l} x2={W - pad.r} y1={pad.t + ph / 2} y2={pad.t + ph / 2} stroke={GRID} strokeWidth={1} />
                {data.map((d, i) => {
                    const cx = pad.l + band * i + band / 2;
                    const hh = d.home * ph;
                    return (
                        // biome-ignore lint/a11y/noStaticElementInteractions: dica do gráfico
                        <g
                            key={PERIOD_LABEL[i]}
                            onMouseEnter={() =>
                                show({
                                    x: (cx / W) * 100,
                                    y: 4,
                                    text: (
                                        <>
                                            <b>
                                                {PERIOD_LABEL[i]}–{i === 7 ? "40'" : PERIOD_LABEL[i + 1]}
                                            </b>
                                            <br />
                                            {names[0]} {Math.round(d.home * 100)}% · {names[1]}{' '}
                                            {Math.round(d.away * 100)}%
                                        </>
                                    ),
                                })
                            }
                        >
                            <rect x={cx - band / 2} y={pad.t} width={band} height={ph} fill="transparent" />
                            <rect
                                x={cx - bw / 2}
                                y={pad.t + ph - hh + 1}
                                width={bw}
                                height={Math.max(0, hh - 1)}
                                rx={3}
                                fill={homeC()}
                            />
                            <rect
                                x={cx - bw / 2}
                                y={pad.t}
                                width={bw}
                                height={Math.max(0, ph - hh - 1)}
                                rx={3}
                                fill={awayC()}
                            />
                            <text x={cx} y={H - 8} fill={MUTED} fontSize={10} textAnchor="middle">
                                {PERIOD_LABEL[i]}
                            </text>
                        </g>
                    );
                })}
            </svg>
            {tip}
        </div>
    );
}

function ShotMark({ s, x, y, color }: { s: ShotPoint; x: number; y: number; color?: string }) {
    const c = color ?? (s.team === 0 ? homeC() : awayC());
    switch (s.outcome) {
        case 'gol':
            return <circle cx={x} cy={y} r={7} fill={c} stroke="#232d57" strokeWidth={2} />;
        case 'defesa':
            return <circle cx={x} cy={y} r={5} fill="none" stroke={c} strokeWidth={2} />;
        case 'trave':
            return (
                <path
                    d={`M${x},${y - 6} L${x + 6},${y + 5} L${x - 6},${y + 5} Z`}
                    fill={c}
                    stroke="#232d57"
                    strokeWidth={1.5}
                />
            );
        case 'bloqueado':
            return <rect x={x - 4} y={y - 4} width={8} height={8} fill={c} stroke="#232d57" strokeWidth={1.5} />;
        default:
            return (
                <path
                    d={`M${x - 4},${y - 4} L${x + 4},${y + 4} M${x + 4},${y - 4} L${x - 4},${y + 4}`}
                    stroke={c}
                    strokeWidth={2}
                />
            );
    }
}

/** Mapa de chutes na mini quadra: de onde saiu cada chute; o formato diz como terminou. */
export function ShotMapChart({ shots }: { shots: ShotPoint[] }) {
    const { t, d } = useT();
    const outcome = (o: ShotOutcome) => d.stats.chart.outcome[o] ?? o;
    const { tip, show, hide } = useTip();
    const { length, width, goalWidth, penaltyAreaDepth } = FUTSAL_5.pitch;
    const k = 13;
    const pad = 14;
    const W = length * k + pad * 2;
    const H = width * k + pad * 2;
    const px = (x: number) => pad + x * k;
    const py = (y: number) => pad + y * k;
    return (
        <div className="st-chart">
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('stats.chart.shotMapAria')} onMouseLeave={hide}>
                <rect x={px(0)} y={py(0)} width={length * k} height={width * k} rx={4} fill="#1b244a" stroke={GRID} />
                <line x1={px(length / 2)} x2={px(length / 2)} y1={py(0)} y2={py(width)} stroke={GRID} />
                <circle cx={px(length / 2)} cy={py(width / 2)} r={3 * k} fill="none" stroke={GRID} />
                {[0, length].map((gx) => (
                    <g key={gx}>
                        <path
                            d={`M${px(gx)},${py(width / 2 - 4)} A${penaltyAreaDepth * k},${penaltyAreaDepth * k} 0 0 ${gx === 0 ? 1 : 0} ${px(gx)},${py(width / 2 + 4)}`}
                            fill="none"
                            stroke={GRID}
                        />
                        <line
                            x1={px(gx)}
                            x2={px(gx)}
                            y1={py(width / 2 - goalWidth / 2)}
                            y2={py(width / 2 + goalWidth / 2)}
                            stroke="#e8e8f0"
                            strokeWidth={4}
                        />
                    </g>
                ))}
                {shots.map((s, i) => (
                    // biome-ignore lint/a11y/noStaticElementInteractions: dica do gráfico
                    <g
                        // biome-ignore lint/suspicious/noArrayIndexKey: chutes não têm id
                        key={i}
                        onMouseEnter={() =>
                            show({
                                x: (px(s.x) / W) * 100,
                                y: (py(s.y) / H) * 100,
                                text: (
                                    <>
                                        <b>
                                            {s.minute}' {s.name}
                                        </b>
                                        <br />
                                        {outcome(s.outcome)}
                                        {t('stats.chart.chance', { n: Math.round(s.xg * 100) })}
                                        {s.move ? t('stats.chart.withMove') : ''}
                                    </>
                                ),
                            })
                        }
                    >
                        <circle cx={px(s.x)} cy={py(s.y)} r={10} fill="transparent" />
                        <ShotMark s={s} x={px(s.x)} y={py(s.y)} />
                    </g>
                ))}
            </svg>
            <div className="st-legend outcomes">
                {(['gol', 'defesa', 'trave', 'bloqueado', 'fora'] as ShotOutcome[]).map((o) => (
                    <span key={o}>
                        <svg width={16} height={16} viewBox="-8 -8 16 16" aria-hidden>
                            <ShotMark s={{ outcome: o, team: 0 } as ShotPoint} x={0} y={0} color="#c8cde8" />
                        </svg>
                        {outcome(o)}
                    </span>
                ))}
            </div>
            {tip}
        </div>
    );
}
