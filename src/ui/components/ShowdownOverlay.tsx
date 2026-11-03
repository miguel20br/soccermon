import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { playCry } from '../../game/audio';
import { EventBus } from '../../game/EventBus';
import type { MatchShowdown } from '../../game/scenes/MatchScene';
import { dict } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { portraitSrc } from '../portrait';
import { reduceMotionOn } from '../reduce-motion';
import { type ShowdownLine, showdownScript } from '../showdown-lines';
import { tvCut } from '../tv';
import { cardSprite } from './PokeCard';
import './showdown.css';

/**
 * Duelo da bicuda (motor 20): a cutscene no meio do jogo. O motor segura a partida (`AGENCY.showdown`) e a quadra roda
 * em 1x; aqui, no tempo real dessa parada: a defesa aparece um instante, o corte de TV entra, os dois frente a frente,
 * as falas na caixa com o rosto de quem fala e o grito do goleiro; o corte sai logo antes da bicuda (a quadra faz o
 * chute e o gol). Sai antes se a reprodução passar da bicuda (`match:showdown-end`).
 */
const LEAD_MS = 600;
/** A 1ª fala entra aqui; o grito fica `SHOUT_MS` na tela e o corte sai `EXIT_MS` antes da bicuda. */
const TALK_AT_MS = 1000;
const SHOUT_MS = 1400;
const EXIT_MS = 420;
/** Uma letra a cada `CHAR_MS` (a fala inteira em até `TYPE_MAX_MS`). */
const CHAR_MS = 26;
const TYPE_MAX_MS = 900;
/** Fade de quem não tem o corte (Reduzir movimento). */
const FADE_MS = 250;

/** Rosto PMD de cada fala: quem chutou se espanta, o goleiro encara, quem chutou de novo bufa e o grito. */
const FACE = {
    s: ['surprised', 'pain', 'sad'],
    s2: ['sigh', 'angry', 'sad'],
    g: ['determined', 'happy'],
    shout: ['shouting', 'determined', 'angry'],
};

let timers: number[] = [];
const clear = () => {
    for (const t of timers) clearTimeout(t);
    timers = [];
};
const later = (ms: number, fn: () => void) => {
    timers.push(window.setTimeout(fn, ms));
};

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
        const done = () => {
            open.current = false;
            setSd(null);
            setLeaving(false);
            setAt(-1);
        };
        const close = () => {
            clear();
            if (!open.current) return;
            if (!tvCut(done)) {
                setLeaving(true);
                later(FADE_MS, done);
            }
        };
        const onShowdown = (cue: MatchShowdown) => {
            clear();
            const script = showdownScript(cue.shooter, cue.gk, cue.tick, dict().showdown);
            const cries = useGame.getState().settings.cries;
            setLines(script);
            setAt(-1);
            setLeaving(false);
            later(LEAD_MS, () => {
                open.current = true;
                if (!tvCut(() => setSd(cue))) setSd(cue);
            });
            // as falas dividem o tempo até o grito; o grito fica com o fim
            const last = script.length - 1;
            const shoutAt = cue.ms - EXIT_MS - SHOUT_MS;
            const step = (shoutAt - TALK_AT_MS) / last;
            script.forEach((l, i) => {
                later(i < last ? TALK_AT_MS + step * i : shoutAt, () => {
                    setAt(i);
                    const mon = l.who === 's' ? cue.shooter : cue.gk;
                    playCry(mon.speciesId, cries, i === last ? 1 : 0.55, i === last ? 1.15 : 1);
                });
            });
            later(cue.ms - EXIT_MS, close);
        };
        EventBus.on('match:showdown', onShowdown);
        EventBus.on('match:showdown-end', close);
        EventBus.on('match:ended', close);
        return () => {
            EventBus.off('match:showdown', onShowdown);
            EventBus.off('match:showdown-end', close);
            EventBus.off('match:ended', close);
            clear();
        };
    }, []);

    if (!sd) return null;
    const line = at >= 0 ? lines[at] : null;
    const last = at === lines.length - 1;
    const who = line?.who === 's' ? sd.shooter : sd.gk;
    const face = !line ? [] : last ? FACE.shout : line.who === 'g' ? FACE.g : at > 0 ? FACE.s2 : FACE.s;
    // Reduzir movimento: a fala vem inteira (a caixa só faz o fade)
    const step = line && !reduceMotionOn() ? Math.min(CHAR_MS, TYPE_MAX_MS / Math.max(1, line.text.length)) : 0;
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
