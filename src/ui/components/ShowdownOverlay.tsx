import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { playCry } from '../../game/audio';
import { EventBus } from '../../game/EventBus';
import type { MatchShowdown } from '../../game/scenes/MatchScene';
import { dict } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { portraitSrc } from '../portrait';
import { reduceMotionOn } from '../reduce-motion';
import { FACE, lineAt, SHOWDOWN_MS, type ShowdownLine, showdownScript } from '../showdown-lines';
import { tvCut } from '../tv';
import { cardSprite } from './PokeCard';
import './showdown.css';

/**
 * Duelo da bicuda (motor 20): a cutscene no meio do jogo. O motor segura a partida (`AGENCY.showdown`) e a quadra roda
 * em 1x; a cutscene anda no relógio dela (`match:showdown-t`, ms desde o lance): a defesa aparece um instante, o corte
 * de TV entra, os dois frente a frente, as falas na caixa com o rosto de quem fala e o grito do goleiro; o corte sai
 * logo antes da bicuda (a quadra faz o chute e o gol), ou na hora se a reprodução passar dela (`match:showdown-end`).
 */
function Mon({ who, side, talking }: { who: MatchShowdown['gk']; side: 's' | 'g'; talking: boolean }) {
    const [w, setW] = useState(0);
    return (
        <div className={`sd-mon sd-mon-${side}${talking ? ' talking' : ''}`}>
            <img
                className="pixel"
                src={cardSprite(who)}
                alt={who.name}
                style={w ? { width: `calc(${w}px * var(--sd-k))` } : undefined}
                onLoad={(e) => setW(e.currentTarget.naturalWidth)}
            />
        </div>
    );
}

export function ShowdownOverlay() {
    const { d } = useT();
    const [sd, setSd] = useState<MatchShowdown | null>(null);
    const [lines, setLines] = useState<ShowdownLine[]>([]);
    const [at, setAt] = useState(-1);
    const [leaving, setLeaving] = useState(false);
    const open = useRef(false);

    useEffect(() => {
        let cue: MatchShowdown | null = null;
        let script: ShowdownLine[] = [];
        let shown = -1;
        let fade = 0;
        const done = () => {
            open.current = false;
            setSd(null);
            setLeaving(false);
            setAt(-1);
        };
        const close = () => {
            cue = null;
            if (!open.current) return;
            if (!tvCut(done)) {
                setLeaving(true);
                clearTimeout(fade);
                fade = window.setTimeout(done, SHOWDOWN_MS.fade);
            }
        };
        const onShowdown = (c: MatchShowdown) => {
            cue = c;
            script = showdownScript(c.shooter, c.gk, c.tick, dict().showdown);
            shown = -1;
            setLines(script);
            setAt(-1);
            setLeaving(false);
        };
        const onTime = (t: number) => {
            const c = cue;
            if (!c) return;
            if (t >= c.ms - SHOWDOWN_MS.exit) {
                close();
                return;
            }
            if (t >= SHOWDOWN_MS.lead && !open.current) {
                open.current = true;
                if (!tvCut(() => setSd(c))) setSd(c);
            }
            const i = lineAt(t, c.ms, script.length);
            if (i === shown || i < 0) return;
            shown = i;
            setAt(i);
            const last = i === script.length - 1;
            const mon = script[i].who === 's' ? c.shooter : c.gk;
            playCry(mon.speciesId, useGame.getState().settings.cries, last ? 1 : 0.55, last ? 1.15 : 1);
        };
        EventBus.on('match:showdown', onShowdown);
        EventBus.on('match:showdown-t', onTime);
        EventBus.on('match:showdown-end', close);
        EventBus.on('match:ended', close);
        return () => {
            EventBus.off('match:showdown', onShowdown);
            EventBus.off('match:showdown-t', onTime);
            EventBus.off('match:showdown-end', close);
            EventBus.off('match:ended', close);
            clearTimeout(fade);
        };
    }, []);

    if (!sd) return null;
    const line = at >= 0 ? lines[at] : null;
    const last = at === lines.length - 1;
    const who = line?.who === 's' ? sd.shooter : sd.gk;
    const face = !line ? [] : last ? FACE.shout : line.who === 'g' ? FACE.g : at > 0 ? FACE.s2 : FACE.s;
    // Reduzir movimento: a fala vem inteira (a caixa só faz o fade)
    const step =
        line && !reduceMotionOn() ? Math.min(SHOWDOWN_MS.char, SHOWDOWN_MS.type / Math.max(1, line.text.length)) : 0;
    return (
        <div
            className={`sd-overlay${leaving ? ' sd-leaving' : ''}${last ? ' sd-shout' : ''}`}
            style={{ '--sc': sd.shooter.color, '--gc': sd.gk.color } as CSSProperties}
            role="dialog"
            aria-modal="true"
            aria-label={d.showdown.tag}
        >
            <div className="sd-bg" aria-hidden />
            <div className="sd-head">
                <span className="bc-tag">{d.showdown.tag}</span>
            </div>
            <div className="sd-stage">
                <Mon who={sd.shooter} side="s" talking={line?.who === 's'} />
                <Mon who={sd.gk} side="g" talking={line?.who === 'g'} />
            </div>
            <div className="sd-dock" aria-live="polite">
                {line && (
                    <div
                        key={at}
                        className={`sd-box sd-box-${line.who}${last ? ' sd-box-shout' : ''}`}
                        style={{ '--tc': who.color } as CSSProperties}
                    >
                        <img className="pixel sd-face" src={portraitSrc(who.speciesId, face)} alt="" />
                        <div className="sd-talk">
                            <b className="sd-name">{who.name}</b>
                            <p className="sd-text">
                                <span className="sr-only">{line.text}</span>
                                <span aria-hidden>
                                    {[...line.text].map((c, i) => (
                                        // biome-ignore lint/suspicious/noArrayIndexKey: as letras da fala não mudam de lugar
                                        <span key={i} className="sd-ch" style={{ animationDelay: `${i * step}ms` }}>
                                            {c}
                                        </span>
                                    ))}
                                </span>
                            </p>
                        </div>
                    </div>
                )}
            </div>
            {last && <div className="sd-flash" aria-hidden />}
        </div>
    );
}
