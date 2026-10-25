import { type CSSProperties, useRef, useState } from 'react';
import { dict } from '../../i18n';
import { useT } from '../../i18n/react';
import { dailyDay, dailyStreak } from '../../store/daily';
import { resumeScreenOf, useGame } from '../../store/game-store';
import { bannerInk, clubColorHex } from '../../store/profile';
import { markSeen } from '../coach/Coach';
import { HudIcon } from '../components/MatchHud';
import { dailyInPlay, useDailyBegin } from '../screens/Daily';
import { ResumeCard } from '../screens/Home';
import { ClockCtx, useSceneClock } from './clock';
import { FieldSprite } from './FieldSprite';
import { type Threats, useMq, useWild, type WildScene, WildZone, type ZoneDef } from './WildZone';
import type { Pt, Wild } from './wild';

const css = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
/** Escurece uma cor 0xRRGGBB (sombra da camisa na torcida). */
const shade = (n: number, k: number) =>
    css(((((n >> 16) & 255) * k) << 16) | ((((n >> 8) & 255) * k) << 8) | ((n & 255) * k));

const SKIN = ['#f2c49b', '#c98b5a', '#8d5a3b', '#f7d7b5'];
const HAIR = ['#2b1d14', '#6b3f1f', '#e8c15a', '#1b1b1b'];

/**
 * Um pedaço da torcida em pixel art (SVG em data URI, repetido de lado): 4 torcedores de 6 px, com o 2º quadro logo
 * abaixo (braços pra cima, 1 px mais alto). Metade pula num quadro e metade no outro: a fileira nunca pula inteira.
 * Camisas na cor do clube, uma branca e uma escura.
 */
function crowdTile(club: number): string {
    const shirts = [css(club), '#f4f1e6', css(club), shade(club, 0.62)];
    let r = '';
    const rect = (x: number, y: number, w: number, h: number, c: string) =>
        (r += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`);
    for (let f = 0; f < 2; f++) {
        for (let j = 0; j < 4; j++) {
            const ox = j * 7;
            const oy = f * 9;
            const up = (j + f) % 2 === 1;
            const s = shirts[j];
            const dy = up ? 0 : 1;
            if (up) {
                rect(ox, oy, 1, 3, s);
                rect(ox + 5, oy, 1, 3, s);
            }
            rect(ox + 1, oy + dy, 4, 1, HAIR[(j * 3 + 1) % 4]);
            rect(ox + 1, oy + dy + 1, 4, 2, SKIN[(j * 2 + 1) % 4]);
            rect(ox, oy + dy + 3, 6, 9 - dy - 3, s);
        }
    }
    return `url("data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="18" shape-rendering="crispEdges">${r}</svg>`,
    )}")`;
}

const ROWS = 6;
/** Flashes de câmera na torcida: poucos e fora de compasso (nada piscando junto). */
const FLASHES = [
    { x: 14, y: 34, d: 5.3 },
    { x: 62, y: 20, d: 7.9 },
    { x: 84, y: 58, d: 6.7 },
];

/** Tábuas da quadra: mais finas no fundo, mais grossas perto do túnel (perspectiva). */
const PLANKS = Array.from({ length: 18 }, (_, i) => {
    const y = (k: number) => 100 * (k / 18) ** 1.45;
    return [y(i), y(i + 1) - y(i) + 0.01] as const;
});

/** Torre de refletor (pixel art): o poste, a grade de lâmpadas e o facho. */
function Floodlight({ side }: { side: 'l' | 'r' }) {
    return (
        <svg className={`es-flood ${side}`} viewBox="0 0 24 40" shapeRendering="crispEdges" aria-hidden>
            <polygon className="es-beam" points="2,10 22,10 40,40 -16,40" />
            <rect x="11" y="12" width="2" height="28" fill="#0b1026" />
            <rect x="9" y="16" width="6" height="1" fill="#0b1026" />
            <rect x="9" y="22" width="6" height="1" fill="#0b1026" />
            <rect x="3" y="2" width="18" height="10" fill="#0b1026" />
            {[0, 1, 2].map((row) =>
                [0, 1, 2, 3].map((col) => (
                    <rect
                        key={`${row}-${col}`}
                        className={`es-bulb b${(row + col) % 3}`}
                        x={4 + col * 4}
                        y={3 + row * 3}
                        width="3"
                        height="2"
                    />
                )),
            )}
        </svg>
    );
}

/** A quadra vista do túnel: tábuas, linhas em perspectiva, o capitão fazendo embaixadinha e quem está em volta. */
function Court({ captain, play, small, wild }: { captain: number; play: boolean; small: boolean; wild: WildScene }) {
    return (
        <div className="es-court">
            <svg
                className="es-floor"
                viewBox="0 0 240 100"
                preserveAspectRatio="xMidYMin slice"
                shapeRendering="crispEdges"
                aria-hidden
            >
                {PLANKS.map(([y, h], i) => (
                    <rect key={y} x="0" y={y} width="240" height={h} fill={i % 2 ? '#b8773f' : '#c7864b'} />
                ))}
                <g className="es-lines" fill="none">
                    <line x1="0" y1="3" x2="240" y2="3" />
                    <line x1="0" y1="97" x2="240" y2="97" />
                    <line x1="120" y1="3" x2="120" y2="97" />
                    <ellipse cx="120" cy="30" rx="25" ry="10" />
                    <path d="M0 9 Q34 11 36 30 Q34 52 0 58" />
                    <path d="M240 9 Q206 11 204 30 Q206 52 240 58" />
                </g>
                <rect x="119" y="29.4" width="2" height="1.2" fill="#f4f1e6" />
            </svg>
            <i className="es-spot" />
            <WildZone wild={wild} zone="ball" />
            <WildZone wild={wild} zone="edge" />
            <div className="es-captain">
                <i className="es-shadow" />
                <FieldSprite id={captain} anim="Idle" dir={0} scale={small ? 1 : 2} play={play} className="es-mon" />
                <img className="es-ball" src="assets/ui/ball.svg" alt="" width="16" height="16" />
            </div>
        </div>
    );
}

/** O placar eletrônico pendurado no teto: a Copa do Dia e os dias da semana acesos. */
function Board() {
    const { t, lang } = useT();
    const daily = useGame((s) => s.daily);
    const go = useGame((s) => s.go);
    useGame((s) => s.run?.status);
    const today = dailyDay();
    const entry = daily.find((e) => e.day === today);
    const streak = dailyStreak(daily, today);
    const playing = dailyInPlay();
    const { begin, busy } = useDailyBegin();
    const days = dict(lang).liga.daily.weekDays;
    return (
        <section className="es-board" aria-label={t('liga.home.dailyTag')}>
            <i className="es-cable l" aria-hidden />
            <i className="es-cable r" aria-hidden />
            <div className="es-board-in">
                <h2 className="es-board-title">{t('liga.home.dailyTag')}</h2>
                <ol className="es-week" aria-label={t('liga.daily.week', { n: streak.weekCount })}>
                    {streak.week.map((on, i) => (
                        <li
                            key={streak.days[i]}
                            className={`${on ? 'on' : ''}${streak.days[i] === today ? ' today' : ''}`}
                        >
                            {days[i]}
                        </li>
                    ))}
                </ol>
                <button
                    type="button"
                    className={`btn small es-board-go${entry && !playing ? ' ghost' : ''}`}
                    disabled={busy}
                    onClick={() => (entry && !playing ? go('daily') : void begin())}
                >
                    {playing
                        ? t('liga.home.dailyContinue')
                        : entry
                          ? t('liga.home.dailyDone')
                          : t('liga.home.dailyPlay')}
                </button>
            </div>
        </section>
    );
}

const SMALL = '(max-width: 359px), (max-height: 700px)';
const BIG = '(min-width: 900px) and (min-height: 700px)';
const LANDSCAPE = '(orientation: landscape) and (max-height: 520px)';
const SCARE: Record<string, Pt[]> = {
    edge: [{ x: 0.5, y: 1.4, r: 9 }],
    ball: [{ x: 0.5, y: 1.4, r: 9 }],
    stand: [{ x: 0.5, y: 0.5, r: 9 }],
};

/**
 * As zonas do Estádio: o dorminhoco sentado nas fileiras de baixo da arquibancada (fora da faixa do clube), o gandula
 * correndo na linha de fundo e os torcedores/mascotes na beira, dos lados (o meio é do capitão; deitado, só à
 * direita, porque os botões ficam à esquerda). Longe, sprite 1x; perto (beira), 2x; tudo maior no desktop e 1x no
 * celular pequeno.
 */
function zonesOf(small: boolean, big: boolean, wide: boolean): Record<string, ZoneDef> {
    const k = big ? 2 : 1;
    return {
        stand: {
            ok: (x, y) => y > 0.62 && y < 0.9 && (x < 0.33 || x > 0.67),
            speed: 0,
            still: true,
            scale: k,
            z: () => 2,
        },
        ball: { ok: (_x, y) => y > 0.1 && y < 0.2, speed: 0.4, scale: k, z: () => 0 },
        edge: {
            ok: wide
                ? (x, y) => y > 0.45 && y < 0.85 && x > 0.55
                : (x, y) => y > 0.22 && y < 0.45 && (x < 0.3 || x > 0.7),
            speed: 0.2,
            scale: small ? 1 : big ? 3 : 2,
            z: () => 3,
        },
    };
}

/**
 * Estádio (centro, a entrada): visto da boca do túnel, com a torcida na cor do clube, os refletores e o letreiro de
 * LED. Em cima, o placar com a Copa do Dia; embaixo, a copa em andamento (se tiver) e o JOGAR da Copa Relâmpago.
 */
export function Estadio({
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
    const { t } = useT();
    const clock = useSceneClock(active);
    const small = useMq(SMALL);
    const big = useMq(BIG);
    const wide = useMq(LANDSCAPE);
    const zones = zonesOf(small, big, wide);
    // o time saindo do túnel espanta quem está na beira (e acorda o dorminhoco)
    const threats: Threats = useRef<Record<string, Pt[] | undefined>>({});
    threats.current = entering ? SCARE : {};
    const w = useWild(clock, wild, zones, threats);
    const run = useGame((s) => s.run);
    const newRun = useGame((s) => s.newRun);
    const go = useGame((s) => s.go);
    const clubName = useGame((s) => s.profile.clubName || 'Pallet FC');
    const club = useGame((s) => clubColorHex(s.profile.clubColor));
    const avatar = useGame((s) => s.profile.avatar);
    const [confirm, setConfirm] = useState(false);
    const inProgress = !!run && !['eliminated', 'champion'].includes(run.status);
    const captain =
        (inProgress && (run.picks.find((p) => p.uid === run.captainUid) ?? run.picks[0])?.speciesId) ||
        (avatar.kind === 'pokemon' ? avatar.speciesId : 25);
    const play = () => {
        if (inProgress && !confirm) {
            setConfirm(true);
            return;
        }
        markSeen(['intro']);
        enter(() => newRun(clubName));
    };
    const vars = {
        '--club': css(club),
        '--club-ink': css(bannerInk(club)),
        '--crowd': crowdTile(club),
    } as CSSProperties;

    return (
        <ClockCtx.Provider value={clock}>
            <div className="amb-scene es-scene" style={vars} aria-hidden>
                <div className="amb-layer es-sky" style={{ '--depth': 0.6 } as CSSProperties}>
                    <i className="es-stars" />
                    <i className="es-stars s2" />
                    <Floodlight side="l" />
                    <Floodlight side="r" />
                </div>
                <div className="amb-layer es-arena" style={{ '--depth': 0.3 } as CSSProperties}>
                    <div className="es-stand">
                        {Array.from({ length: ROWS }, (_, i) => (
                            <i
                                // biome-ignore lint/suspicious/noArrayIndexKey: fileiras fixas
                                key={i}
                                className="es-row"
                                style={{ '--r': i } as CSSProperties}
                            />
                        ))}
                        {FLASHES.map((f) => (
                            <i
                                key={`${f.x}-${f.y}`}
                                className="es-flash"
                                style={{ left: `${f.x}%`, top: `${f.y}%`, animationDuration: `${f.d}s` }}
                            />
                        ))}
                        <span className="es-banner">{clubName}</span>
                        <WildZone wild={w} zone="stand" />
                    </div>
                    <div className="es-led">
                        <span>
                            {t('home.amb.board').repeat(3)}
                            {t('home.amb.board').repeat(3)}
                        </span>
                    </div>
                    <Court captain={captain} play={active} small={small} wild={w} />
                </div>
                <div className="amb-layer es-tunnel" style={{ '--depth': 0 } as CSSProperties}>
                    <i className="es-wall l" />
                    <i className="es-wall r" />
                    <i className="es-lintel" />
                    <i className="es-lamp" />
                    <i className="es-mat" />
                </div>
            </div>
            <div className="amb-ui es-ui">
                <Board />
                <div className="es-actions">
                    {inProgress && <ResumeCard run={run} onClick={() => go(resumeScreenOf(run.status))} />}
                    {confirm ? (
                        <div className="confirm-new es-confirm bc-surface">
                            <p>{t('home.confirmNew', { team: run?.teamName ?? '' })}</p>
                            <div className="row" style={{ justifyContent: 'center' }}>
                                <button type="button" className="btn primary" onClick={play}>
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
                            className={`btn big cup-go es-play ${inProgress ? 'outline' : 'primary'}`}
                            onClick={play}
                        >
                            <span className="cup-go-txt">
                                <b>{inProgress ? t('home.newCup') : t('home.play')}</b>
                                <small>{t('home.playTag')}</small>
                            </span>
                            <HudIcon kind="next" />
                        </button>
                    )}
                </div>
            </div>
        </ClockCtx.Provider>
    );
}
