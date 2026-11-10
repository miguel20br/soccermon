import { type CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { type PokemonInstance, viewInstance } from '../../engine/instance';
import { playHealJingle, playSfx, type SfxName } from '../../game/audio';
import { useT } from '../../i18n/react';
import { ClockCtx, useSceneClock } from '../ambientes/clock';
import { FieldSprite } from '../ambientes/FieldSprite';
import { realScale, useSceneScale } from '../ambientes/sprite-scale';
import {
    healPlan,
    REDUCED_MS,
    REEL_SYMS,
    type ReelSym,
    type SafariPlan,
    type SlotPlan,
    safariPlan,
    slotPlan,
    wheelPlan,
} from '../rota-reveal';
import { reduceMotionOn } from '../settings-sync';
import { uiZoom } from '../ui-zoom';
import '../rota-reveal.css';
import { pixelArt } from './EventSet';
import { FutCard } from './FutCard';
import { HudIcon } from './MatchHud';
import { MonIcon } from './MonIcon';

/**
 * As animações das casas da Rota (rota-indigo-2.md): o caça-níquel e a roleta do Cassino, a Safari Ball e a máquina de
 * cura do Centro. O resultado já veio do jogo; a cena só mostra. O movimento é CSS (tempos do roteiro em
 * `rota-reveal.ts`, nas variáveis `--t-*`); o JS só toca os sons na hora e troca o sprite (parado, andando). Um toque
 * pula pro fim (`skip`: as animações vão pro último quadro, como o Reduzir movimento) e só o último som toca.
 */

const ms = (n: number) => `${Math.round(n)}ms`;

/** Os sons do roteiro: cada um na sua hora; pulando, só os que ainda não tocaram e são do fim (`last`). */
type Cue = { at: number; sfx?: SfxName; pitch?: number; jingle?: boolean; last?: boolean };
function useCues(cues: Cue[], skip: boolean) {
    const played = useRef(new Set<number>());
    useEffect(() => {
        if (reduceMotionOn()) return;
        const ids = cues.map((c, i) =>
            window.setTimeout(
                () => {
                    if (played.current.has(i) || (skip && !c.last)) return;
                    played.current.add(i);
                    if (c.jingle) playHealJingle();
                    else if (c.sfx) playSfx(c.sfx, c.pitch ?? 1);
                },
                skip ? 0 : c.at,
            ),
        );
        return () => ids.forEach(clearTimeout);
    }, [cues, skip]);
}

/** Verdadeiro depois de `at` ms (ou já, pulando): pra trocar o que só o JS troca (o sprite andando). */
function useAfter(at: number, skip: boolean) {
    const [on, setOn] = useState(false);
    useEffect(() => {
        if (skip || reduceMotionOn()) {
            setOn(true);
            return;
        }
        const id = window.setTimeout(() => setOn(true), at);
        return () => clearTimeout(id);
    }, [at, skip]);
    return on;
}

/* ---------------- Cassino: o caça-níquel ---------------- */

const SYM_MON: Partial<Record<ReelSym, number>> = { pika: 25, psy: 54, slow: 79 };
function Sym({ s }: { s: ReelSym }) {
    const mon = SYM_MON[s];
    return (
        <span className={`rv-sym s-${s}`}>
            {mon ? <MonIcon id={mon} /> : <HudIcon kind={s === 'star' ? 'max' : 'coin'} />}
        </span>
    );
}

/**
 * A tira de um rolo, de cima pra baixo: o rolo gira pra baixo e para com o símbolo do resultado na linha (índice 1).
 * O de cima e o de baixo aparecem pela metade. No "quase" que não pagou, a estrela acabou de passar (fica logo embaixo).
 */
function reelStrip(plan: SlotPlan, i: number): ReelSym[] {
    const n = 3 + Math.round(plan.at[i] / 55);
    const strip = Array.from({ length: n }, (_, k) => REEL_SYMS[(k + i * 2) % REEL_SYMS.length]);
    strip[1] = plan.stops[i];
    // os vizinhos nunca iguais ao da linha (senão parece que parou em dois)
    strip[0] = REEL_SYMS[(REEL_SYMS.indexOf(plan.stops[i]) + 2) % REEL_SYMS.length];
    strip[2] =
        i === 2 && plan.near && plan.stops[2] !== 'star'
            ? 'star'
            : REEL_SYMS[(REEL_SYMS.indexOf(plan.stops[i]) + 3) % REEL_SYMS.length];
    return strip;
}

export function SlotReveal({ won, seedKey, skip }: { won: boolean; seedKey: string; skip: boolean }) {
    const plan = useMemo(() => slotPlan(won, seedKey), [won, seedKey]);
    const cues = useMemo<Cue[]>(
        () => [
            ...plan.at.map((at, i) => ({ at, sfx: 'kick' as const, pitch: 1.5 + i * 0.12 })),
            ...(won
                ? [0, 1, 2].map((k) => ({
                      at: plan.at[2] + 120 + k * 90,
                      sfx: 'select' as const,
                      pitch: 1 + k * 0.26,
                      last: true,
                  }))
                : [{ at: plan.at[2] + 120, sfx: 'thud' as const, last: true }]),
        ],
        [plan, won],
    );
    useCues(cues, skip);
    return (
        <div
            className={`rv-slot${won ? ' won' : ''}${plan.near ? ' near' : ''}`}
            style={{ '--t-end': ms(plan.at[2]) } as CSSProperties}
        >
            <i className="rv-slot-bulbs" />
            <span className="rv-reels">
                {plan.stops.map((_, i) => {
                    const strip = reelStrip(plan, i);
                    return (
                        <span
                            // biome-ignore lint/suspicious/noArrayIndexKey: os 3 rolos são fixos
                            key={i}
                            className={`rv-reel${i === 2 && plan.near ? ' slow' : ''}`}
                            style={
                                {
                                    '--from': strip.length - 2,
                                    '--dur': ms(plan.at[i]),
                                    '--t-near': ms(plan.at[1]),
                                } as CSSProperties
                            }
                        >
                            <span className="rv-bump">
                                <span className="rv-strip">
                                    {strip.map((s, k) => (
                                        // biome-ignore lint/suspicious/noArrayIndexKey: a tira não muda depois de montada
                                        <Sym key={k} s={s} />
                                    ))}
                                </span>
                            </span>
                        </span>
                    );
                })}
                <i className="rv-payline" />
            </span>
            <span className="rv-tray">
                {won &&
                    [0, 1, 2, 3, 4, 5].map((k) => (
                        <i key={k} className="rv-coin" style={{ '--k': k } as CSSProperties} />
                    ))}
            </span>
        </div>
    );
}

/* ---------------- Cassino: a roleta do balcão de prêmios ---------------- */

export function WheelReveal({
    won,
    chance,
    seedKey,
    card,
    skip,
}: {
    won: boolean;
    chance: number;
    seedKey: string;
    card?: PokemonInstance;
    skip: boolean;
}) {
    const plan = useMemo(() => wheelPlan(chance, won, seedKey), [chance, won, seedKey]);
    const cues = useMemo<Cue[]>(
        () => [
            // a bolinha batendo nos pinos, cada vez mais devagar
            ...[0, 180, 380, 600, 850, 1120, 1420, 1720].map((at, k) => ({
                at,
                sfx: 'select' as const,
                pitch: 0.7 - k * 0.02,
            })),
            { at: plan.stopAt, sfx: 'kick', pitch: 1.4, last: true },
            ...(won
                ? [{ at: plan.stopAt + 200, sfx: 'goal' as const, pitch: 1.2, last: true }]
                : [{ at: plan.stopAt + 200, sfx: 'thud' as const, last: true }]),
        ],
        [plan, won],
    );
    useCues(cues, skip);
    return (
        <div
            className={`rv-counter${won ? ' won' : ' lost'}`}
            style={
                {
                    '--slice': `${plan.slice}deg`,
                    '--turn': `${plan.turn}deg`,
                    '--t-stop': ms(plan.stopAt),
                } as CSSProperties
            }
        >
            {card && (
                <span className="rv-prize">
                    <FutCard inst={card} size="sm" />
                </span>
            )}
            <span className="rv-wheel-box">
                <span className="rv-wheel">
                    <i className="rv-wheel-ticks" />
                </span>
                <b className="rv-hub">{Math.round(chance * 100)}%</b>
                <i className="rv-pointer" />
            </span>
        </div>
    );
}

/* ---------------- Zona Safari: a Safari Ball ---------------- */

const SAFARI_BALL = pixelArt(
    `
    ...kkkk...
    ..kGGgGk..
    .kGgGGGgk.
    kGGGgGGGGk
    kkkkwwkkkk
    kTTkwwkTTk
    kTTTkkTTTk
    .kTTTTTTk.
    ..kTTTTk..
    ...kkkk...
    `,
    { k: '#1b1b26', G: '#4f9a3a', g: '#2e6b2e', w: '#f4f1e6', T: '#e0c98e' },
);

const safariVars = (p: SafariPlan) =>
    ({
        '--t-hit': ms(p.hitAt),
        '--t-land': ms(p.landAt),
        '--t-result': ms(p.resultAt),
        '--shakes': p.shakes,
        '--art': SAFARI_BALL.url,
    }) as CSSProperties;

export function SafariReveal({
    won,
    card,
    seedKey,
    out,
    skip,
}: {
    won: boolean;
    card: PokemonInstance;
    seedKey: string;
    /** Quem sai do banco pra ele entrar (o reserva escolhido). */
    out?: PokemonInstance;
    skip: boolean;
}) {
    const { t } = useT();
    const plan = useMemo(() => safariPlan(won, seedKey), [won, seedKey]);
    const clock = useSceneClock(true);
    // o selvagem é a cena inteira: uma escala acima da dos ambientes (ainda uma só na cena; a bola vai junto)
    const scale = Math.min(4, useSceneScale() + 1);
    const running = useAfter(plan.resultAt + 120, skip);
    const cues = useMemo<Cue[]>(
        () => [
            { at: 0, sfx: 'move', pitch: 1.3 },
            { at: plan.hitAt, sfx: 'status', pitch: 1.6 },
            { at: plan.landAt, sfx: 'post', pitch: 0.55 },
            ...plan.shakeAt.map((at) => ({ at: at + 120, sfx: 'post' as const, pitch: 0.5 })),
            won
                ? { at: plan.resultAt, sfx: 'select', pitch: 1.5, last: true }
                : { at: plan.resultAt, sfx: 'back', pitch: 0.9, last: true },
        ],
        [plan, won],
    );
    useCues(cues, skip);
    const name = viewInstance(card).displayName;
    return (
        <ClockCtx.Provider value={clock}>
            <div
                className={`rv-safari${won ? ' won' : ' lost'}`}
                style={{ ...safariVars(plan), '--sc': scale } as CSSProperties}
            >
                <span className="rv-wild">
                    <FieldSprite
                        id={card.speciesId}
                        shiny={card.shiny}
                        anim={!won && running ? 'Walk' : 'Idle'}
                        dir={!won && running ? 2 : 0}
                        scale={scale}
                    />
                </span>
                <span className="rv-arc-x">
                    <span className="rv-arc-y">
                        <i className="rv-ball" />
                    </span>
                </span>
                {won && (
                    <span className="rv-stars" aria-hidden>
                        <HudIcon kind="sparkle" />
                        <HudIcon kind="sparkle" />
                        <HudIcon kind="sparkle" />
                    </span>
                )}
                <i className="rv-burst" />
                <span className="ev-reveal-text rv-text">
                    <MonIcon id={card.speciesId} shiny={card.shiny} />
                    <span>
                        <b>{t(`longCup.reveal.${won ? 'pegou' : 'fugiu'}`).replace('{a}', name)}</b>
                        {won && out && (
                            <small>
                                {t('longCup.reveal.swap', { b: viewInstance(out).displayName })}
                                <MonIcon id={out.speciesId} shiny={out.shiny} className="rv-out" />
                            </small>
                        )}
                    </span>
                </span>
            </div>
        </ClockCtx.Provider>
    );
}

/* ---------------- Centro Pokémon: a máquina de cura ---------------- */

const BALL = pixelArt(
    `
    ..kkk..
    .krrrk.
    krrrrrk
    kkkwkkk
    kwwwwwk
    .kwwwk.
    ..kkk..
    `,
    { k: '#1b1b26', r: '#d83838', w: '#f4f1e6' },
);

/**
 * A máquina de cura no balcão: a bandeja com as 6 vagas das bolas (2 fileiras de 3, como nos jogos), a telinha verde e
 * o botão. As vagas ficam em x = 2, 10, 18 e y = 2, 10 (pixels da arte): as bolas do `HealReveal` caem nelas.
 */
const MACHINE = pixelArt(
    `
    kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk
    kssssssssssssssssssssssssssssssssk
    ksDDDDDDDsDDDDDDDsDDDDDDDsskkkkksk
    ksDDDDDDDsDDDDDDDsDDDDDDDsskGGGksk
    ksDDDDDDDsDDDDDDDsDDDDDDDsskGGGksk
    ksDDDDDDDsDDDDDDDsDDDDDDDsskGgGksk
    ksDDDDDDDsDDDDDDDsDDDDDDDsskGGGksk
    ksDDDDDDDsDDDDDDDsDDDDDDDsskGGGksk
    ksDDDDDDDsDDDDDDDsDDDDDDDsskkkkksk
    kssssssssssssssssssssssssssssssssk
    ksDDDDDDDsDDDDDDDsDDDDDDDssssssssk
    ksDDDDDDDsDDDDDDDsDDDDDDDssssssssk
    ksDDDDDDDsDDDDDDDsDDDDDDDsssrrsssk
    ksDDDDDDDsDDDDDDDsDDDDDDDsssrrsssk
    ksDDDDDDDsDDDDDDDsDDDDDDDssssssssk
    ksDDDDDDDsDDDDDDDsDDDDDDDssssssssk
    ksDDDDDDDsDDDDDDDsDDDDDDDssssssssk
    kssssssssssssssssssssssssssssssssk
    kSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSk
    kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk
    `,
    { k: '#1b1b26', s: '#d6d9e2', S: '#8a8fa0', D: '#5c6070', G: '#58c26b', g: '#c9f2c0', r: '#d83838' },
);
const machineTile = { '--art': MACHINE.url, '--w': MACHINE.w, '--h': MACHINE.h } as CSSProperties;

export function HealReveal({
    choice,
    team,
    out,
    skip,
}: {
    choice: 'amarelo' | 'voltar';
    /** As bolas na máquina: o time (até 6). */
    team: readonly PokemonInstance[];
    /** Quem estava fora (volta no "Tratar"). */
    out: readonly PokemonInstance[];
    skip: boolean;
}) {
    const { t } = useT();
    const plan = useMemo(() => healPlan(team.length), [team.length]);
    const clock = useSceneClock(true);
    const scale = useSceneScale();
    const awake = useAfter(plan.effectAt, skip);
    const cues = useMemo<Cue[]>(
        () => [
            ...plan.ballAt.map((at, i) => ({ at, sfx: 'select' as const, pitch: 1 + i * 0.12 })),
            { at: plan.jingleAt, jingle: true },
            choice === 'amarelo'
                ? { at: plan.effectAt + 150, sfx: 'back', pitch: 1.4, last: true }
                : { at: plan.effectAt, sfx: 'select', pitch: 1.7, last: true },
        ],
        [plan, choice],
    );
    useCues(cues, skip);
    return (
        <ClockCtx.Provider value={clock}>
            <div
                className={`rv-heal c-${choice}`}
                style={
                    {
                        '--t-jingle': ms(plan.jingleAt),
                        '--t-effect': ms(plan.effectAt),
                        '--t-done': ms(plan.doneAt),
                        '--ball': BALL.url,
                    } as CSSProperties
                }
            >
                <span className="rv-balls">
                    {plan.ballAt.map((at, i) => (
                        <i
                            // biome-ignore lint/suspicious/noArrayIndexKey: uma vaga da máquina por bola
                            key={i}
                            className="rv-hball"
                            style={{ '--t-ball': ms(at), '--col': i % 3, '--row': Math.floor(i / 3) } as CSSProperties}
                        />
                    ))}
                </span>
                {choice === 'amarelo' && (
                    <span className="rv-ycard" aria-hidden>
                        <i className="l" />
                        <i className="r" />
                    </span>
                )}
                {choice === 'voltar' && (
                    <span className="rv-back">
                        {out.slice(0, 3).map((p) => (
                            <span key={p.uid} className="rv-back-mon">
                                <FieldSprite
                                    id={p.speciesId}
                                    shiny={p.shiny}
                                    anim={awake ? 'Hop' : 'Idle'}
                                    start={awake ? clock.t || 1 : 0}
                                    play={awake}
                                    dir={0}
                                    scale={scale}
                                />
                            </span>
                        ))}
                    </span>
                )}
                <b className="ev-reveal-text rv-text rv-heal-text">{t('longCup.reveal.curou')}</b>
            </div>
        </ClockCtx.Provider>
    );
}

/** O Centro Pokémon (revisão de arte, U5): a parede creme com a faixa rosa e o piso de ladrilho, atrás da Joy. */
export function CenterSet() {
    return (
        <div className="evs evs-centro" aria-hidden>
            <i className="evs-wall" />
            <span className="evs-heart">
                <HudIcon kind="heart" />
            </span>
            <i className="evs-floor" />
        </div>
    );
}

/**
 * A Enfermeira Joy (sprite `nurse` do Showdown, 80x80) atrás do balcão, em escala inteira pela altura da cena (1x, 2x
 * ou 3x) e desfazendo o zoom do palco do PC (como o FieldSprite): 2x continua 2 pixels de tela por pixel da arte.
 */
export function CenterJoy() {
    const ref = useRef<HTMLSpanElement>(null);
    const [fit, setFit] = useState({ scale: 2, z: 1 });
    useLayoutEffect(() => {
        const scene = ref.current?.parentElement;
        if (!scene) return;
        const read = () => {
            // a altura na tela (com o zoom do palco): 1x numa cena baixa, 3x só numa bem alta
            const { width: w, height: h } = scene.getBoundingClientRect();
            const scale = h >= 330 && w >= 700 ? 3 : h >= 240 ? 2 : 1;
            const z = uiZoom(scene);
            setFit({ scale, z });
            // o balcão mede pela Joy (cobre ela da cintura pra baixo), em px do palco
            scene.style.setProperty('--joy-h', `${(80 * scale) / z}px`);
        };
        read();
        const ro = new ResizeObserver(read);
        ro.observe(scene);
        return () => ro.disconnect();
    }, []);
    const r = realScale(fit.scale, fit.z, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1);
    return (
        // a caixa fica no lugar (bottom/left no zoom do palco); a imagem dentro desfaz o zoom
        <span ref={ref} className="ev-joy">
            <img
                className="pixel"
                src="assets/trainers/nurse.png"
                alt=""
                style={{ width: 80 * r.css, height: 80 * r.css, zoom: r.zoom === 1 ? undefined : r.zoom }}
            />
        </span>
    );
}

/** O balcão e a máquina de cura, na frente da Joy (ela fica atrás do balcão, da cintura pra cima). */
export function CenterFront() {
    return (
        <span className="evs-centro-front" aria-hidden>
            <i className="evs-counter-c" />
            <i className="evs-machine" style={machineTile} />
        </span>
    );
}

/** As medidas do roteiro pra quem chama (quando a escolha vale). */
export const revealMs = {
    slot: (won: boolean, key: string) => (reduceMotionOn() ? REDUCED_MS : slotPlan(won, key).total),
    wheel: (chance: number, won: boolean, key: string) =>
        reduceMotionOn() ? REDUCED_MS : wheelPlan(chance, won, key).total,
    safari: (won: boolean, key: string) => (reduceMotionOn() ? REDUCED_MS : safariPlan(won, key).total),
    heal: (balls: number) => (reduceMotionOn() ? REDUCED_MS : healPlan(balls).total),
};
