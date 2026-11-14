import Phaser from 'phaser';
import { useEffect, useRef, useState } from 'react';
import { species } from '../../engine/data';
import { StoryScene } from '../../game/scenes/StoryScene';
import { ART_H, ART_W } from '../../game/story-art';
import { getLang } from '../../i18n';
import { useGame } from '../../store/game-store';
import type { SceneScript } from '../../story/director';
import { palletChoice, palletOpening, STARTERS, type Starter } from '../../story/scenes/pallet';
import { HudIcon } from '../components/MatchHud';
import { MenuHead } from '../components/MenuHead';
import { portraitSrc } from '../portrait';
import { reduceMotionOn } from '../reduce-motion';
import '../story-lab.css';

type Phase = 'play' | 'pick' | 'end';

/**
 * `?lab=cenas` (dev e prévias): o diretor de cena tocando a abertura em Pallet (docs/planos/historia.md). No meio, a
 * cena entrega pro draft dos iniciais; aqui é um 1 de 3 simples no lugar da tela de verdade. `&reduzir=1` força o
 * Reduzir movimento; `&inicial=4` escolhe sozinho no draft (gravação).
 */
export function StoryLab({ onExit }: { onExit: () => void }) {
    const host = useRef<HTMLDivElement>(null);
    const game = useRef<Phaser.Game | null>(null);
    const scale = useRef(1);
    const [phase, setPhase] = useState<Phase>('play');
    const [canSkip, setCanSkip] = useState(false);
    const [run, setRun] = useState(0);
    const params = new URLSearchParams(window.location.search);
    const reduce = params.get('reduzir') === '1' || reduceMotionOn();
    const auto = Number(params.get('inicial')) as Starter;

    const scene = () => game.current?.scene.getScene('Story') as StoryScene | undefined;

    const start = (script: SceneScript) => {
        setPhase('play');
        setCanSkip(false);
        window.setTimeout(() => setCanSkip(true), 500);
        const data = {
            script,
            lang: getLang(),
            reduce,
            cries: useGame.getState().settings.cries,
            zoom: scale.current,
            onEvent: (e: 'handoff' | 'end') => {
                if (e === 'end') return setPhase('end');
                if (STARTERS.includes(auto)) start(palletChoice(auto));
                else setPhase('pick');
            },
        };
        const s = scene();
        if (s) s.scene.restart(data);
        else game.current?.scene.add('Story', StoryScene, true, data);
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: monta o jogo uma vez por "Rever"
    useEffect(() => {
        const el = host.current;
        if (!el) return;
        let dead = false;
        // escala inteira: cada pixel de arte vira k×k pixels da tela, o maior k que cabe (o resto vira moldura)
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        const k = Math.max(1, Math.floor(Math.min((el.clientWidth * dpr) / ART_W, (el.clientHeight * dpr) / ART_H)));
        scale.current = k;
        void Promise.all([document.fonts.load('15px Galmuri11'), document.fonts.load('bold 30px Galmuri11')])
            .catch(() => {})
            .then(() => {
                if (dead) return;
                game.current = new Phaser.Game({
                    type: Phaser.AUTO,
                    width: ART_W * k,
                    height: ART_H * k,
                    parent: el,
                    pixelArt: true,
                    backgroundColor: '#070a18',
                    scale: { mode: Phaser.Scale.NONE, zoom: 1 / dpr },
                    audio: { noAudio: true },
                    banner: false,
                });
                // só no dev: gravação quadro a quadro (game.loop.sleep + game.step), como a do trailer
                if (import.meta.env.DEV)
                    (window as unknown as { __soccermonGame?: Phaser.Game }).__soccermonGame = game.current;
                start(palletOpening);
            });
        return () => {
            dead = true;
            game.current?.destroy(true);
            game.current = null;
        };
    }, [run]);

    return (
        <div className="menu-screen story-lab">
            <MenuHead title="Cenas · Abertura em Pallet" icon="cards" onBack={onExit} />
            <p className="muted">
                O diretor de cena tocando a Cena 1 do Modo história. Toque no palco pra adiantar; Pular vai pro fim. No
                meio entra o draft dos iniciais (aqui, um 1 de 3 simples).
            </p>
            <div className="story-stage">
                <div ref={host} className="story-canvas" />
                {phase === 'play' && canSkip && (
                    <button type="button" className="btn small story-skip" onClick={() => scene()?.skip()}>
                        Pular
                        <HudIcon kind="next" />
                    </button>
                )}
                {phase === 'pick' && (
                    <div className="story-pick">
                        <b className="bc-caption">Escolha seu inicial</b>
                        <div className="story-pick-row">
                            {STARTERS.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    className="story-pick-mon"
                                    onClick={() => start(palletChoice(s))}
                                >
                                    <img
                                        className="pixel"
                                        src={portraitSrc(s, ['happy'])}
                                        alt=""
                                        width={64}
                                        height={64}
                                    />
                                    <span>{species(s).name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {phase === 'end' && (
                    <div className="story-pick">
                        <button type="button" className="btn primary" onClick={() => setRun((r) => r + 1)}>
                            <HudIcon kind="reroll" />
                            Rever do começo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
