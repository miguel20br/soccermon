import { type CSSProperties, useEffect, useState } from 'react';
import { playCry } from '../../game/audio';
import { EventBus } from '../../game/EventBus';
import type { MatchShowdown } from '../../game/scenes/MatchScene';
import { dict } from '../../i18n';
import { useT } from '../../i18n/react';
import { useGame } from '../../store/game-store';
import { portraitSrc } from '../portrait';
import { reduceMotionOn } from '../reduce-motion';
import { FACE, lineAt, SHOWDOWN_MS, type ShowdownLine, showdownScript } from '../showdown-lines';
import './showdown.css';

/**
 * Duelo da bicuda (motor 21): a caixa das falas, estilo PMD, por cima da quadra escurecida. A cena é da quadra
 * (MatchScene.ts, `stageShowdown`: o tempo parado no contato, a câmera de cinema, o COUNTER! e a bicuda); aqui só a fala
 * da vez, com o rosto de quem fala, no relógio da quadra (`match:showdown-t`, ms desde o lance). A caixa sai `SHOWDOWN_MS.exit` antes da bicuda, ou
 * na hora se a reprodução passar dela (`match:showdown-end`).
 */
export function ShowdownOverlay() {
    const { d } = useT();
    const [sd, setSd] = useState<MatchShowdown | null>(null);
    const [lines, setLines] = useState<ShowdownLine[]>([]);
    const [at, setAt] = useState(-1);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        let cue: MatchShowdown | null = null;
        let script: ShowdownLine[] = [];
        let shown = -1;
        let fade = 0;
        const close = () => {
            if (!cue) return;
            cue = null;
            setLeaving(true);
            clearTimeout(fade);
            fade = window.setTimeout(() => {
                setSd(null);
                setAt(-1);
                setLeaving(false);
            }, SHOWDOWN_MS.fade);
        };
        const onShowdown = (c: MatchShowdown) => {
            clearTimeout(fade);
            cue = c;
            script = showdownScript(c.shooter, c.gk, c.tick, dict().showdown);
            shown = -1;
            setLines(script);
            setAt(-1);
            setLeaving(false);
            setSd(c);
        };
        const onTime = (t: number) => {
            const c = cue;
            if (!c) return;
            if (t >= c.ms - SHOWDOWN_MS.exit) {
                close();
                return;
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

    const line = sd && at >= 0 ? lines[at] : null;
    if (!sd || !line) return null;
    const last = at === lines.length - 1;
    const who = line.who === 's' ? sd.shooter : sd.gk;
    const face = last ? FACE.shout : line.who === 'g' ? FACE.g : at > 0 ? FACE.s2 : FACE.s;
    // Reduzir movimento: a fala vem inteira (a caixa só faz o fade)
    const step = reduceMotionOn() ? 0 : Math.min(SHOWDOWN_MS.char, SHOWDOWN_MS.type / Math.max(1, line.text.length));
    return (
        <section className={`sd-dock${leaving ? ' sd-leaving' : ''}`} aria-label={d.showdown.tag} aria-live="polite">
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
        </section>
    );
}
