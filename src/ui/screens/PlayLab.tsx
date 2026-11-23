import type Phaser from 'phaser';
import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { withConfig } from '../../engine/config';
import { emptyInput, HumanDriver, type PlayButton } from '../../engine/controllers/human-input';
import { aiDraftTeam } from '../../engine/draft';
import { Rng } from '../../engine/rng';
import { LiveRunner } from '../../engine/runners/live-runner';
import type { TeamSetup } from '../../engine/state';
import { v } from '../../engine/vec';
import '../play-lab.css';

/**
 * Modo jogável, prévia (`?lab=jogavel`, só dev e prévias): amistoso rápido (2 tempos de 90 s de jogo) entre dois times
 * prontos, você controla um Pokémon de linha e o resto segue a IA. Não toca no save, na copa, na Liga nem no Duelo.
 * `&seed=` troca os times; `&toque=1` força os controles de toque.
 */
const COLORS: [number, number] = [0x3a7bd5, 0xe0483e];
const HALF_SECONDS = 90;

const team = (seed: string, name: string, color: number): TeamSetup => ({
    name,
    ...aiDraftTeam(new Rng(seed, 'team'), 2, []),
    tactic: 'balanced',
    color,
});

/** Tecla → botão (teclado). Setas/WASD movem; Shift anda. */
const KEYS: Record<string, PlayButton> = {
    KeyJ: 'pass',
    KeyZ: 'pass',
    KeyK: 'shoot',
    KeyX: 'shoot',
    KeyL: 'action',
    KeyC: 'action',
    KeyE: 'move',
    KeyQ: 'switch',
    Space: 'switch',
};
const DIRS: Record<string, [number, number]> = {
    ArrowUp: [0, -1],
    KeyW: [0, -1],
    ArrowDown: [0, 1],
    KeyS: [0, 1],
    ArrowLeft: [-1, 0],
    KeyA: [-1, 0],
    ArrowRight: [1, 0],
    KeyD: [1, 0],
};

export function PlayLab({ onExit }: { onExit: () => void }) {
    const [round, setRound] = useState(0);
    return <PlayMatch key={round} onExit={onExit} onAgain={() => setRound((r) => r + 1)} />;
}

function PlayMatch({ onExit, onAgain }: { onExit: () => void; onAgain: () => void }) {
    const [params] = useState(() => new URLSearchParams(window.location.search));
    const [match] = useState(() => {
        const seed = params.get('seed') ?? 'jogavel';
        const runner = new LiveRunner(
            withConfig({ halfSeconds: HALF_SECONDS }),
            team(`${seed}-casa`, 'Seu time', COLORS[0]),
            team(`${seed}-rival`, 'Rival', COLORS[1]),
            seed,
        );
        return { runner, driver: new HumanDriver(runner, 0), input: emptyInput() };
    });
    const host = useRef<HTMLDivElement>(null);
    const [hud, setHud] = useState({ score: [0, 0], minute: 0, done: false });
    const touch = params.get('toque') === '1' || window.matchMedia('(pointer: coarse)').matches;

    // o Phaser e a cena vêm por import dinâmico (fora do pedaço da Home)
    useEffect(() => {
        let game: Phaser.Game | null = null;
        let dead = false;
        void (async () => {
            const [{ default: P }, { PlayScene }] = await Promise.all([
                import('phaser'),
                import('../../game/scenes/PlayScene'),
            ]);
            if (dead || !host.current) return;
            game = new P.Game({
                type: P.AUTO,
                parent: host.current,
                width: host.current.clientWidth,
                height: host.current.clientHeight,
                pixelArt: true,
                backgroundColor: '#7a4a2a',
                scale: { mode: P.Scale.RESIZE },
                audio: { noAudio: true },
            });
            game.scene.add('Play', PlayScene, true, { ...match, colors: COLORS });
        })();
        return () => {
            dead = true;
            game?.destroy(true);
        };
    }, [match]);

    // placar e relógio: lidos do motor 5x por segundo
    useEffect(() => {
        const id = window.setInterval(() => {
            const snap = match.runner.snapshot();
            setHud({ score: snap.score, minute: snap.minute, done: match.runner.finished });
        }, 200);
        return () => window.clearInterval(id);
    }, [match]);

    // teclado: direção pelas teclas seguradas, botões no keydown (sem repetir)
    useEffect(() => {
        const held = new Set<string>();
        const aim = () => {
            let x = 0;
            let y = 0;
            for (const k of held) {
                const d = DIRS[k];
                if (d) {
                    x += d[0];
                    y += d[1];
                }
            }
            const n = Math.hypot(x, y) || 1;
            match.input.dir = v(Math.sign(x) / n, Math.sign(y) / n);
            match.input.walk = held.has('ShiftLeft') || held.has('ShiftRight');
        };
        const down = (e: KeyboardEvent) => {
            if (DIRS[e.code] || KEYS[e.code]) e.preventDefault();
            if (KEYS[e.code] && !e.repeat) match.input.pressed.push(KEYS[e.code]);
            held.add(e.code);
            aim();
        };
        const up = (e: KeyboardEvent) => {
            held.delete(e.code);
            aim();
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => {
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
        };
    }, [match]);

    const press = (b: PlayButton) => (e: ReactPointerEvent) => {
        e.preventDefault();
        match.input.pressed.push(b);
    };

    return (
        <div className="pl">
            <div ref={host} className="pl-stage" />
            <div className="pl-top">
                <button type="button" className="btn small" onClick={onExit}>
                    Sair
                </button>
                <span className="pl-score">
                    <i style={{ background: '#3a7bd5' }} />
                    {hud.score[0]} x {hud.score[1]}
                    <i style={{ background: '#e0483e' }} />
                </span>
                <span className="pl-clock">{Math.floor(hud.minute)}'</span>
            </div>
            {touch ? (
                <>
                    <Stick input={match.input} />
                    <div className="pl-buttons">
                        <button type="button" className="pl-btn pl-switch" onPointerDown={press('switch')}>
                            Trocar
                        </button>
                        <button type="button" className="pl-btn pl-action" onPointerDown={press('action')}>
                            Drible
                            <small>golpe</small>
                        </button>
                        <button type="button" className="pl-btn pl-pass" onPointerDown={press('pass')}>
                            Passe
                        </button>
                        <button type="button" className="pl-btn pl-shoot" onPointerDown={press('shoot')}>
                            Chute
                        </button>
                    </div>
                </>
            ) : (
                <p className="pl-keys">
                    Setas/WASD mover · Shift andar · J passe · K chute · L drible/desarme · E golpe · Q trocar
                </p>
            )}
            {hud.done && (
                <div className="pl-end">
                    <p>
                        Fim de jogo: {hud.score[0]} x {hud.score[1]}
                    </p>
                    <button type="button" className="btn confirm" onClick={onAgain}>
                        Jogar de novo
                    </button>
                    <button type="button" className="btn" onClick={onExit}>
                        Sair
                    </button>
                </div>
            )}
        </div>
    );
}

/** Analógico virtual: o vetor do centro até o dedo, até o raio (|dir| ≤ 1); pouco empurrado = andar. */
function Stick({ input }: { input: ReturnType<typeof emptyInput> }) {
    const base = useRef<HTMLDivElement>(null);
    const [knob, setKnob] = useState({ x: 0, y: 0 });
    const R = 48;
    const move = (e: ReactPointerEvent) => {
        const r = base.current?.getBoundingClientRect();
        if (!r) return;
        let x = (e.clientX - (r.left + r.width / 2)) / R;
        let y = (e.clientY - (r.top + r.height / 2)) / R;
        const n = Math.hypot(x, y);
        if (n > 1) {
            x /= n;
            y /= n;
        }
        input.dir = v(x, y);
        input.walk = n < 0.6;
        setKnob({ x: x * R, y: y * R });
    };
    const end = () => {
        input.dir = v(0, 0);
        setKnob({ x: 0, y: 0 });
    };
    return (
        <div
            ref={base}
            className="pl-stick"
            onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                move(e);
            }}
            onPointerMove={(e) => e.buttons && move(e)}
            onPointerUp={end}
            onPointerCancel={end}
        >
            <span className="pl-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
        </div>
    );
}
