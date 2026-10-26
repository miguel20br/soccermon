import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { weeklyEventType } from '../../engine/specials';
import { dict, typeName } from '../../i18n';
import { useT } from '../../i18n/react';
import { isFirstVisit } from '../../store/coach';
import { dailyDay, dailyStreak } from '../../store/daily';
import { resumeScreenOf, seedFromUrl, useGame } from '../../store/game-store';
import type { CupMode } from '../../store/long-cup';
import { bannerInk, clubColorHex } from '../../store/profile';
import { markSeen, useHydrated } from '../coach/Coach';
import { cupStep } from '../components/AccountLink';
import { ParkedRuns } from '../components/ParkedRuns';
import { FriendChallenge } from '../profile/FriendsTab';
import { dailyInPlay, useDailyBegin } from '../screens/Daily';
import { ClockCtx, useSceneClock } from './clock';
import { FieldSprite } from './FieldSprite';
import { type Mode, type ModeId, PlayBar, playModes } from './PlayBar';
import { type Blockers, type Threats, useMq, useWild, type WildScene, WildZone, type ZoneDef } from './WildZone';
import { dirOf, type Pt, type Wild } from './wild';

const css = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
/** Escurece uma cor 0xRRGGBB (sombra da camisa na torcida). */
const shade = (n: number, k: number) =>
    css(((((n >> 16) & 255) * k) << 16) | ((((n >> 8) & 255) * k) << 8) | ((n & 255) * k));

const SKIN = ['#d9b08c', '#a87754', '#7a5038', '#e0c3a4'];
const HAIR = ['#2b1d14', '#5a3820', '#b89a52', '#1b1b1b'];
/** Mistura duas cores 0xRRGGBB (k = quanto de `b`): a torcida fica mais apagada que a cor viva do clube. */
const mix = (a: number, b: number, k: number) => {
    const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k);
    return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};
const SEAT = 0x232a58;

/**
 * Um pedaço da torcida em pixel art (SVG em data URI, repetido de lado): 6 lugares de 7 px, 4 ocupados e 2 cadeiras
 * vazias (respiro), com o 2º quadro logo abaixo. Só 1 dos 4 levanta os braços no 2º quadro: a fileira quase não mexe.
 * Camisas na cor do clube puxada pro azul do estádio (calma), uma clara e uma escura.
 */
function crowdTile(club: number): string {
    const calm = mix(club, SEAT, 0.38);
    const shirts = [css(calm), '', '#a9adc0', shade(calm, 0.7), '', css(calm)];
    let r = '';
    const rect = (x: number, y: number, w: number, h: number, c: string) =>
        (r += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`);
    for (let f = 0; f < 2; f++) {
        for (let j = 0; j < 6; j++) {
            const ox = j * 7;
            const oy = f * 9;
            const s = shirts[j];
            if (!s) {
                // cadeira vazia: o encosto
                rect(ox, oy + 5, 6, 4, css(SEAT));
                rect(ox, oy + 5, 6, 1, '#2e3670');
                continue;
            }
            const up = f === 1 && j === 2;
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
        `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="18" shape-rendering="crispEdges">${r}</svg>`,
    )}")`;
}

/** Fileiras da torcida (poucas: o olho vai pro JOGAR e pros Pokémon, não pra arquibancada). */
const ROWS = 4;
/** Flashes de câmera na torcida: dois, raros e fora de compasso. */
const FLASHES = [
    { x: 18, y: 30, d: 11.3 },
    { x: 77, y: 58, d: 14.9 },
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
function Court({
    captain,
    play,
    small,
    wild,
    look,
}: {
    captain: number;
    play: boolean;
    small: boolean;
    wild: WildScene;
    look: number;
}) {
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
                <FieldSprite id={captain} anim="Idle" dir={look} scale={small ? 1 : 2} play={play} className="es-mon" />
                <img className="es-ball" src="assets/ui/ball.svg" alt="" width="16" height="16" />
            </div>
        </div>
    );
}

/** A Copa do Dia de hoje: o que o botão diz (jogar, continuar ou ver o resultado) e pra onde leva. */
function useDaily() {
    const { t } = useT();
    const daily = useGame((s) => s.daily);
    const go = useGame((s) => s.go);
    useGame((s) => s.run?.status);
    const entry = daily.find((e) => e.day === dailyDay());
    const playing = dailyInPlay();
    const { begin, busy } = useDailyBegin();
    const done = !!entry && !playing;
    return {
        busy,
        done,
        label: playing ? t('liga.home.dailyContinue') : entry ? t('liga.home.dailyDone') : t('liga.home.dailyPlay'),
        go: () => (done ? go('daily') : void begin()),
    };
}

/** O placar eletrônico pendurado no teto: a Copa do Dia e os dias da semana acesos. */
function Board() {
    const { t, lang } = useT();
    const daily = useGame((s) => s.daily);
    const today = dailyDay();
    const streak = dailyStreak(daily, today);
    const d = useDaily();
    const days = dict(lang).liga.daily.weekDays;
    return (
        <section className="es-board" aria-label={t('liga.home.dailyTag')}>
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
                    className={`btn small es-board-go${d.done ? ' ghost' : ''}`}
                    disabled={d.busy}
                    onClick={d.go}
                >
                    {d.label}
                </button>
            </div>
        </section>
    );
}

const SMALL = '(max-width: 359px), (max-height: 700px)';
const BIG = '(min-width: 900px) and (min-height: 700px)';
const LANDSCAPE = '(orientation: landscape) and (max-height: 520px)';
/**
 * O que os Pokémon do Estádio respeitam: o placar e os botões, a boca do túnel (fica na frente de tudo), a faixa e o
 * letreiro (o dorminhoco não deita em cima) e o capitão (ninguém entra no sprite dele).
 */
const STADIUM: Blockers = {
    ui: '.es-ui > *, .es-wall, .es-lintel, .es-lamp',
    props: '.es-banner, .es-led, .es-captain .fs-sprite',
};
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
        ball: { ok: (_x, y) => y > 0.1 && y < 0.2, speed: 0.4, scale: k },
        edge: {
            ok: wide
                ? (x, y) => y > 0.45 && y < 0.85 && x > 0.55
                : // longe das paredes do túnel (que cobrem a beira da quadra no celular em pé)
                  (x, y) => y > 0.22 && y < 0.45 && ((x > 0.13 && x < 0.3) || (x > 0.7 && x < 0.87)),
            speed: 0.2,
            scale: small ? 1 : big ? 3 : 2,
        },
    };
}

/**
 * O capitão vira pro dedo (ou pro mouse): a direção PMD do toque mais recente em relação a ele; parado 2,5 s, volta
 * a olhar pra frente. Só com a aba na tela.
 */
function useLook(active: boolean): number {
    const [dir, setDir] = useState(0);
    useEffect(() => {
        if (!active) return;
        let idle = 0;
        const on = (e: PointerEvent) => {
            const el = document.querySelector('.amb-estadio .es-captain');
            if (!el) return;
            const r = el.getBoundingClientRect();
            const dx = e.clientX - r.left;
            const dy = e.clientY - (r.top - 20);
            setDir(Math.hypot(dx, dy) < 24 ? 0 : dirOf(dx, dy));
            window.clearTimeout(idle);
            idle = window.setTimeout(() => setDir(0), 2500);
        };
        window.addEventListener('pointerdown', on);
        window.addEventListener('pointermove', on);
        return () => {
            window.removeEventListener('pointerdown', on);
            window.removeEventListener('pointermove', on);
            window.clearTimeout(idle);
            setDir(0);
        };
    }, [active]);
    return dir;
}

/**
 * Estádio (centro, a entrada e a vitrine do jogo): visto da boca do túnel, com a torcida na cor do clube, os
 * refletores e o letreiro de LED. Em cima, o logo e o placar da Copa do Dia (na 1ª visita, a frase); embaixo, o
 * JOGAR (copa em andamento, desafio ou Copa Relâmpago) e o seletor dos outros modos.
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
    const w = useWild(clock, wild, zones, threats, STADIUM);
    const run = useGame((s) => s.run);
    const newRun = useGame((s) => s.newRun);
    const go = useGame((s) => s.go);
    const clubName = useGame((s) => s.profile.clubName || 'Pallet FC');
    const club = useGame((s) => clubColorHex(s.profile.clubColor));
    const avatar = useGame((s) => s.profile.avatar);
    const hydrated = useHydrated();
    // 1ª visita (nada jogado): no lugar do placar, o logo e a frase; o JOGAR é o único botão
    const firstVisit = useGame(isFirstVisit);
    // link de desafio (?seed=): o mesmo draft do amigo vira o botão principal
    const [challenge] = useState(seedFromUrl);
    /** Começar outra copa apaga a atual: com uma em andamento, pede confirmação antes. */
    const [confirm, setConfirm] = useState<{ seed?: string; mode?: CupMode }>();
    const [open, setOpen] = useState(false);
    const inProgress = !!run && !['eliminated', 'champion'].includes(run.status);
    const captain =
        (inProgress && (run.picks.find((p) => p.uid === run.captainUid) ?? run.picks[0])?.speciesId) ||
        (avatar.kind === 'pokemon' ? avatar.speciesId : 25);
    const play = (seed?: string, mode?: CupMode) => {
        if (inProgress && !confirm) {
            setConfirm({ seed, mode });
            return;
        }
        markSeen(['intro']);
        enter(() => newRun(clubName, seed, undefined, mode));
    };
    const daily = useDaily();
    const step = run && `${run.teamName} · ${cupStep({ ...run, played: run.results.length })}`;
    const modes: Record<ModeId, Omit<Mode, 'id'>> = {
        continue: {
            title: t('home.resume'),
            sub: step || '',
            icon: 'play',
            go: () => run && go(resumeScreenOf(run.status)),
        },
        challenge: {
            title: t('home.challenge', { seed: challenge ?? '' }),
            sub: t('home.playTag'),
            icon: 'addFriend',
            go: () => play(challenge ?? undefined),
        },
        quick: {
            title: t('home.quickCup.title'),
            sub: inProgress ? `${t('home.newCup')} · ${t('home.quickCup.tag')}` : t('home.quickCup.tag'),
            icon: 'stopwatch',
            go: () => play(),
        },
        long: {
            title: t('home.longCup.title'),
            sub: t('home.longCup.tag'),
            icon: 'map',
            go: () => play(undefined, 'longa'),
        },
        daily: { title: t('liga.home.dailyTag'), sub: daily.label, icon: 'cup', busy: daily.busy, go: daily.go },
        duel: { title: t('duel.title'), sub: t('home.amb.signDuel'), icon: 'friends', go: () => go('duel') },
    };
    const mode = (id: ModeId): Mode => ({ id, ...modes[id] });
    const plan = playModes({ inProgress, challenge, firstVisit });
    // o JOGAR fala o que faz: "Jogar · Copa Relâmpago", "Continuar · Pallet FC · Quartas"
    const main =
        plan.main === 'quick' ? { ...mode('quick'), title: t('home.play'), sub: t('home.playTag') } : mode(plan.main);
    // o seletor fecha ao sair da aba, com Esc ou com um toque fora dele
    useEffect(() => {
        if (!open || !active) {
            setOpen(false);
            return;
        }
        const out = (e: PointerEvent) => !(e.target as Element).closest?.('.es-go') && setOpen(false);
        const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('pointerdown', out);
        document.addEventListener('keydown', esc);
        return () => {
            document.removeEventListener('pointerdown', out);
            document.removeEventListener('keydown', esc);
        };
    }, [open, active]);
    const look = useLook(active);
    const week = t('home.eventWeek', { type: typeName(weeklyEventType(new Date())) }).toUpperCase();
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
                            {`${week} · ${t('home.amb.board')}`.repeat(3)}
                            {`${week} · ${t('home.amb.board')}`.repeat(3)}
                        </span>
                    </div>
                    <Court captain={captain} play={active} small={small} wild={w} look={look} />
                </div>
                <div className="amb-layer es-tunnel" style={{ '--depth': 0 } as CSSProperties}>
                    <i className="es-wall l" />
                    <i className="es-wall r" />
                    <i className="es-lintel" />
                    <i className="es-lamp" />
                    <i className="es-mat" />
                </div>
            </div>
            <div className={`amb-ui es-ui${firstVisit ? ' es-first' : ''}`}>
                <div className="es-top">
                    <i className="es-cable l" aria-hidden />
                    <i className="es-cable r" aria-hidden />
                    <h1 className="es-logo">
                        <img src="assets/ui/logo.svg" alt="Soccermon" width="1441" height="300" />
                    </h1>
                    {!hydrated ? (
                        <i className="es-top-slot" />
                    ) : firstVisit && !challenge ? (
                        <p className="es-tagline">{t('home.tagline')}</p>
                    ) : (
                        <Board />
                    )}
                </div>
                <div className="es-actions">
                    {/* "Fulano te chamou pro Duelo" (na Home o aviso por cima não aparece: fica aqui, onde todo mundo chega) */}
                    <FriendChallenge />
                    <ParkedRuns />
                    {confirm ? (
                        <div className="confirm-new es-confirm bc-surface">
                            <p>{t('home.confirmNew', { team: run?.teamName ?? '' })}</p>
                            <div className="row" style={{ justifyContent: 'center' }}>
                                <button
                                    type="button"
                                    className="btn primary"
                                    onClick={() => play(confirm.seed, confirm.mode)}
                                >
                                    {t('home.confirmYes')}
                                </button>
                                <button type="button" className="btn ghost" onClick={() => setConfirm(undefined)}>
                                    {t('common.ui.cancel')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <PlayBar main={main} sheet={plan.sheet.map(mode)} open={open} onOpen={setOpen} />
                    )}
                </div>
            </div>
        </ClockCtx.Provider>
    );
}
